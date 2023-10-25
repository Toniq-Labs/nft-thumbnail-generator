import {RunOptions} from 'npm-check-updates';
import {baseNcuConfig} from 'virmator/dist/compiled-base-configs/base-ncu';

export const ncuConfig: RunOptions = {
    ...baseNcuConfig,
    // exclude these
    reject: [
        ...baseNcuConfig.reject,
        /**
         * New versions are ESM only which doesn't work with ts-node, and we can't use tsx because
         * it doesn't work with Playwright.
         */
        'open',
    ],
    // include only these
    filter: [],
};
