// @ts-expect-error
import webpImport from 'node-webpmux';

export type Frame = {};

export interface WebPImage {
    load(source: string | Buffer): Promise<void>;
    convertToAnim(): void;
    frames: Frame[];
    save(path: string, options?: any): Promise<void>;
    save(path?: null, options?: any): Promise<Buffer>;
    save(path: string | null, options?: any): Promise<void>;
    setFrameData(
        frameIndex: number,
        buffer: Buffer,
        options?: Partial<{quality: number; exact: boolean}>,
    ): Promise<void>;
}

export type WebP = {
    Image: {
        new (): WebPImage;
        save(path: string | null, options?: {frames: any[]}): Promise<void>;
        generateFrame(options: Partial<{buffer: Buffer; path: string}>): Promise<Frame>;
        initLib(): Promise<void>;
    };
};

export const WebP: WebP = webpImport;
