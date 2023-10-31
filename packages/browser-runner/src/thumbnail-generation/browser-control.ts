import {waitForCondition} from '@augment-vir/common';
import {BrowserContext, Locator, Page, webkit} from 'playwright';
import {WaitForAllPageRequests} from './wait-for-all-page-requests';

export type BrowserStartupConfig = {
    /**
     * The dimensions here here should be _at least_ the maximum dimensions of your expected
     * thumbnails.
     */
    browserSize: {width: number; height: number};
};

export type PageContext = {
    page: Page;
    waitForAllPageRequests: WaitForAllPageRequests;
    frameLocator: Locator;
    doneLoadingLocator: Locator;
};

export async function startupBrowser({
    browserSize: {height, width},
}: BrowserStartupConfig): Promise<BrowserContext> {
    const browser = await webkit.launch();
    const browserContext = await browser.newContext({
        viewport: {
            height,
            width,
        },
        serviceWorkers: 'block',
    });

    return browserContext;
}

export async function setupBrowserPage(browserContext: BrowserContext) {
    const page = await browserContext.newPage();

    const waitForAllPageRequests = new WaitForAllPageRequests(page);

    const frameLocator = page.locator('toniq-nft-frame').first();
    const doneLoadingLocator = page.locator('toniq-nft-frame.hide-loading').first();

    return {
        page,
        waitForAllPageRequests,
        frameLocator,
        doneLoadingLocator,
    };
}

export async function navigateToUrl({page, url}: {page: Page; url: string}) {
    return await waitForCondition({
        async conditionCallback() {
            await page.goto(url);
            return true;
        },
    });
}
