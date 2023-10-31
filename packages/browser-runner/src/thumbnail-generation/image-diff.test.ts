import {awaitedForEach} from '@augment-vir/common';
import {readdir} from 'fs/promises';
import {basename, join} from 'path';
import sharp from 'sharp';
import {assertExpectation} from 'test-established-expectations';
import {testFiles} from '../repo-paths';
import {compareImages} from './image-diff';

describe(compareImages.name, () => {
    it('compares all test files', async () => {
        const allTestFilePaths = (await readdir(testFiles.imageDiff)).map((fileName) =>
            join(testFiles.imageDiff, fileName),
        );

        let failed = false;

        await awaitedForEach(allTestFilePaths, async (filePathA, fileAIndex) => {
            await awaitedForEach(allTestFilePaths.slice(fileAIndex), async (filePathB) => {
                const fileA = basename(filePathA);
                const fileB = basename(filePathB);
                /**
                 * Wrapped in try catch so the first failure doesn't exit the whole test (we want to
                 * run all comparisons still).
                 */
                try {
                    await assertExpectation({
                        key: {
                            topKey: {function: compareImages},
                            subKey: fileA === fileB ? fileA : `${fileA} -> ${fileB}`,
                        },
                        result: await compareImages(sharp(filePathA), sharp(filePathB)),
                    });
                } catch (error) {
                    failed = true;
                }
            });
        });

        if (failed) {
            throw new Error('test expectations did not match, see new expectations');
        }
    });
});
