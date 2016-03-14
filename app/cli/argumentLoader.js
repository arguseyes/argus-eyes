var util = require('../util');
var path = require('path');
var argv = require('yargs').argv;

/**
 * Expose module functions
 */
module.exports = { getAction, getConfig };

/**
 * Cache variables
 *
 * @type {Boolean}
 * @private
 */
var _action, _config;

/**
 * The default config object
 */
var _defaultConfig = {
    config: process.cwd() + '/argus-eyes.json',
    base: process.cwd() + '/.argus-eyes',
    verbose: false,
    color: true,
    threshold: 0,
    im: ''
};

/**
 * Determines the action
 *
 * @throws {Error}
 * @returns {String[]} - The final action
 */
function getAction() {

    // Return from cache
    if (_action) {
        return _action;
    }

    // yargs positional arguments
    var posArgs = argv._;

    // `argus-eyes capture <name>`
    if (posArgs.length === 2 && (posArgs[0] === 'capture' || posArgs[0] === 'add')) {
        return ['capture', posArgs[1]];
    }

    // `argus-eyes compare <name1> <name2>`
    if (posArgs.length === 3 && posArgs[0] === 'compare') {
        return ['compare', posArgs[1], posArgs[2]];
    }

    // `argus-eyes configtest`
    if (posArgs.length === 1 && posArgs[0] === 'configtest') {
        return ['configtest'];
    }

    // `argus-eyes --help`
    if (posArgs.length === 0 && argv.help === true) {
        return ['help'];
    }

    // `argus-eyes -v` || `argus-eyes --version`
    if (posArgs.length === 0 && (argv.version === true || argv.v === true)) {
        return ['version'];
    }

    throw new Error('No valid action found. Run with --help to print usage information');
}

/**
 * Determine configuration options given via cli arguments
 *
 * @typedef {{
 *   config: String,
 *   base: String,
 *   verbose: Boolean,
 *   color: Boolean,
 *   threshold: Number,
 *   im: String
 * }} Config
 * @throws {Error}
 * @returns {Config} - The final config
 */
function getConfig() {

    // Return from cache
    if (_config) {
        return _config;
    }

    var config = Object.assign({}, _defaultConfig);

    if (typeof argv.config !== 'undefined') {
        if (path.isAbsolute(argv.config)) {
            config.config = argv.config;
        } else {
            config.config = process.cwd() + '/' + argv.config;
        }
    }

    if (typeof argv.base !== 'undefined') {
        if (path.isAbsolute(argv.base)) {
            config.base = argv.base;
        } else {
            config.base = process.cwd() + '/' + argv.base;
        }
    }

    if (argv.verbose === true) {
        config.verbose = true;
    }

    if (argv.color === false) {
        config.color = false;
    }

    if (typeof argv.threshold !== 'undefined') {
        config.threshold = parseFloat(argv.threshold);
        if (config.threshold < 0 || config.threshold > 100 || Number.isNaN(config.threshold)) {
            throw new Error('Incorrect threshold given');
        }
    }

    if (typeof argv.im !== 'undefined') {
        config.im = argv.im;
    }
    var imCompare  = util.isExecutable(config.im + 'compare', ['-version']);
    var imConvert  = util.isExecutable(config.im + 'convert', ['-version']);
    var imIdentify = util.isExecutable(config.im + 'identify', ['-version']);
    if (!imCompare && !imConvert && !imIdentify) {
        throw new Error('ImageMagick executables not found');
    } else if (!imCompare) {
        throw new Error('ImageMagick executable not found: `compare`');
    } else if (!imConvert) {
        throw new Error('ImageMagick executable not found: `convert`');
    } else if (!imIdentify) {
        throw new Error('ImageMagick executable not found: `identify`');
    }

    return config;
}
