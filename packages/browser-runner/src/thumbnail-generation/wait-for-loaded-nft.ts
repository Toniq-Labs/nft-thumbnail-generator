import {PromiseTimeoutError, joinUrlParts, wait, wrapPromiseInTimeout} from '@augment-vir/common';
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
};

export async function waitForLoadedNft({
    frameLocator,
    doneLoadingLocator,
    nftId,
    waitForAllPageRequests,
    maxLoadTime,
    externalContentUrlOrigin,
    externalContentUrlPath,
}: WaitForLoadedNftInputs) {
    try {
        await wrapPromiseInTimeout(
            maxLoadTime.milliseconds,
            (async (): Promise<void> => {
                const settleWaiter = frameLocator.evaluate((element) => {
                    return new Promise<void>((resolve) => {
                        function settleListener(event: Event) {
                            if ((event as CustomEvent<boolean>).detail === true) {
                                element.removeEventListener('settle', settleListener);
                                resolve();
                            }
                        }

                        element.addEventListener('settle', settleListener, {passive: true});
                    });
                });
                const fullExternalContentUrl: string = joinUrlParts(
                    externalContentUrlOrigin,
                    externalContentUrlPath,
                    nftId,
                );

                await frameLocator.evaluate((element, nftUrl) => {
                    (element as DeclarativeElement).instanceInputs.nftUrl = nftUrl;
                }, fullExternalContentUrl);

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
        throw error;
    }
}
