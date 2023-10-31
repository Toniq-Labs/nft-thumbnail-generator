import {cpus} from 'os';
import {testOutputDir} from '../repo-paths';
import {ThumbnailServerConfig} from '../servers/thumbnail-server-config';

export const defaultServerConfig: Omit<
    ThumbnailServerConfig,
    'expressPort' | 'externalContentUrlOrigin'
> & {
    testOutputDir: string;
} = {
    externalContentUrlPath: 'content',
    maxFrameCount: 10,
    maxLoadTime: {
        milliseconds: 30_000,
    },
    browserConfig: {
        browserSize: {
            height: 600,
            width: 600,
        },
    },
    viteUrl: {
        host: '127.0.0.1',
        port: 5643,
    },
    workerCount: cpus().length - 1,
    testOutputDir,
};
