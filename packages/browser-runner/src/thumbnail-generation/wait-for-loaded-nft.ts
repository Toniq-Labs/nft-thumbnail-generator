import {
    PromiseTimeoutError,
    joinUrlParts,
    wait,
    waitForCondition,
    wrapPromiseInTimeout,
} from '@augment-vir/common';
import type {NftFrameConfig} from '@toniq-labs/toniq-nft-frame';
import {Duration, DurationUnit} from 'date-vir';
import type {DeclarativeElement} from 'element-vir';
import type {Locator} from 'playwright';
import {log} from '../log';
import type {WaitForAllPageRequests} from './wait-for-all-page-requests';

export type WaitForLoadedNftInputs = {
    frameLocator: Locator;
    doneLoadingLocator: Locator;
    nftId: string;
    waitForAllPageRequests: WaitForAllPageRequests;
    maxLoadTime: Duration<DurationUnit.Milliseconds>;
    externalContentUrlOrigin: string;
    externalContentUrlPath: string;
    /**
     * If set to true, thumbnail generation won't wait for the content URL to load and it'll timeout
     * immediately, taking a screenshot of the error screen.
     */
    bypassLoading: boolean;
};

export async function waitForLoadedNft({
    frameLocator,
    doneLoadingLocator,
    nftId,
    waitForAllPageRequests,
    maxLoadTime,
    externalContentUrlOrigin,
    externalContentUrlPath,
    bypassLoading,
}: WaitForLoadedNftInputs) {
    try {
        await wrapPromiseInTimeout(
            maxLoadTime.milliseconds,
            (async (): Promise<void> => {
                await waitForCondition({
                    async conditionCallback() {
                        await frameLocator.isVisible();
                        return true;
                    },
                    intervalMs: 500,
                    timeoutMs: maxLoadTime.milliseconds,
                });
                const settleWaiter = frameLocator.evaluate((element) => {
                    return new Promise<void>((resolve) => {
                        function settleListener(event: Event) {
                            if ((event as CustomEvent<boolean>).detail === true) {
                                element.removeEventListener(
                                    'toniq-nft-frame-settle',
                                    settleListener,
                                );
                                resolve();
                            }
                        }

                        element.addEventListener('toniq-nft-frame-settle', settleListener, {
                            passive: true,
                        });
                    });
                });
                const fullExternalContentUrl: string = joinUrlParts(
                    externalContentUrlOrigin,
                    externalContentUrlPath,
                    nftId,
                );

                log.info(`Assigning NFT url ${fullExternalContentUrl}`);
                await frameLocator.evaluate(
                    (element, {nftUrl, timeoutDuration}) => {
                        (
                            (element as DeclarativeElement).instanceInputs as NftFrameConfig
                        ).timeoutDuration = timeoutDuration;
                        ((element as DeclarativeElement).instanceInputs as NftFrameConfig).nftUrl =
                            nftUrl;
                    },
                    {
                        nftUrl: fullExternalContentUrl,
                        timeoutDuration: bypassLoading ? {milliseconds: 0} : maxLoadTime,
                    },
                );

                await settleWaiter;
                await doneLoadingLocator.waitFor();

                await waitForAllPageRequests.allDone;

                /** Wait for a bit. */
                await wait(100);
            })(),
        );
    } catch (error) {
        if (error instanceof PromiseTimeoutError) {
            log.error(`Timed out waiting for full ${nftId} load.`);
        }
        if (!bypassLoading) {
            throw error;
        }
    }
}
