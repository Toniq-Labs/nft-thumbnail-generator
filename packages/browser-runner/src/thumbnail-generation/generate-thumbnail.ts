import {isLengthAtLeast, makeWritable, wait} from '@augment-vir/common';
import type {Locator} from 'playwright';
import sharp, {Sharp} from 'sharp';
import {createGif} from 'sharp-gif2';
import {log} from '../log';
import {compareImages} from './image-diff';
import {WaitForLoadedNftInputs, waitForLoadedNft} from './wait-for-loaded-nft';

export type ThumbnailGenerationInput = {
    maxFrameCount: number;
} & WaitForLoadedNftInputs;

const frameGenerationTime = {milliseconds: 5_000};

export async function generateNftThumbnail(inputs: ThumbnailGenerationInput): Promise<Buffer> {
    const {nftId, maxFrameCount, frameLocator} = inputs;

    log.info('waiting for load', nftId, performance.now());
    await waitForLoadedNft(inputs);
    log.info('generating frames', nftId, performance.now());
    const frames = await generateThumbnailFrames({
        locator: frameLocator,
        maxFrameCount,
    });

    if (frames.length !== maxFrameCount && frames.length !== 1) {
        log.warn(`Unexpected frame count '${frames.length}' for NFT '${nftId}'`);
    }

    log.info('creating buffer', nftId, performance.now());
    const buffer = await createThumbnailBuffer({frames, nftId, maxFrameCount});
    log.info('finished', nftId, performance.now());
    return buffer;
}

async function generateAnimatedBuffer(frames: ReadonlyArray<Readonly<Sharp>>): Promise<Buffer> {
    const animatedImage = (
        await createGif({
            delay: 100,
        })
            .addFrame(makeWritable(frames))
            .toSharp()
    ).webp({
        quality: 100,
        lossless: true,
    });

    return await animatedImage.toBuffer();
}

async function createThumbnailBuffer({
    frames,
    nftId,
    maxFrameCount,
}: {
    frames: ReadonlyArray<Readonly<Sharp>>;
    nftId: string;
    maxFrameCount: number;
}): Promise<Buffer> {
    if (frames.length > maxFrameCount / 2) {
        return await generateAnimatedBuffer(frames);
    } else if (!isLengthAtLeast(frames, 1)) {
        throw new Error(`No frames were generated for NFT '${nftId}'`);
    } else {
        const latestFrame = frames[frames.length - 1];
        if (!latestFrame) {
            throw new Error(`[ERROR] failed to find latest frame in a still image`);
        }

        /** If there is only one frame, then save a static image of that frame. */
        return await latestFrame
            .webp({
                quality: 100,
                lossless: true,
            })
            .toBuffer();
    }
}

async function generateThumbnailFrames({
    locator,
    maxFrameCount,
}: {
    locator: Locator;
    maxFrameCount: number;
} & Pick<ThumbnailGenerationInput, 'maxFrameCount'>) {
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

    /** First try to generate some frames. */
    for (let frameIndex = 0; frameIndex < maxFrameCount / 2; frameIndex++) {
        await generateNewFrame();
    }

    const startTime = Date.now();
    /** If it's clear that the image is animated, keep generating frames. */
    if (frames.length > 3) {
        while (
            frames.length < maxFrameCount &&
            Date.now() - startTime < frameGenerationTime.milliseconds
        ) {
            await generateNewFrame();
        }
    }

    return frames;
}
