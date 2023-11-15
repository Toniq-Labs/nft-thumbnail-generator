import {getNowFullDate, toSimpleDatePartString, utcTimezone} from 'date-vir';
import {appendFileSync} from 'fs';
import {join} from 'path';
import {logsDir} from './repo-paths';

enum LogTypeEnum {
    Error = 'error',
    Info = 'info',
}

function getLogFilePath(logType: LogTypeEnum): string {
    const now = getNowFullDate(utcTimezone);
    const fileName = [
        toSimpleDatePartString(now),
        logType,
        'log',
    ].join('.');
    return join(logsDir, fileName);
}

function runLog(logType: LogTypeEnum, logHeader: string, args: any[]) {
    const joinedArgs = args.map((arg) => arg.toString()).join(' ') + '\n';
    const now = getNowFullDate(utcTimezone);
    const timestamp = `${now.year}-${String(now.month).padStart(2, '0')}-${String(now.day).padStart(
        2,
        '0',
    )} ${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')}:${String(
        now.second,
    ).padStart(2, '0')}`;
    appendFileSync(getLogFilePath(logType), `${timestamp} | ${logHeader} ${joinedArgs}`);
}

export const log = {
    info(...args: any[]) {
        runLog(LogTypeEnum.Info, '[INFO]', args);
    },
    time({nftId, description}: {nftId: string; description: string}) {
        runLog(LogTypeEnum.Info, '[TIME]', [
            performance.now(),
            nftId,
            description,
        ]);
    },
    error(...args: any[]) {
        runLog(LogTypeEnum.Error, '[ERROR]', args);
    },
    warn(...args: any[]) {
        runLog(LogTypeEnum.Error, '[WARNING]', args);
    },
    success(...args: any[]) {
        runLog(LogTypeEnum.Info, '[SUCCESS]', args);
    },
};

console.log = log.info;
console.info = log.info;
console.debug = log.info;
console.error = log.error;
console.warn = log.warn;
