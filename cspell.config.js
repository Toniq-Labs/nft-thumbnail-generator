const {baseConfig} = require('virmator/base-configs/base-cspell.js');

module.exports = {
    ...baseConfig,
    ignorePaths: [
        ...baseConfig.ignorePaths,
        '**/.not-committed/',
        '**/pages-dist/',
    ],
    words: [
        ...baseConfig.words,
        'requestfailed',
        'requestfinished',
        'toniq',
    ],
};
