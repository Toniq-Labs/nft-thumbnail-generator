import {awaitedForEach, waitForCondition} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import {mkdir, rm} from 'fs/promises';
import open from 'open';
import {webkit} from 'playwright';
import {generateScreenshotViewer} from './generate-screenshot-viewer';
import {generateNftThumbnail} from './generate-thumbnail';
import {screenshotsDir} from './repo-paths';
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
    });

    const page = await browserContext.newPage();

    await rm(screenshotsDir, {force: true, recursive: true});
    await mkdir(screenshotsDir, {recursive: true});

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
        try {
            const nftStart = Date.now();
            await generateNftThumbnail({
                doneLoadingLocator,
                frameLocator,
                nftId,
                waitForAllPageRequests,
            });
            const nftEnd = Date.now();
            const nftDiff = nftEnd - nftStart;
            log.faint(`nft took ${(nftDiff / 1000).toFixed(1)} seconds`);
        } catch (error) {
            log.error(error);
        }
    });
    const endTime = Date.now();
    const diff = endTime - startTime;

    await browser.close();

    const viewerPath = await generateScreenshotViewer(screenshotsDir);
    await open(`file://${viewerPath}`);

    log.info(`took ${(diff / 1000).toFixed(1)} seconds`);
}

main();
