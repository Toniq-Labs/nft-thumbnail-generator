import {BrowserStartupConfig} from '../thumbnail-generation/browser-control';
import {ThumbnailGenerationInput} from '../thumbnail-generation/generate-thumbnail';

export type ThumbnailServerConfig = {
    expressPort: number;
    workerCount: number;

    browserConfig: BrowserStartupConfig;
    viteUrl: {
        host: string;
        port: number;
    };
} & Omit<
    ThumbnailGenerationInput,
    'nftId' | 'frameLocator' | 'doneLoadingLocator' | 'waitForAllPageRequests'
>;
