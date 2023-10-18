const {baseConfig} = require('virmator/base-configs/base-cspell.js');

module.exports = {
    ...baseConfig,
    ignorePaths: [
        ...baseConfig.ignorePaths,
        '**/www-static/content/',
    ],
    words: [
        ...baseConfig.words,
        'toniq',
    ],
};
