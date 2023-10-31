import {appendFileSync} from 'fs';
import {writeFile} from 'fs/promises';
import {logFiles} from './repo-paths';

export async function resetLogs() {
    await Promise.all(
        Object.values(logFiles).map(async (logFilePath) => {
            await writeFile(logFilePath, '');
        }),
    );
}

export const log = {
    info(...args: any[]) {
        appendFileSync(logFiles.info, `[INFO] ${args.map((arg) => arg.toString()).join(' ')}`);
    },
    error(...args: any[]) {
        appendFileSync(logFiles.error, `[ERROR] ${args.map((arg) => arg.toString()).join(' ')}`);
    },
    warn(...args: any[]) {
        appendFileSync(logFiles.error, `[WARNING] ${args.map((arg) => arg.toString()).join(' ')}`);
    },
    success(...args: any[]) {
        appendFileSync(logFiles.info, `[SUCCESS] ${args.map((arg) => arg.toString()).join(' ')}`);
    },
};
