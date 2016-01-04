var cfgLoader     = require('./configLoader');
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
 * @param {String} id - The identifier for this set of screenshots
 * @returns {Boolean}
 */
module.exports = function add(id) {

    var config = cfgLoader.getConfig();
    var success = true;
    var shots = 0;

    var baseDir = config.base + '/' + id;
    if (util.directoryExists(baseDir)) {
        rimraf.sync(baseDir);
    }

    log.verbose(util.format('Found %d page%s and %d component%s',
        config.pages.length,
        util.plural(config.pages.length),
        config.components.length,
        util.plural(config.components.length)));

    config.pages.forEach(page => {
        page.components.forEach(componentId => {

            var component = config.components.find(component => {
                if (component.name === componentId) {
                    return component;
                }
            });

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

            log.verbose('Taking screenshot with PhantomJS for image: ' +
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

    util.removeEmptyDirectories(baseDir);

    log.success(util.format('Saved %d screenshot%s in: %s/%s',
        shots,
        util.plural(shots),
        path.relative(process.cwd(), config.base),
        id));

    return success;
};
