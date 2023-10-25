import {
    DeferredPromiseWrapper,
    MaybePromise,
    createDeferredPromiseWrapper,
} from '@augment-vir/common';
import {Page} from 'playwright';

/**
 * Tracks all network requests made by the given Page and keeps track of if they're all finished
 * with the allDone property, which can be awaited.
 */
export class WaitForAllPageRequests {
    public allDone: MaybePromise<true> = true;
    private deferredAllDonePromise: DeferredPromiseWrapper<true> | undefined;
    private resolveAllDoneTimeoutId: undefined | NodeJS.Timeout;
    private currentRequestCount: Record<string, number> = {};

    private cleanUpRequest(url: string) {
        if (!(url in this.currentRequestCount)) {
            throw new Error(`Request finished but had not been counted as started yet: ${url}`);
        }
        if (this.currentRequestCount[url] === 1) {
            delete this.currentRequestCount[url];
        } else {
            this.currentRequestCount[url]--;
        }

        if (!Object.keys(this.currentRequestCount).length) {
            if (this.resolveAllDoneTimeoutId) {
                clearTimeout(this.resolveAllDoneTimeoutId);
            }

            this.resolveAllDoneTimeoutId = setTimeout(() => {
                if (Object.keys(this.currentRequestCount).length) {
                    return;
                }

                if (!this.deferredAllDonePromise) {
                    throw new Error(
                        'Cleaning up a request but there was no deferred promise to resolve.',
                    );
                }
                this.deferredAllDonePromise.resolve(true);
                this.deferredAllDonePromise = undefined;
                this.allDone = true;
            }, 500);
        }
    }

    constructor(page: Readonly<Page>) {
        page.on('request', (request) => {
            if (this.resolveAllDoneTimeoutId) {
                clearTimeout(this.resolveAllDoneTimeoutId);
            }

            if (!(this.allDone instanceof Promise)) {
                this.deferredAllDonePromise = createDeferredPromiseWrapper();
                this.allDone = this.deferredAllDonePromise.promise;
            }

            const url = request.url();
            if (url in this.currentRequestCount) {
                this.currentRequestCount[url]++;
            } else {
                this.currentRequestCount[url] = 1;
            }
        });

        page.on('requestfailed', (request) => {
            this.cleanUpRequest(request.url());
        });

        page.on('requestfinished', (request) => {
            this.cleanUpRequest(request.url());
        });
    }
}
