import {getNowFullDate, utcTimezone} from 'date-vir';
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

function runLog(logFilePath: string, logHeader: string, args: any[]) {
    const joinedArgs = args.map((arg) => arg.toString()).join(' ') + '\n';
    const now = getNowFullDate(utcTimezone);
    const timestamp = `${now.year}-${String(now.month).padStart(2, '0')}-${String(now.day).padStart(
        2,
        '0',
    )} ${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')}:${String(
        now.second,
    ).padStart(2, '0')}`;
    appendFileSync(logFilePath, `${timestamp} | ${logHeader} ${joinedArgs}`);
}

export const log = {
    info(...args: any[]) {
        runLog(logFiles.info, '[INFO]', args);
    },
    error(...args: any[]) {
        runLog(logFiles.error, '[ERROR]', args);
    },
    warn(...args: any[]) {
        runLog(logFiles.error, '[WARNING]', args);
    },
    success(...args: any[]) {
        runLog(logFiles.info, '[SUCCESS]', args);
    },
};

console.log = log.info;
console.error = log.error;
console.warn = log.warn;
