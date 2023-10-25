import {log as originalLog} from '@augment-vir/node-js';

export const log = {
    info(...args: any[]) {
        originalLog.info(`[INFO] ${args[0]}`, ...args.slice(1));
    },
    faint(...args: any[]) {
        originalLog.faint(...args);
    },
    error(...args: any[]) {
        originalLog.error(`[ERROR] ${args[0]}`, ...args.slice(1));
    },
    warn(...args: any[]) {
        originalLog.error(`[WARNING] ${args[0]}`, ...args.slice(1));
    },
    success(...args: any[]) {
        originalLog.success(...args);
    },
};
