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

    // Validate all finished-when levels
    if (typeof userConfig['finished-when'] !== 'undefined' && typeof userConfig['finished-when'] !== 'string') {
        throw new Error('Config: finished-when must be a valid JavaScript string!');
    }
    userConfig.pages.forEach(page => {
        if (typeof page['finished-when'] !== 'undefined' && typeof page['finished-when'] !== 'string') {
            throw new Error(util.format("Config: Page '%s' has an invalid finished-when!", page.name));
        }
    });
    userConfig.components.forEach(component => {
        if (typeof component['finished-when'] !== 'undefined' && typeof component['finished-when'] !== 'string') {
            throw new Error(util.format("Config: Component '%s' has an invalid finished-when!", component.name));
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
