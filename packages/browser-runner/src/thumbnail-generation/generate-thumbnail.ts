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
    const {nftId, maxFrameCount} = inputs;

    log.time({nftId, description: 'waiting for load'});
    await waitForLoadedNft(inputs);
    log.time({nftId, description: 'generating frames'});
    const frames = await generateThumbnailFrames(inputs);

    if (frames.length !== maxFrameCount && frames.length !== 1) {
        log.warn(nftId, `unexpected frame count '${frames.length}'`);
    }

    log.time({nftId, description: 'creating buffer'});
    const buffer = await createThumbnailBuffer({frames, nftId, maxFrameCount});
    log.time({nftId, description: 'returning buffer'});
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
    if (frames.length >= maxFrameCount - 1) {
        log.time({nftId, description: `creating animation with ${frames.length} frames`});
        return await generateAnimatedBuffer(frames);
    } else if (!isLengthAtLeast(frames, 1)) {
        throw new Error(`No frames were generated for NFT '${nftId}'`);
    } else {
        const latestFrame = frames[frames.length - 1];
        if (!latestFrame) {
            throw new Error(`Failed to find latest frame in a still image for NFT '${nftId}'`);
        }

        log.time({nftId, description: `creating static image with frame '${frames.length - 1}'`});
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
    frameLocator,
    maxFrameCount,
    nftId,
}: {
    frameLocator: Locator;
    maxFrameCount: number;
    nftId: string;
} & Pick<ThumbnailGenerationInput, 'maxFrameCount'>) {
    const frames: Sharp[] = [];

    async function generateNewFrame() {
        const newFrame = sharp(await frameLocator.screenshot());

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
    log.time({nftId, description: 'gathering initial frames'});
    for (let frameIndex = 0; frameIndex < maxFrameCount / 2; frameIndex++) {
        await generateNewFrame();
    }
    log.time({nftId, description: `got ${frames.length} unique frames`});

    const startTime = Date.now();
    /** If it's clear that the image is animated, keep generating frames. */
    if (frames.length >= maxFrameCount / 2 - 1) {
        log.time({nftId, description: 'gathering more frames'});
        while (
            frames.length < maxFrameCount &&
            Date.now() - startTime < frameGenerationTime.milliseconds
        ) {
            await generateNewFrame();
        }
    }
    log.time({nftId, description: 'done getting frames'});

    return frames;
}
