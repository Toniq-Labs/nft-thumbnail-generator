import {awaitedForEach, waitForCondition} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import {webkit} from 'playwright';
import {generateScreenshotViewer} from './generate-screenshot-viewer';
import {screenshotsDir} from './repo-paths';
import {takeNftScreenshot} from './take-nft-screenshot';
import {nftIdTestCases} from './test-cases';
import {WaitForAllPageRequests} from './wait-for-all-page-requests';

async function main() {
    const browser = await webkit.launch();
    const browserContext = await browser.newContext({
        viewport: {
            height: 600,
            width: 600,
        },
        serviceWorkers: 'block',
        // // currently video is turned off
        // recordVideo: {dir: videosDir, size: {height: 600, width: 600}},
    });

    const page = await browserContext.newPage();

    const waitForAllPageRequests = new WaitForAllPageRequests(page);

    await waitForCondition({
        async conditionCallback() {
            await page.goto('http://localhost:5643');
            return true;
        },
    });

    const frameLocator = page.locator('toniq-nft-frame').first();
    const doneLoadingLocator = page.locator('toniq-nft-frame.hide-loading').first();

    log.info(
        [
            nftIdTestCases.length,
            'NFTs',
        ].join(' '),
    );

    const startTime = Date.now();
    await awaitedForEach(nftIdTestCases, async (nftId) => {
        const nftStart = Date.now();
        await takeNftScreenshot({
            doneLoadingLocator,
            frameLocator,
            nftId,
            screenshotsDir,
            waitForAllPageRequests,
        });
        const nftEnd = Date.now();
        const nftDiff = nftEnd - nftStart;
        log.faint(`nft took ${(nftDiff / 1000).toFixed(1)} seconds`);
    });
    const endTime = Date.now();
    const diff = endTime - startTime;

    await browser.close();

    await generateScreenshotViewer(screenshotsDir);

    log.info(`took ${(diff / 1000).toFixed(1)} seconds`);
}

main();
