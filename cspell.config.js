const {baseConfig} = require('virmator/base-configs/base-cspell.js');

module.exports = {
    ...baseConfig,
    ignorePaths: [
        ...baseConfig.ignorePaths,
        '**/screenshots/',
    ],
    words: [
        ...baseConfig.words,
        'requestfailed',
        'requestfinished',
        'toniq',
    ],
};
