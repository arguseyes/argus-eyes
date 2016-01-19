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
 * @typedef {{
 *   config: String,
 *   base: String,
 *   verbose: Boolean,
 *   color: Boolean,
 *   threshold: Number,
 *   im: String,
 *   sizes: String[],
 *   pages: { name: String, url: String, components: String[] }[],
 *   components: { name: String, selector: String, ignore: String[] }[]
 * }} Config
 */
var config = {
    config: process.cwd() + '/argus-eyes.json',
    base: process.cwd() + '/.argus-eyes',
    verbose: false,
    color: true,
    threshold: 2,
    im: '',
    sizes: [],
    pages: [],
    components: []
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
    config = _mergeConfig(config, userConfig);
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

    // `argus-eyes add <name>`
    if (posArgs.length === 2 && posArgs[0] === 'add') {
        posArgs[1] = posArgs[1].replace('/', '-');
        return ['add', posArgs[1]];
    }

    // `argus-eyes compare <name1> <name2>`
    if (posArgs.length === 3 && posArgs[0] === 'compare') {
        posArgs[1] = posArgs[1].replace('/', '-');
        posArgs[2] = posArgs[2].replace('/', '-');
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

/**
 * Merge user config into app config object
 *
 * @private
 * @param {Config} config
 * @param {{
 *   sizes: String[],
 *   pages: { name: String, url: String, components: String[] }[],
 *   components: { name: String, selector: String, ignore: String[] }[]
 * }} userConfig
 * @throws {Error}
 * @returns {Config}
 */
function _mergeConfig(config, userConfig) {

    // Validate sizes
    if (!Array.isArray(userConfig.sizes) || userConfig.sizes.length < 1) {
        throw new Error('Config: No sizes found!');
    }
    userConfig.sizes.forEach(size => {
        if (typeof size !== 'string') {
            throw new Error('Config: All sizes need to be a string!');
        }
        var sizes = size.split('x').map(x => parseInt(x, 10));
        if (sizes.length !== 2 || !(sizes[0] > 0) || !(sizes[1] > 0)) {
            throw new Error('Config: All sizes need to be a correctly formatted string!');
        }
    });

    // Validate pages
    if (!Array.isArray(userConfig.pages) || userConfig.pages.length < 1) {
        throw new Error('Config: No pages found!');
    }
    userConfig.pages.forEach(page => {
        if (!page.name || typeof page.name !== 'string' || !page.url || typeof page.url !== 'string') {
            throw new Error('Config: All pages need a name and url!');
        }
        if (!Array.isArray(page.components) || !page.components.length) {
            throw new Error(util.format("Config: Page '%s' needs at least 1 component!", page.name));
        }
    });

    // Validate components
    if (!Array.isArray(userConfig.components) || userConfig.components.length < 1) {
        throw new Error('Config: No components found!');
    }
    userConfig.components.forEach(component => {
        if (!component.name || typeof component.name !== 'string' || !component.selector || typeof component.selector !== 'string') {
            throw new Error('Config: All components need a name and selector!');
        }
        if (typeof component.ignore !== 'undefined' && (!Array.isArray(component.ignore) || !component.ignore.length)) {
            throw new Error(util.format("Config: Component '%s' has an invalid ignore list!", component.name));
        }
    });

    // Validate all referenced components actually exist
    var components = userConfig.components.map(c => c.name);
    userConfig.pages.forEach(page => {
        page.components.forEach(component => {
            if (!~components.indexOf(component)) {
                throw new Error(util.format("Config: Component '%s' not found in page '%s'", component, page.name));
            }
        });
    });

    // Manually merge objects
    config.sizes = userConfig.sizes;
    config.pages = userConfig.pages;
    config.components = userConfig.components;

    return config;
}
