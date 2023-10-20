import {waitForAnimationFrame} from '@augment-vir/browser';
import {joinUrlParts} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import type {DeclarativeElement} from 'element-vir';
import {join} from 'path';
import type {Locator} from 'playwright';
import sharp, {Sharp} from 'sharp';
import {createGif} from 'sharp-gif2';
import {firstFramesDir, screenshotsDir} from './repo-paths';
import {WaitForAllPageRequests} from './wait-for-all-page-requests';

export async function takeNftScreenshot({
    frameLocator,
    doneLoadingLocator,
    nftId,
    waitForAllPageRequests,
}: {
    frameLocator: Locator;
    doneLoadingLocator: Locator;
    nftId: string;
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
    await waitForFrames(frameLocator, 20);

    await createAnimatedImage({locator: frameLocator, nftId});
}

const frameCount = 10;

async function createAnimatedImage({nftId, locator}: {nftId: string; locator: Locator}) {
    const fileName = [
        nftId,
        'webp',
    ].join('.');

    const frames: Sharp[] = [];
    for (let frameNumber = 0; frameNumber < frameCount; frameNumber++) {
        const screenshotBuffer = await locator.screenshot();
        const sharpWebp = sharp(screenshotBuffer).webp({
            quality: 100,
            lossless: true,
        });

        frames.push(sharpWebp);

        if (frameNumber === 0) {
            await sharpWebp.toFile(join(firstFramesDir, fileName));
        }
        await waitForFrames(locator, 5);
    }

    const animatedImage = (await createGif({delay: 200}).addFrame(frames).toSharp()).webp({
        quality: 100,
        lossless: true,
    });

    await animatedImage.toFile(join(screenshotsDir, fileName));
}

async function waitForFrames(locator: Locator, frameCount: number) {
    await locator.evaluate((element, frameCount) => {
        /** WaitForAnimationFrame is set on the window by the frontend's scripts. */
        return ((window as any).waitForAnimationFrame as typeof waitForAnimationFrame)(frameCount);
    }, frameCount);
}
