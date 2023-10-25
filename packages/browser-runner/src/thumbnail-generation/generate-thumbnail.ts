import {isLengthAtLeast, makeWritable, wait} from '@augment-vir/common';
import {DiffUnit, Duration} from 'date-vir';
import type {Locator} from 'playwright';
import sharp, {Sharp} from 'sharp';
import {createGif} from 'sharp-gif2';
import {log} from '../log';
import {compareImages} from './image-diff';
import {WaitForLoadedNftInputs, waitForLoadedNft} from './wait-for-loaded-nft';

export type ThumbnailGenerationInput = {
    maxFrameCount: number;
} & WaitForLoadedNftInputs;

export async function generateNftThumbnail(inputs: ThumbnailGenerationInput): Promise<Buffer> {
    const {nftId, maxFrameCount, frameLocator, maxLoadTime} = inputs;

    await waitForLoadedNft(inputs);
    const frames = await generateThumbnailFrames({
        locator: frameLocator,
        maxFrameCount,
        maxLoadTime,
    });

    if (frames.length !== maxFrameCount && frames.length !== 1) {
        log.warn(`Unexpected frame count '${frames.length}' for NFT '${nftId}'`);
    }

    return await createThumbnailBuffer({frames, nftId});
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
}: {
    frames: ReadonlyArray<Readonly<Sharp>>;
    nftId: string;
}): Promise<Buffer> {
    if (isLengthAtLeast(frames, 2)) {
        return await generateAnimatedBuffer(frames);
    } else if (!isLengthAtLeast(frames, 1)) {
        throw new Error(`No frames were generated for NFT '${nftId}'`);
    } else {
        /** If there is only one frame, then save a static image of that frame. */
        return await frames[0]
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
    maxLoadTime,
}: {
    locator: Locator;
    maxFrameCount: number;
    maxLoadTime: Duration<DiffUnit.Milliseconds>;
} & Pick<ThumbnailGenerationInput, 'maxFrameCount' | 'maxLoadTime'>) {
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
    while (frames.length < maxFrameCount && Date.now() - startTime < maxLoadTime.milliseconds) {
        await generateNewFrame();
    }

    return frames;
}
