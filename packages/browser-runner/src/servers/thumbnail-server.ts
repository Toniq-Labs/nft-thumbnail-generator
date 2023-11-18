import {
    AnyFunction,
    ArrayElement,
    Overwrite,
    createDeferredPromiseWrapper,
    isRuntimeTypeOf,
    mergeDeep,
    wait,
} from '@augment-vir/common';
import {addExitCallback} from 'catch-exit';
import nodeCluster, {Worker} from 'cluster';
import express from 'express';
import expressCluster from 'express-cluster';
import {log} from '../log';
import {
    PageContext,
    navigateToUrl,
    setupBrowserPage,
    startupBrowser,
} from '../thumbnail-generation/browser-control';
import {
    ThumbnailGenerationInput,
    generateNftThumbnail,
} from '../thumbnail-generation/generate-thumbnail';
import {isOriginServerUp} from './check-origin';
import {HttpResult, HttpStatusCodeEnum} from './http-result';
import {getThumbnailCache, populateInvalidNftCache} from './thumbnail-cache';
import {ThumbnailServerConfig} from './thumbnail-server-config';
import {formViteUrl, startViteServer} from './vite-server';

type ClusterConfig = Overwrite<
    Exclude<ArrayElement<Parameters<typeof expressCluster>>, AnyFunction>,
    {workerListener(this: Worker, message: string): void}
>;

async function runThumbnailGeneration({
    nftId,
    thumbnailConfig,
    pageContext,
    bypassLoading,
}: {
    nftId: string | undefined;
    thumbnailConfig: Pick<
        ThumbnailServerConfig,
        Extract<keyof ThumbnailGenerationInput, keyof ThumbnailServerConfig>
    >;
    pageContext: PageContext;
    bypassLoading: boolean;
}): Promise<HttpResult> {
    if (!nftId) {
        return {
            /** Bad Request. */
            code: HttpStatusCodeEnum.BadRequest,
            value: 'missing NFT id',
        };
    }

    const generationConfig: ThumbnailGenerationInput = {
        ...thumbnailConfig,
        ...pageContext,
        bypassLoading,
        nftId,
    };
    const thumbnail = await generateNftThumbnail(generationConfig);

    return {
        /** Okay Request. */
        code: HttpStatusCodeEnum.Success,
        value: thumbnail,
    };
}

const workerStartedMessage = 'worker started';

export const thumbnailEndpointPath = 'thumbnail';

export async function startThumbnailCluster(
    initServerConfig: ThumbnailServerConfig,
): Promise<boolean> {
    /** This will only increment on the master server. */
    let workerCount = 0;
    const allWorkersStartedDeferredPromise = createDeferredPromiseWrapper<void>();

    const clusterConfig: ClusterConfig = {
        count: initServerConfig.workerCount,
        verbose: false,
        respawn: false,
        workerListener(message: string) {
            if (message === workerStartedMessage) {
                workerCount++;
                if (workerCount === initServerConfig.workerCount) {
                    log.info(`All ${workerCount} workers started.`);
                    allWorkersStartedDeferredPromise.resolve();
                }
            }
        },
    };

    expressCluster(async (worker) => {
        try {
            addExitCallback(() => {
                log.warn(`Closing server on worker ${worker.id}, process ${worker.process.pid}`);
                try {
                    server.closeAllConnections();
                    server.close();
                } catch (error) {}
            });

            log.info(`Spawning express cluster worker ${worker.id}, process ${worker.process.pid}`);
            const expressApp = express();

            const serverConfig = mergeDeep(initServerConfig, {
                viteUrl: {
                    /** Each worker's vite port needs to be unique. */
                    port: initServerConfig.viteUrl.port + worker.id,
                },
            });

            const [
                browserContext,
            ] = await Promise.all([
                startupBrowser(serverConfig.browserConfig),
                startViteServer(serverConfig),
            ]);

            const retryCount: Record<string, number> = {};

            async function runQueuedThumbnailGeneration(nftId: string): Promise<HttpResult> {
                if (!(await isOriginServerUp(serverConfig.externalContentUrlOrigin))) {
                    return {
                        code: HttpStatusCodeEnum.ServiceUnavailable,
                        value: 'Content server is down',
                    };
                }

                const cacheResult = await getThumbnailCache(nftId);

                if (cacheResult) {
                    log.info(`Using cached invalid result for: ${nftId}`);
                    return cacheResult;
                }

                const pageContext = await setupBrowserPage(browserContext);

                await navigateToUrl({
                    page: pageContext.page,
                    url: formViteUrl(serverConfig),
                });

                const responseDeferredPromise = createDeferredPromiseWrapper<void>();

                const shouldKeepTrying = (retryCount[nftId] || 0) < serverConfig.maxAttempts;
                try {
                    responseDeferredPromise.promise.finally(async () => {
                        await pageContext.page.close();
                    });

                    const startTime = Date.now();
                    const result = await runThumbnailGeneration({
                        nftId,
                        thumbnailConfig: serverConfig,
                        pageContext,
                        bypassLoading: !shouldKeepTrying,
                    });

                    if (!shouldKeepTrying) {
                        if (!isRuntimeTypeOf(result.value, 'string')) {
                            await populateInvalidNftCache(nftId, result.value);
                        }
                    }

                    const endTime = Date.now();
                    const diffTime = {seconds: ((endTime - startTime) / 1000).toFixed(1)};
                    log.info(`${nftId} took ${diffTime.seconds} seconds`);

                    responseDeferredPromise.resolve();

                    return result;
                } catch (error) {
                    /** Don't reject this cause it'll cause the workers to crash. */
                    responseDeferredPromise.resolve();

                    // retries
                    if (shouldKeepTrying) {
                        if (retryCount[nftId]) {
                            retryCount[nftId]++;
                        } else {
                            retryCount[nftId] = 1;
                        }
                        log.warn(
                            error,
                            `retrying ${nftId}... (starting attempt #${
                                (retryCount[nftId] || 0) + 1
                            })`,
                        );
                        await wait(1000);
                        /**
                         * The last retry will run this with the assumption that the nft will error
                         * out, and return the invalid nft placeholder.
                         */
                        return await runQueuedThumbnailGeneration(nftId);
                    } else {
                        log.error(error, `retries exhausted`);
                        return {
                            code: HttpStatusCodeEnum.ServerError,
                            value: 'Thumbnail generation failed.',
                        };
                    }
                }
            }

            expressApp.get(`/${thumbnailEndpointPath}/:nftId`, async (request, response) => {
                const results = await runQueuedThumbnailGeneration(request.params.nftId);

                response.status(results.code).send(results.value);
            });
            expressApp.get('/health', (request, response) => {
                response.status(HttpStatusCodeEnum.Success).send('ok');
            });
            /** Errors fallback. */
            expressApp.use('*', (request, response) => {
                log.warn(`invalid URL: ${request.originalUrl} from ${request.ip}`);
                response.status(HttpStatusCodeEnum.Missing).send('Invalid endpoint.');
            });

            const server = expressApp.listen(serverConfig.expressPort);

            worker.send(workerStartedMessage);
            return server;
        } catch (error) {
            log.error(error);
            throw error;
        }
    }, clusterConfig as any);

    if (nodeCluster.isPrimary) {
        await allWorkersStartedDeferredPromise.promise;
        return true;
    } else {
        return false;
    }
}
