var util          = require('./util');
var child_process = require('child_process');
var path          = require('path');
var phantomjsPath = require('phantomjs').path;

/**
 * Take screenshots for all pages & components specified in `config`
 * @param {{config: String, base: String, components: Array, pages: Array}} config
 * @param {String} id - The identifier for this set of screenshots
 * @returns {Boolean}
 */
module.exports = function(config, id) {

    var success = true;
    var shots = 0;

    config.pages.forEach(function(page) {
        page.components.forEach(function(componentId) {

            var component = getComponent(config.components, componentId);
            if (!component) {
                return log.error('Specified component not found: ' + componentId + ', expected in page \'' + page.name + '\'');
            }

            var base = config.base + '/' + id + '/' + page.name + '/';
            util.mkdir(base + path.dirname(component.file));

            var command = [
                '\'' + phantomjsPath + '\'',
                '\'' + __dirname + '/phantomjs-script.js' + '\'',
                '\'' + page.url + '\'',
                '\'' + base + component.name + '.png' + '\'',
                '\'' + '1280x768' + '\'',
                '\'' + component.selector + '\''
            ].join(' ');

            // Run PhantomJS and take screenshot
            try {
                child_process.execSync(command);
                shots++;
            } catch (e) {
                log.error('Failed to save screenshot for url: ' + page.url);
                success = false;
            }
        });
    });

    log.message(util.format('Saved %d screenshot%s in %s/%s', shots, util.plural(shots), config.base, id));

    return success;
};

/**
 * Find a component by it's identifier
 * @param {{name: String}[]} components - The `components` list from the config object
 * @param {String} componentId - The component identifier, the `name` property
 * @returns {{name: String, selector: String}[]}
 */
function getComponent(components, componentId) {
    for (var i = 0; i < components.length; i++) {
        if (components[i].name === componentId) {
            return components[i];
        }
    }
    return false;
}
