var log           = require('./log');
var util          = require('./util');
var child_process = require('child_process');
var path          = require('path');
var phantomjsPath = require('phantomjs').path;
var rimraf        = require('rimraf');

/**
 * Action `add`
 *  Takes screenshots for all pages & components specified in `config`
 *
 * @param {{config: String, base: String, components: Array, pages: Array}} config
 * @param {String} id - The identifier for this set of screenshots
 * @returns {Boolean}
 */
module.exports = function add(config, id) {

    var success = true;
    var shots = 0;

    id = id.replace('/', '-');

    var baseDir = config.base + '/' + id;
    if (util.directoryExists(baseDir)) {
        rimraf.sync(baseDir);
    }

    log.verbose(config.verbose, util.format('Found %d page%s and %d component%s',
        config.pages.length,
        util.plural(config.pages.length),
        config.components.length,
        util.plural(config.components.length)));

    config.pages.forEach(page => {
        page.components.forEach(componentId => {

            var component = getComponent(config.components, componentId);
            if (!component) {
                return log.error(util.format(
                    'Specified component not found: \'%s\', expected on page \'%s\'',
                    componentId,
                    page.name));
            }

            var base = baseDir + '/' + page.name + '/';
            util.mkdir(base + path.dirname(component.file));

            var command = [
                '\'' + phantomjsPath + '\'',
                '\'' + __dirname + '/phantomjs-script.js' + '\'',
                '\'' + page.url + '\'',
                '\'' + base + component.name + '.png' + '\'',
                '\'' + '1280x768' + '\'',
                '\'' + component.selector + '\'',
                '\'' + (component.ignore ? JSON.stringify(component.ignore) : '[]') + '\''
            ].join(' ');

            log.verbose(config.verbose, 'Taking screenshot with PhantomJS for image: ' +
                page.name + '/' + component.name + '.png');

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

    log.success(util.format('Saved %d screenshot%s in: %s/%s',
        shots,
        util.plural(shots),
        path.relative(process.cwd(), config.base),
        id));

    return success;
};

/**
 * Find a component by it's identifier
 *
 * @param {{name: String, selector: String}[]} components - The `components` list from the config object
 * @param {String} componentId - The component identifier, the `name` property
 * @returns {{name: String, selector: String} | Boolean}
 */
function getComponent(components, componentId) {
    for (var i = 0; i < components.length; i++) {
        if (components[i].name === componentId) {
            return components[i];
        }
    }
    return false;
}
