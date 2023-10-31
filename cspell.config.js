const {baseConfig} = require('virmator/base-configs/base-cspell.js');

module.exports = {
    ...baseConfig,
    ignorePaths: [
        ...baseConfig.ignorePaths,
        '**/.not-committed/',
        '**/pages-dist/',
        '**/test-files/',
        '/logs/',
    ],
    words: [
        ...baseConfig.words,
        'requestfailed',
        'requestfinished',
        'toniq',
    ],
};
