import {
    AnyFunction,
    ArrayElement,
    Overwrite,
    createDeferredPromiseWrapper,
    mergeDeep,
} from '@augment-vir/common';
import {addExitCallback} from 'catch-exit';
import nodeCluster, {Worker} from 'cluster';
import express, {Request, Response} from 'express';
import expressCluster from 'express-cluster';
import {log} from '../log';
import {PageContext, navigateToUrl, startupBrowser} from '../thumbnail-generation/browser-control';
import {
    ThumbnailGenerationInput,
    generateNftThumbnail,
} from '../thumbnail-generation/generate-thumbnail';
import {ThumbnailServerConfig} from './thumbnail-server-config';
import {formViteUrl, startViteServer} from './vite-server';

type ClusterConfig = Overwrite<
    Exclude<ArrayElement<Parameters<typeof expressCluster>>, AnyFunction>,
    {workerListener(this: Worker, message: string): void}
>;

async function runThumbnailEndpoint(
    nftId: string | undefined,
    thumbnailConfig: Pick<
        ThumbnailServerConfig,
        Extract<keyof ThumbnailGenerationInput, keyof ThumbnailServerConfig>
    >,
    pageContext: PageContext,
): Promise<{code: number; value: any}> {
    if (!nftId) {
        return {
            /** Bad Request. */
            code: 400,
            value: 'missing NFT id',
        };
    }

    const generationConfig: ThumbnailGenerationInput = {
        ...thumbnailConfig,
        ...pageContext,
        nftId,
    };
    const thumbnail = await generateNftThumbnail(generationConfig);

    return {
        /** Okay Request. */
        code: 200,
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
                log.info(`Closing server on worker ${worker.id}, process ${worker.process.pid}`);
                server.closeAllConnections();
                server.close();
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
                pageContext,
                viteServer,
            ] = [
                startupBrowser(serverConfig.browserConfig),
                startViteServer(serverConfig),
            ];

            await viteServer;
            await navigateToUrl({
                page: (await pageContext).page,
                url: formViteUrl(serverConfig),
            });

            let thumbnailQueue: Promise<void>[] = [];
            const retryCount: Record<string, number> = {};

            async function runQueuedThumbnailGeneration(
                request: Request<{
                    nftId: string;
                }>,
                response: Response,
            ) {
                const responseDeferredPromise = createDeferredPromiseWrapper<void>();
                const nftId = request.params.nftId;
                try {
                    responseDeferredPromise.promise.finally(() => {
                        if (thumbnailQueue[0] !== responseDeferredPromise.promise) {
                            log.error(`Oh no the queue got jumbled up!`);
                            thumbnailQueue = [];
                        }

                        thumbnailQueue.shift();
                    });

                    thumbnailQueue.push(responseDeferredPromise.promise);
                    const shouldWaitOnThese = thumbnailQueue.slice(0, -1);
                    if (shouldWaitOnThese.length) {
                        await Promise.allSettled(shouldWaitOnThese);
                    }

                    const startTime = Date.now();
                    const result = await runThumbnailEndpoint(
                        nftId,
                        serverConfig,
                        await pageContext,
                    );
                    const endTime = Date.now();
                    const diffTime = {seconds: ((endTime - startTime) / 1000).toFixed(1)};
                    log.info(`${nftId} took ${diffTime.seconds} seconds`);

                    responseDeferredPromise.resolve();

                    response.status(result.code).send(result.value);
                } catch (error) {
                    if (retryCount[nftId]) {
                        retryCount[nftId]++;
                    } else {
                        retryCount[nftId] = 1;
                    }

                    /** Don't reject this cause it'll cause the workers to crash. */
                    responseDeferredPromise.resolve();
                    log.error(error);

                    // retries
                    if ((retryCount[nftId] || 0) < 3) {
                        await runQueuedThumbnailGeneration(request, response);
                    } else {
                        response
                            .status(
                                /** Server Error. */
                                500,
                            )
                            .send('Thumbnail generation failed.');
                    }
                }
            }

            expressApp.get(`/${thumbnailEndpointPath}/:nftId`, runQueuedThumbnailGeneration);
            expressApp.get('/health', (request, response) => {
                response.status(200).send('ok');
            });
            /** Errors fallback. */
            expressApp.use('*', (request, response) => {
                log.warn(`invalid URL: ${request.originalUrl} from ${request.ip}`);
                response.status(404).send('Invalid endpoint.');
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
