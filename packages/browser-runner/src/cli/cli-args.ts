import {filterToEnumValues, getEnumTypedValues, isTruthy} from '@augment-vir/common';
import {extractRelevantArgs} from 'cli-args-vir';

export enum CliCommandEnum {
    Test = 'test',
    Prod = 'prod',
}

const cliCommandOptionsString: string = getEnumTypedValues(CliCommandEnum)
    .map((entry) => `'${entry}'`)
    .join(',');

function extractCliCommand(args: ReadonlyArray<string>): CliCommandEnum {
    const commands = filterToEnumValues(args, CliCommandEnum);
    const command = commands[0];
    if (commands.length > 1) {
        throw new Error(
            `Incorrectly received multiple command args. Expected only one of ${cliCommandOptionsString}`,
        );
    } else if (!command || commands.length < 1) {
        throw new Error(`Missing command. Expected one of ${cliCommandOptionsString}`);
    }

    return command;
}

function extractPortNumber(args: ReadonlyArray<string>): number {
    const numericArgs = args.map((arg) => Number(arg)).filter(isTruthy);

    const portNumber = numericArgs[0];

    if (numericArgs.length > 1) {
        throw new Error(
            `Received multiple numeric arguments. Expected only one (for the express server port number)`,
        );
    } else if (!portNumber || numericArgs.length < 1) {
        throw new Error(
            `No numeric argument given. Expected one for the express server port number.`,
        );
    }

    return portNumber;
}

function extractServerOrigin(rawArgs: ReadonlyArray<string>): URL {
    const urlArgs = rawArgs.filter((arg) => {
        try {
            return !!new URL(arg);
        } catch (error) {
            return false;
        }
    });
    const urlArg = urlArgs[0];

    if (urlArgs.length > 1) {
        throw new Error(
            `Received multiple URL arguments. Expected only one (for the external nft content server origin).`,
        );
    } else if (!urlArg || urlArgs.length < 1) {
        throw new Error(
            `No URL argument given. Expected one for the external nft content server origin.`,
        );
    }

    return new URL(urlArg);
}

export function extractArgs(rawArgs: ReadonlyArray<string>): {
    port: number;
    command: CliCommandEnum;
    externalContentOrigin: string;
} {
    const relevantArgs = extractRelevantArgs({
        binName: undefined,
        fileName: __filename,
        rawArgs: rawArgs,
    });

    const command = extractCliCommand(relevantArgs);
    const port = extractPortNumber(relevantArgs);
    const externalContentOrigin = extractServerOrigin(relevantArgs).toString();

    return {port, command, externalContentOrigin};
}
