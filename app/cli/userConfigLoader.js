var argLoader = require('./argumentLoader');
var util      = require('../util');
var ajv       = require('ajv')({ allErrors: true });

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
        throw new Error('\n Config file not found: ' + config.config);
    }

    try {
        var userConfig = require(config.config);
    } catch (e) {
        throw new Error(util.format("\n Could not load config file '%s' (Incorrect JSON?): ", config.config));
    }

    const schema = require('../../user-config.schema.json');
    const valid = ajv.validate(schema, userConfig);
    if (!valid) {
        const msg = '\n ' + ajv.errors
            .map(err => (err.dataPath ? '`' + err.dataPath + '` ' : 'root ') + err.message)
            .join('\n ');
        throw new Error(msg);
    }

    // Slugify page and component identifiers
    return slugifyUserConfig(userConfig);

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
