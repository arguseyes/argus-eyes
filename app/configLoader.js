var util = require('./util');
var path = require('path');
var argv = require('yargs').argv;

/**
 * The action and positional arguments
 *
 * @private
 * @see _getAction()
 * @type {String[]}
 */
var action = [];

/**
 * The config object, gets populated at runtime
 *
 * @private
 * @typedef {Object} Config
 */
var config = {
    config: process.cwd() + '/argus-eyes.json',
    base: process.cwd() + '/.argus-eyes',
    verbose: false,
    color: true,
    threshold: 2,
    im: ''
};

/**
 * Expose module functions
 */
module.exports = {
    getConfig,
    getAction,
    loadConfig
};

/**
 * Returns the config object
 *
 * @returns {Config}
 */
function getConfig() {
    return config;
}

/**
 * Returns the action object
 *
 * @returns {String[]}
 */
function getAction() {
    return action;
}

/**
 * Load config and action into the current state
 *
 * @throws {Error}
 */
function loadConfig() {

    // Build config and action from cli input
    config = _parseCliOptions(argv, config);
    action = _parseCliPositionalArguments(argv);

    // Attempt to load user config
    try {
        var userConfig = require(config.config);
    } catch (e) {
        throw new Error(util.format("Could not load config file '%s' (Incorrect JSON?): ", config.config));
    }

    // Merge loaded config file into config object
    config.pages = userConfig.pages;
    config.components = userConfig.components;
}

/**
 * Determine configuration options given via cli arguments
 *
 * @private
 * @param {Object} argv - Yargs object
 * @param {Config} config - The config object to merge new options into
 * @throws {Error}
 * @returns {Config} - The final config
 */
function _parseCliOptions(argv, config) {

    if (argv.config) {
        if (path.isAbsolute(argv.config)) {
            config.config = argv.config;
        } else {
            config.config = process.cwd() + '/' + argv.config;
        }
        if (!util.fileExists(config.config)) {
            throw new Error('Config file not found: ' + config.config);
        }
    }

    if (argv.base) {
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

    if (argv.threshold) {
        config.threshold = parseFloat(argv.threshold);
        if (config.threshold < 0 || config.threshold > 100 || Number.isNaN(config.threshold)) {
            throw new Error('Incorrect threshold given');
        }
    }

    if (argv.im) {
        config.im = argv.im;
    }
    var imCompare  = util.isExecutable(config.im + 'compare', ['-version']);
    var imIdentify = util.isExecutable(config.im + 'identify', ['-version']);
    if (!imCompare && !imIdentify) {
        return new Error('ImageMagick executables not found');
    } else if (!imCompare) {
        return new Error('ImageMagick executable not found: `compare`');
    } else if (!imIdentify) {
        return new Error('ImageMagick executable not found: `identify`');
    }

    return config;
}

/**
 * Determines the action
 *
 * @private
 * @param {Object} argv - Yargs object
 * @throws {Error}
 * @returns {String[]} - The final action
 */
function _parseCliPositionalArguments(argv) {

    // yargs positional arguments
    var posArgs = argv._;

    // `argus-eyes add develop`
    if (posArgs.length === 2 && posArgs[0] === 'add') {
        return ['add', posArgs[1]];
    }

    // `argus-eyes compare develop current`
    if (posArgs.length === 3 && posArgs[0] === 'compare') {
        if (posArgs[1] === posArgs[2]) {
            throw new Error('You cannot compare a set with itself');
        }
        if (!util.directoryExists(config.base + '/' + posArgs[1])) {
            throw new Error(util.format("Left side not found: '%s'", posArgs[1]));
        }
        if (!util.directoryExists(config.base + '/' + posArgs[2])) {
            throw new Error(util.format("Right side not found: '%s'", posArgs[2]));
        }
        return ['compare', posArgs[1], posArgs[2]];
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
