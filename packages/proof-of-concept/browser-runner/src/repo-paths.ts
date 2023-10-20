import {join, resolve} from 'path';

export const monoRepoDir = resolve(__dirname, '..', '..', '..', '..');

const proofOfConceptBrowserRunnerDir = join(
    monoRepoDir,
    'packages',
    'proof-of-concept',
    'browser-runner',
);
export const screenshotsDir = join(proofOfConceptBrowserRunnerDir, 'screenshots');
