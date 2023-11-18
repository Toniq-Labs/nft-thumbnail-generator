import {existsSync} from 'fs';
import {mkdir, readFile, writeFile} from 'fs/promises';
import {join} from 'path';
import {invalidNftIdsDir, invalidNftImageFile} from '../repo-paths';
import {HttpResult, HttpStatusCodeEnum} from './http-result';

export async function getThumbnailCache(nftId: string): Promise<HttpResult | undefined> {
    const invalidNftFile = join(invalidNftIdsDir, nftId);

    if (existsSync(invalidNftFile) && existsSync(invalidNftImageFile)) {
        return {
            code: HttpStatusCodeEnum.ServerError,
            value: await readFile(invalidNftImageFile),
        };
    } else {
        return undefined;
    }
}

export async function populateInvalidNftCache(nftId: string, thumbnail: Buffer): Promise<void> {
    if (!existsSync(invalidNftImageFile)) {
        await writeFile(invalidNftImageFile, thumbnail);
    }
    const invalidNftFile = join(invalidNftIdsDir, nftId);

    if (!existsSync(invalidNftIdsDir)) {
        await mkdir(invalidNftIdsDir, {recursive: true});
    }

    await writeFile(invalidNftFile, '');
}
