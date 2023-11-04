import {BrowserStartupConfig} from '../thumbnail-generation/browser-control';
import {ThumbnailGenerationInput} from '../thumbnail-generation/generate-thumbnail';

export type ThumbnailServerConfig = {
    expressPort: number;
    workerCount: number;
    /**
     * Max attempts at loading the image. On the last attempt, the error message will be used in the
     * screenshot. If even that fails, the thumbnail generation will be aborted.
     */
    maxAttempts: number;

    browserConfig: BrowserStartupConfig;
    viteUrl: {
        host: string;
        port: number;
    };
} & Omit<
    ThumbnailGenerationInput,
    'nftId' | 'frameLocator' | 'doneLoadingLocator' | 'waitForAllPageRequests' | 'bypassLoading'
>;
