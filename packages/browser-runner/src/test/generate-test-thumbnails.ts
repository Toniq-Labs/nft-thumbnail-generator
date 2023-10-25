import {addSuffix, joinUrlParts} from '@augment-vir/common';
import {mkdir, writeFile} from 'fs/promises';
import {join} from 'path';
import {thumbnailEndpointPath} from '../servers/thumbnail-server';

export async function generateTestThumbnails({
    testNftIds,
    expressServerOrigin,
    outputDir,
}: {
    testNftIds: ReadonlyArray<string>;
    expressServerOrigin: string;
    outputDir: string;
}): Promise<string> {
    await mkdir(outputDir, {recursive: true});
    await Promise.allSettled(
        testNftIds.map(async (nftId) => {
            const nftUrl = joinUrlParts(expressServerOrigin, thumbnailEndpointPath, nftId);
            const response = await fetch(nftUrl);

            await writeFile(
                join(outputDir, `${nftId}.webp`),
                Buffer.from(await response.arrayBuffer()),
            );
        }),
    );

    const indexHtmlPath = join(outputDir, 'index.html');

    await writeFile(indexHtmlPath, generateTestIndexHtml(testNftIds));

    return indexHtmlPath;
}

function generateTestIndexHtml(nftIds: ReadonlyArray<string>): string {
    const images = nftIds
        .map((nftId) => {
            const imageName = addSuffix({value: nftId, suffix: '.webp'});

            return `<div class="nft-wrapper"><p>${nftId}
            </p>
            <img src="./${imageName}" />
        </div>`;
        })
        .join('\n        ');

    return `<!DOCTYPE html>
<html>
    <head>
        <title>Toniq ThumbGen Screenshots</title>
        <style>
            body {
                display: flex;
                gap: 16px;
                align-items: flex-start;
                flex-wrap: wrap;
                font-family: sans-serif;
            }
            img {
                flex-grow: 0;
                flex-shrink: 0;
            }
            .nft-wrapper {
                display: flex;
                flex-direction: column;
                max-width: 300px;
            }
            p {
                max-width: 100%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        </style>
    </head>
    <body>
        ${images}
    </body>
</html>`;
}
