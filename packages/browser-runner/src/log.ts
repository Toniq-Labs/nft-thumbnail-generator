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

function joinArgs(...args: any[]): string {
    return args.map((arg) => arg.toString()).join(' ') + '\n';
}

export const log = {
    info(...args: any[]) {
        appendFileSync(logFiles.info, `[INFO] ${joinArgs(args)}`);
    },
    error(...args: any[]) {
        appendFileSync(logFiles.error, `[ERROR] ${joinArgs(args)}`);
    },
    warn(...args: any[]) {
        appendFileSync(logFiles.error, `[WARNING] ${joinArgs(args)}`);
    },
    success(...args: any[]) {
        appendFileSync(logFiles.info, `[SUCCESS] ${joinArgs(args)}`);
    },
};

console.log = log.info;
console.error = log.error;
console.warn = log.warn;
