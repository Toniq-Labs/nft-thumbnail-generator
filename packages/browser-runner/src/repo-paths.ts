import {join, resolve} from 'path';

const monoRepoDir = resolve(__dirname, '..', '..', '..');
const packagesDir = join(monoRepoDir, 'packages');
const frontendPackageDir = join(packagesDir, 'thumbnail-frontend');
const browserRunnerPackageDir = join(packagesDir, 'browser-runner');

const notCommittedDir = join(monoRepoDir, '.not-committed');
export const logsDir = join(notCommittedDir, 'logs');
const cacheDir = join(notCommittedDir, 'cache');
export const invalidNftIdsDir = join(cacheDir, 'temp-invalid-nft-ids');
/**
 * This is technically a cached image, but it should not be deleted frequently; whereas the rest of
 * the cache directory is meant to be deleted frequently. Thus, this file is not in the cache dir.
 */
export const invalidNftImageFile = join(notCommittedDir, 'invalid.webp');

export const frontendViteConfigFile = join(frontendPackageDir, 'configs', 'vite.config.ts');
export const testOutputDir = join(notCommittedDir, 'test-output');
export const testFilesDir = join(browserRunnerPackageDir, 'test-files');

export const testFiles = {
    imageDiff: join(testFilesDir, 'image-diff'),
};
