var util = require('./util');
var path = require('path');

/**
 * Expose module functions
 */
module.exports = {
    loadConfig,
    getAction,
    getConfigError
};

/**
 * The config object, as it is by default
 *
 * @typedef {Object} Config
 */
var defaultConfig = {
    config: process.cwd() + '/argus-eyes.json',
    base: process.cwd() + '/.argus-eyes',
    verbose: false,
    color: true,
    threshold: 2,
    im: ''
};

/**
 * Construct configuration object
 *
 * @param {{config: String, base: String, _: Array}} argv - Yargs object
 * @returns {Config}
 */
function loadConfig(argv) {

    // Get config from cli arguments
    var config = getConfiguration(argv);

    // Load config file
    try {
        var configFile = require(config.config);
    } catch (e) {
        return config;
    }

    // Merge config
    config.pages = configFile.pages;
    config.components = configFile.components;

    return config;
}

/**
 * Determine configuration options given via cli arguments
 *
 * @param {Object} argv - Yargs object
 * @returns {Config}
 */
function getConfiguration(argv) {

    var config = defaultConfig;

    if (argv.config) {
        if (path.isAbsolute(argv.config)) {
            config.config = argv.config;
        } else {
            config.config = process.cwd() + '/' + argv.config;
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
    }

    if (argv.im) {
        config.im = argv.im;
    }

    return config;
}

/**
 * Determines the action
 *
 * @returns {String[]}
 */
function getAction(argv) {

    // yargs positional arguments
    var posArgs = argv._;

    // `argus-eyes add develop`
    if (posArgs.length === 2 && posArgs[0] === 'add') {
        return ['add', posArgs[1]];
    }

    // `argus-eyes compare develop current`
    if (posArgs.length === 3 && posArgs[0] === 'compare') {
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

    return [];
}

/**
 * Tests whether the given config & action are usable
 *
 * @param {Config} config
 * @param {String[]} action
 * @returns {Error | Boolean}
 */
function getConfigError(config, action) {

    if (action[0] === 'compare' && action[1] === action[2]) {
        return new Error('You cannot compare a set with itself');
    }

    if (action[0] === 'compare' && !util.directoryExists(config.base + '/' + action[1])) {
        return new Error(util.format("Left side not found: '%s'", action[1]));
    }

    if (action[0] === 'compare' && !util.directoryExists(config.base + '/' + action[2])) {
        return new Error(util.format("Right side not found: '%s'", action[2]));
    }

    if (!util.fileExists(config.config)) {
        return new Error('Config file not found: ' + config.config);
    }

    if (!config.pages || !config.components) {
        return new Error('Incorrect config file format: ' + config.config);
    }

    if (config.threshold < 0 || config.threshold > 100 || Number.isNaN(config.threshold)) {
        return new Error('Incorrect threshold given');
    }

    if (!action.length) {
        return new Error('No valid action found. Run with --help to print usage information');
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

    return false;
}
