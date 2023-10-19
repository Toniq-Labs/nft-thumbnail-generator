import {waitForAnimationFrame} from '@augment-vir/browser';
import {joinUrlParts} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import type {DeclarativeElement} from 'element-vir';
import {mkdir, writeFile} from 'fs/promises';
import {dirname, join} from 'path';
import type {Locator} from 'playwright';
import sharp from 'sharp';
import {WaitForAllPageRequests} from './wait-for-all-page-requests';

export async function takeNftScreenshot({
    frameLocator,
    doneLoadingLocator,
    nftId,
    screenshotsDir,
    waitForAllPageRequests,
}: {
    frameLocator: Locator;
    doneLoadingLocator: Locator;
    nftId: string;
    screenshotsDir: string;
    waitForAllPageRequests: WaitForAllPageRequests;
}) {
    log.faint(`${nftId}`);
    const eventWaiter = frameLocator.evaluate((element) => {
        return new Promise((resolve) => {
            element.addEventListener(
                'settle',
                (event) => {
                    return resolve(event);
                },
                {once: true},
            );
        });
    });
    await frameLocator.evaluate((element, nftUrl) => {
        (element as DeclarativeElement).instanceInputs.nftUrl = nftUrl;
    }, joinUrlParts('http://34.219.146.6:8080/content', nftId));

    await eventWaiter;
    await doneLoadingLocator.waitFor();

    await waitForAllPageRequests.allDone;

    /** Wait for a few frames. */
    await waitForFrames(frameLocator, 5);

    await screenshotAllFrames({locator: frameLocator, nftId, screenshotsDir});
}

const frameCount = 10;

async function screenshotAllFrames({
    screenshotsDir,
    nftId,
    locator,
}: {
    screenshotsDir: string;
    nftId: string;
    locator: Locator;
}) {
    for (let frameNumber = 0; frameNumber < frameCount; frameNumber++) {
        await writeScreenshotFrame({
            frameNumber,
            locator,
            nftId,
            screenshotsDir,
        });
    }
}

async function waitForFrames(locator: Locator, frameCount: number) {
    await locator.evaluate((element, frameCount) => {
        /** WaitForAnimationFrame is set on the window by the frontend's scripts. */
        return ((window as any).waitForAnimationFrame as typeof waitForAnimationFrame)(frameCount);
    }, frameCount);
}

async function writeScreenshotFrame({
    screenshotsDir,
    nftId,
    frameNumber,
    locator,
}: {
    screenshotsDir: string;
    nftId: string;
    frameNumber: number;
    locator: Locator;
}): Promise<void> {
    const screenshotBuffer = await locator.screenshot();
    const outputPath = join(
        screenshotsDir,
        nftId,
        `frame-${String(frameNumber).padStart(2, '0')}.webp`,
    );

    await mkdir(dirname(outputPath), {recursive: true});

    const webpBuffer = await sharp(screenshotBuffer)
        .webp({
            quality: 100,
            lossless: true,
        })
        .toBuffer();
    await writeFile(outputPath, webpBuffer);
}
