import {ensureError, extractErrorMessage} from '@augment-vir/common';
import {log} from '@augment-vir/node-js';
import nodeCluster from 'cluster';
import {startThumbnailCluster} from '../servers/thumbnail-server';
import {ThumbnailServerConfig} from '../servers/thumbnail-server-config';
import {CliCommandEnum, extractArgs} from './cli-args';
import {defaultServerConfig} from './cli-config';

export async function runThumbGenCli(rawArgs: ReadonlyArray<string>) {
    try {
        const {command, port, externalContentOrigin} = extractArgs(rawArgs);

        const fullServerConfig: ThumbnailServerConfig = {
            ...defaultServerConfig,
            expressPort: port,
            externalContentUrlOrigin: externalContentOrigin.toString(),
        };

        await startThumbnailCluster(fullServerConfig);

        const expressServerOrigin = `http://localhost:${fullServerConfig.expressPort}`;

        if (!nodeCluster.isPrimary) {
            /** Nothing else to do in cluster child workers. */
            return;
        }

        log.success(`Thumbnail generation server listening at: ${expressServerOrigin}`);

        if (command === CliCommandEnum.Prod) {
            /** Nothing else to do. */
            return;
        } else if (command === CliCommandEnum.Test) {
            const [
                generateTestThumbnailsImport,
                testCasesImport,
                openImport,
            ] = [
                import('../test/generate-test-thumbnails'),
                import('../test/test-cases'),
                import('open'),
            ];

            const thumbnailsHtmlFile = await (
                await generateTestThumbnailsImport
            ).generateTestThumbnails({
                outputDir: defaultServerConfig.testOutputDir,
                testNftIds: (await testCasesImport).testNftIds,
                expressServerOrigin: expressServerOrigin,
            });

            await (await openImport).default(`file://${thumbnailsHtmlFile}`);

            log.success('Tests done.');

            process.exit(0);
        } else {
            throw new Error(`Unexpected command given: '${command}'`);
        }
    } catch (caught) {
        const error = ensureError(caught);
        log.error(extractErrorMessage(error));
        if (error.stack) {
            log.faint(error.stack);
        }
        process.exit(1);
    }
}

if (require.main === module) {
    runThumbGenCli(process.argv);
}
