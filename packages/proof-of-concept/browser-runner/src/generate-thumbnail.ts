import {
    PromiseTimeoutError,
    isLengthAtLeast,
    joinUrlParts,
    wait,
    wrapPromiseInTimeout,
} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import type {DeclarativeElement} from 'element-vir';
import {join} from 'path';
import type {Locator} from 'playwright';
import sharp, {Sharp} from 'sharp';
import {createGif} from 'sharp-gif2';
import {compareImages} from './image-diff';
import {screenshotsDir} from './repo-paths';
import {WaitForAllPageRequests} from './wait-for-all-page-requests';

async function waitForLoadedNft({
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
    try {
        await wrapPromiseInTimeout(
            maxLoadDuration.milliseconds,
            (async (): Promise<void> => {
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

                /** Wait for a bit. */
                await wait(100);
            })(),
        );
    } catch (error) {
        if (error instanceof PromiseTimeoutError) {
            log.error(`Timed out waiting for full ${nftId} load.`);
        } else {
            throw error;
        }
    }
}

const maxLoadDuration = {milliseconds: 5_000};
const maxFrameCount = 10 as const;

export async function generateNftThumbnail(inputs: {
    frameLocator: Locator;
    doneLoadingLocator: Locator;
    nftId: string;
    waitForAllPageRequests: WaitForAllPageRequests;
}) {
    const {nftId, frameLocator} = inputs;

    log.info(`${nftId}`);
    await waitForLoadedNft(inputs);
    log.faint('done loading');

    const frames = await generateThumbnailFrames(frameLocator);
    log.faint('done generating frames');

    if (frames.length !== maxFrameCount && frames.length !== 1) {
        log.error(`Unexpected frame count '${frames.length}' for NFT '${nftId}'`);
    }

    await saveThumbnail({frames, nftId});
}

async function saveThumbnail({frames, nftId}: {frames: Sharp[]; nftId: string}) {
    const outputFilePath = join(
        screenshotsDir,
        [
            nftId,
            'webp',
        ].join('.'),
    );
    if (isLengthAtLeast(frames, 2)) {
        log.faint('animated image');
        const animatedImage = (await createGif({delay: 200}).addFrame(frames).toSharp()).webp({
            quality: 100,
            lossless: true,
        });

        await animatedImage.toFile(outputFilePath);
    } else if (!isLengthAtLeast(frames, 1)) {
        throw new Error(`No frames were generated for NFT '${nftId}'`);
    } else {
        log.faint('still image');
        /** If there is only one frame, then save a static image of that frame. */
        await frames[0]
            .webp({
                quality: 100,
                lossless: true,
            })
            .toFile(outputFilePath);
    }
}

async function generateThumbnailFrames(locator: Locator) {
    const frames: Sharp[] = [];

    async function generateNewFrame() {
        const newFrame = sharp(await locator.screenshot());

        const latestFrame = frames[frames.length - 1];

        if (latestFrame) {
            const diff = await compareImages(latestFrame, newFrame);
            if (diff > 5) {
                frames.push(newFrame);
            }
        } else {
            frames.push(newFrame);
        }

        await wait(100);
    }

    /** First try to generate 10 frames. */
    for (let frameIndex = 0; frameIndex < maxFrameCount / 2; frameIndex++) {
        await generateNewFrame();
    }

    const startTime = Date.now();
    /**
     * If we didn't get 10 frames yet but it's clear that the image is animated, keep generating
     * frames.
     */
    while (frames.length < maxFrameCount && Date.now() - startTime < maxLoadDuration.milliseconds) {
        await generateNewFrame();
    }

    return frames;
}
