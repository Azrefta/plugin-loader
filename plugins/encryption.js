const crypto = require('crypto');
const javascriptObfuscator = require('javascript-obfuscator');

const encryptCode = (code, level) => {
    let options;
    
    switch (level) {
        case 'easy':
            options = {
                compact: true,
                controlFlowFlattening: false,
                deadCodeInjection: false,
                debugProtection: false,
            };
            break;
        case 'normal':
            options = {
                compact: true,
                controlFlowFlattening: true,
                deadCodeInjection: true,
                debugProtection: false,
            };
            break;
        case 'hard':
            options = {
                compact: true,
                controlFlowFlattening: true,
                deadCodeInjection: true,
                debugProtection: true,
                stringArray: true,
                stringArrayEncoding: ['base64'],
            };
            break;
        case 'impossible':
            options = {
                compact: true,
                controlFlowFlattening: true,
                deadCodeInjection: true,
                debugProtection: true,
                stringArray: true,
                stringArrayEncoding: ['base64'],
                numbersToExpressions: true,
                simplify: true,
                transformObjectKeys: true,
                shuffleStringArray: true,
                stringArrayThreshold: 0.75,
            };
            break;
        default:
            throw new Error('Invalid encryption level');
    }

    const obfuscated = javascriptObfuscator.obfuscate(code, options);
    return obfuscated.getObfuscatedCode();
};

module.exports.encrypt = (code, level) => encryptCode(code, level);

module.exports.encEasy = (code) => encryptCode(code, 'easy');
module.exports.encNormal = (code) => encryptCode(code, 'normal');
module.exports.encHard = (code) => encryptCode(code, 'hard');
module.exports.encImpossible = (code) => encryptCode(code, 'impossible');

