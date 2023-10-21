import {join, resolve} from 'path';
import {defineConfig} from 'virmator/dist/compiled-base-configs/base-vite';

const srcDir = resolve(__dirname, '..', 'src');

export default defineConfig({forGitHubPages: true}, (baseConfig) => {
    return {
        ...baseConfig,
        server: {
            port: 5643,
            proxy: {
                '/content': {
                    target: 'http://34.219.146.6:8080',
                    changeOrigin: true,
                    autoRewrite: true,
                    prependPath: true,
                },
            },
        },
        build: {
            ...baseConfig.build,
            rollupOptions: {
                ...baseConfig.build?.rollupOptions,
                input: {
                    main: join(srcDir, 'index.html'),
                    iframe: join(srcDir, 'iframe', 'iframe.html'),
                },
            },
        },
    };
});
