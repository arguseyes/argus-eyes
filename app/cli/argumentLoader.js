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
    concurrency: 10
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
 *   concurrency: Number
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

    if (typeof argv.concurrency !== 'undefined') {
        if (typeof argv.concurrency !== 'number') {
            throw new Error('Incorrect concurrency given');
        }
        config.concurrency = parseInt(argv.concurrency);
        if (config.concurrency < 1 || config.concurrency > 100) {
            throw new Error('Concurrency must be a number between 1 and 100');
        }
    }

    return config;
}
