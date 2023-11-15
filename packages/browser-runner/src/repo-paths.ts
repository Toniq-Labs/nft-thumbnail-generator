import {join, resolve} from 'path';

const monoRepoDir = resolve(__dirname, '..', '..', '..');
const packagesDir = join(monoRepoDir, 'packages');
const frontendPackageDir = join(packagesDir, 'thumbnail-frontend');
const browserRunnerPackageDir = join(packagesDir, 'browser-runner');
export const logsDir = join(monoRepoDir, 'logs');

const notCommittedDir = join(monoRepoDir, '.not-committed');

export const frontendViteConfigFile = join(frontendPackageDir, 'configs', 'vite.config.ts');
export const testOutputDir = join(notCommittedDir, 'test-output');
export const testFilesDir = join(browserRunnerPackageDir, 'test-files');

export const testFiles = {
    imageDiff: join(testFilesDir, 'image-diff'),
};
