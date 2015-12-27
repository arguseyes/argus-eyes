var util = require('./util');

/**
 * Expose module functions
 */
module.exports = {
    loadConfig,
    getConfiguration,
    getAction
};

/**
 * @type {{config: string, base: string, color: boolean, components: Array, pages: Array}}
 */
var defaultConfig = {
    config: process.cwd() + '/argus-eyes.json',
    base: process.cwd() + '/.argus-eyes',
    verbose: false,
    color: true,
    threshold: 0.02
};

/**
 * Construct configuration object
 * @param {{config: String, base: String, _: Array}} argv - Yargs object
 * @returns {{config: String, base: String, components: Array, pages: Array}}
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
 * @param {{config: String, base: String, _: Array}} argv - Yargs object
 * @returns {{config: String, base: String, components: Array, pages: Array}}
 */
function getConfiguration(argv) {

    var config = defaultConfig;

    if (argv.config) {
        if (!util.fileExists(argv.config)) {
            console.log('Error: Specified config file not found!');
            process.exit(-1);
        }
        config.config = process.cwd() + '/' + argv.config;
    }

    if (argv.base && util.directoryExists(argv.base)) {
        config.base = argv.base;
    }

    if (argv.threshold) {
        config.threshold = parseFloat(argv.threshold);
        if (config.threshold < 0 || config.threshold > 100 || Number.isNaN(config.threshold)) {
            console.log('Error: Incorrect threshold given!');
            process.exit(-1);
        }
    }

    if (argv.verbose === true) {
        config.verbose = true;
    }

    if (argv.color === false) {
        config.color = false;
    }

    return config;
}

/**
 * Determines the action, either 'add' or 'compare'
 * @returns {String[] | Boolean}
 */
function getAction(argv) {

    // `argus-eyes add develop`
    var indexAdd = argv._.indexOf('add');
    if (~indexAdd && argv._[indexAdd + 1]) {
        return argv._.slice(indexAdd, indexAdd + 2);
    }

    // `argus-eyes compare develop current`
    var indexCompare = argv._.indexOf('compare');
    if (~indexCompare && argv._[indexCompare + 1] && argv._[indexCompare + 2]) {
        return argv._.slice(indexCompare, indexCompare + 3);
    }

    return false;
}
