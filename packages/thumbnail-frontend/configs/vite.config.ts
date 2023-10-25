import {join, resolve} from 'path';
import {defineConfig} from 'virmator/dist/compiled-base-configs/base-vite';

const thumbnailFrontendPackagePath = resolve(__dirname, '..');

const srcDir = join(thumbnailFrontendPackagePath, 'src');
const staticDir = join(thumbnailFrontendPackagePath, 'www-static');
const outDir = join(thumbnailFrontendPackagePath, 'dist');

export default defineConfig({forGitHubPages: true}, (baseConfig) => {
    return {
        ...baseConfig,
        publicDir: staticDir,
        root: srcDir,
        server: {
            port: 5643,
        },
        build: {
            ...baseConfig.build,
            outDir,
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
