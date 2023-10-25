import {PickDeep, addPrefix, mergeDeep} from '@augment-vir/common';
import {UserConfig, ViteDevServer, createServer} from 'vite';
import {log} from '../log';
import {frontendViteConfigFile} from '../repo-paths';
import {ThumbnailServerConfig} from './thumbnail-server-config';

export function formViteUrl(serverConfig: Pick<ThumbnailServerConfig, 'viteUrl'>) {
    const viteUrl = `http://${serverConfig.viteUrl.host}:${serverConfig.viteUrl.port}`;

    return viteUrl;
}

export async function startViteServer(
    serverConfig: PickDeep<
        ThumbnailServerConfig,
        ['viteUrl' | 'externalContentUrlPath' | 'externalContentUrlOrigin']
    >,
): Promise<ViteDevServer> {
    const baseViteConfig: UserConfig = await (await import(frontendViteConfigFile)).default;
    const mergedViteConfig = mergeDeep(baseViteConfig, {
        server: {
            port: serverConfig.viteUrl.port,
            host: serverConfig.viteUrl.host,
            proxy: {
                [addPrefix({
                    value: serverConfig.externalContentUrlPath,
                    prefix: '/',
                })]: {
                    target: serverConfig.externalContentUrlOrigin,
                    changeOrigin: true,
                    autoRewrite: true,
                    prependPath: true,
                },
            },
        },
    });

    const viteServer = await createServer({
        ...mergedViteConfig,
        configFile: false,
        envFile: false,
    });

    await viteServer.listen();
    const viteUrl = formViteUrl(serverConfig);

    log.info(`Vite server started at: ${viteUrl}`);
    return viteServer;
}
