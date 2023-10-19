import {mapObjectValues, typedObjectFromEntries} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import {existsSync} from 'fs';
import {readdir, unlink, writeFile} from 'fs/promises';
import {join} from 'path';

type NftFramePaths = Readonly<Record<string, ReadonlyArray<string>>>;

export async function generateScreenshotViewer(screenshotsDir: string) {
    const indexHtmlPath = join(screenshotsDir, 'index.html');
    if (existsSync(indexHtmlPath)) {
        await unlink(indexHtmlPath);
    }

    const allNftFrames = await readAllNftFrames(screenshotsDir);

    const htmlText = generateHtmlText(allNftFrames);

    await writeFile(indexHtmlPath, htmlText);

    log.info(`open ${indexHtmlPath} in a browser to view all screenshots`);
}

async function readAllNftFrames(screenshotsDir: string): Promise<NftFramePaths> {
    const currentNfts = await readdir(screenshotsDir);
    const nftFrameArrays: NftFramePaths = typedObjectFromEntries(
        currentNfts.map((nftId) => [
            nftId,
            [] as string[],
        ]),
    );

    return mapObjectValues(nftFrameArrays, async (nftId) => {
        const frames = await readdir(join(screenshotsDir, nftId));

        return frames.map((frameName) => join('.', nftId, frameName));
    });
}

function generateHtmlText(framePaths: NftFramePaths): string {
    const images = Object.entries(framePaths).map(
        ([
            nftId,
            imagePaths,
        ]) => {
            const images = imagePaths
                .map((imagePath) => `<img src="${imagePath}" />`)
                .join('\n            ');
            return `<div class="nft-wrapper" title="${nftId}">
            ${images}
        </div>`;
        },
    );

    return `<!DOCTYPE html>
<html>
    <head>
        <title>Toniq ThumbGen Screenshots</title>
        <style>
            body {
                display: flex;
                gap: 16px;
                align-items: flex-start;
            }
            img {
                flex-grow: 0;
                flex-shrink: 0;
            }
            .nft-wrapper {
                display: flex;
                flex-direction: column;
                gap: 8px;
                align-items: flex-start;
            }
        </style>
    </head>
    <body>
        ${images}
    </body>
</html>`;
}
