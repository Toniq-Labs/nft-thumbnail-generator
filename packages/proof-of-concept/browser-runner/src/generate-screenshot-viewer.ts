import {awaitedFilter, removeSuffix} from '@augment-vir/common';
import {existsSync} from 'fs';
import {readdir, stat, unlink, writeFile} from 'fs/promises';
import {join} from 'path';

export async function generateScreenshotViewer(screenshotsDir: string) {
    const indexHtmlPath = join(screenshotsDir, 'index.html');
    if (existsSync(indexHtmlPath)) {
        await unlink(indexHtmlPath);
    }

    const thumbnails = await awaitedFilter(await readdir(screenshotsDir), async (entry) => {
        return (await stat(join(screenshotsDir, entry))).isFile();
    });

    const htmlText = generateHtmlText(thumbnails);

    await writeFile(indexHtmlPath, htmlText);

    return indexHtmlPath;
}

function generateHtmlText(imageNames: ReadonlyArray<string>): string {
    const images = imageNames
        .map(
            (imageName) =>
                `<div class="nft-wrapper"><p>${removeSuffix({
                    value: imageName,
                    suffix: '.webp',
                })}
            </p>
            <img src="./${imageName}" />
        </div>`,
        )
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
            }
            img {
                flex-grow: 0;
                flex-shrink: 0;
            }
            .nft-wrapper {
                display: flex;
                flex-direction: column;
                max-width: 300px;
                text-overflow: ellipsis;
            }
            p {
                max-width: 100%;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
        </style>
    </head>
    <body>
        ${images}
    </body>
</html>`;
}
