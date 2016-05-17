var argLoader = require('./argumentLoader');
var util      = require('../util');

/**
 * Expose module functions
 */
module.exports = { getUserConfig };

/**
 * Returns the user config object
 *
 * @typedef {{
 *   sizes: String[],
 *   pages: { name: String, url: String, components: String[] }[],
 *   components: { name: String, selector: String, ignore: String[] }[]
 * }} UserConfig
 * @throws {Error}
 * @returns {UserConfig}
 */
function getUserConfig() {

    var config = argLoader.getConfig();

    if (!util.fileExists(config.config)) {
        throw new Error('Config file not found: ' + config.config);
    }

    try {
        var userConfig = require(config.config);
    } catch (e) {
        throw new Error(util.format("Could not load config file '%s' (Incorrect JSON?): ", config.config));
    }

    // This function throws on error
    validateUserConfig(userConfig);

    // Slugify page and component identifiers
    userConfig = slugifyUserConfig(userConfig);

    return userConfig;

}

/**
 * Validate user config into app config object
 *
 * @private
 * @param {UserConfig} userConfig
 * @returns {Boolean}
 */
function validateUserConfig(userConfig) {

    // Validate credentials
    if (typeof userConfig.credentials !== 'undefined') {
        if (typeof userConfig.credentials !== 'string' || userConfig.credentials.length < 3) {
            throw new Error('Config: credentials must be a string!');
        }
        var credentials = userConfig.credentials.split(':');
        if (credentials.length !== 2) {
            throw new Error('Config: credentials must be a correctly formatted string!');
        }
    }

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

    // Validate all wait-for-script levels
    if (typeof userConfig['wait-for-script'] !== 'undefined' && typeof userConfig['wait-for-script'] !== 'string') {
        throw new Error('Config: wait-for-script must be a valid JavaScript string!');
    }
    userConfig.pages.forEach(page => {
        if (typeof page['wait-for-script'] !== 'undefined' && typeof page['wait-for-script'] !== 'string') {
            throw new Error(util.format("Config: Page '%s' has an invalid wait-for-script!", page.name));
        }
    });
    userConfig.components.forEach(component => {
        if (typeof component['wait-for-script'] !== 'undefined' && typeof component['wait-for-script'] !== 'string') {
            throw new Error(util.format("Config: Component '%s' has an invalid wait-for-script!", component.name));
        }
    });

    // Validate all wait-for-delay levels
    if (typeof userConfig['wait-for-delay'] !== 'undefined' && typeof userConfig['wait-for-delay'] !== 'number') {
        throw new Error('Config: wait-for-delay must be a valid JavaScript number!');
    }
    userConfig.pages.forEach(page => {
        if (typeof page['wait-for-delay'] !== 'undefined' && typeof page['wait-for-delay'] !== 'number') {
            throw new Error(util.format("Config: Page '%s' has an invalid wait-for-delay!", page.name));
        }
    });
    userConfig.components.forEach(component => {
        if (typeof component['wait-for-delay'] !== 'undefined' && typeof component['wait-for-delay'] !== 'number') {
            throw new Error(util.format("Config: Component '%s' has an invalid wait-for-delay!", component.name));
        }
    });

    // Throw 'removed' errors for finished-when
    var msg = 'Config: finished-when was renamed to wait-for-script in v0.6.0, please update your config';
    if (typeof userConfig['finished-when'] !== 'undefined') {
        throw new Error(msg);
    }
    userConfig.pages.forEach(page => {
        if (typeof page['finished-when'] !== 'undefined') {
            throw new Error(msg);
        }
    });
    userConfig.components.forEach(component => {
        if (typeof component['finished-when'] !== 'undefined') {
            throw new Error(msg);
        }
    });

    return true;

}

/**
 * Slugify page and component identifiers
 *
 * @param {UserConfig} userConfig
 * @returns {UserConfig}
 */
function slugifyUserConfig(userConfig) {

    userConfig.pages = userConfig.pages.map(page => {
        page.name = util.slugify(page.name);
        page.components = page.components.map(componentName => util.slugify(componentName));
        return page;
    });

    userConfig.components = userConfig.components.map(component => {
        component.name = util.slugify(component.name);
        return component;
    });

    return userConfig;
}
