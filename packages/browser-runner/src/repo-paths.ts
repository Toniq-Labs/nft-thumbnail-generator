import {join, resolve} from 'path';

const monoRepoDir = resolve(__dirname, '..', '..', '..');
const packagesDir = join(monoRepoDir, 'packages');
const frontendPackageDir = join(packagesDir, 'thumbnail-frontend');

const notCommittedDir = join(monoRepoDir, '.not-committed');

export const frontendViteConfigFile = join(frontendPackageDir, 'configs', 'vite.config.ts');
export const testOutputDir = join(notCommittedDir, 'test-output');
