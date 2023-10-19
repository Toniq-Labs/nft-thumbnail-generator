import {defineConfig} from 'virmator/dist/compiled-base-configs/base-vite';

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
    };
});
