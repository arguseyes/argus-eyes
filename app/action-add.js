var cfgLoader     = require('./configLoader');
var log           = require('./log');
var util          = require('./util');
var child_process = require('child_process');
var path          = require('path');
var phantomjsPath = require('phantomjs').path;
var rimraf        = require('rimraf').sync;

/**
 * Action `add`
 *  Takes screenshots for all pages & components specified in `config`
 *
 * @param {String} id - The identifier for this set of screenshots
 * @returns {Boolean}
 */
module.exports = function add(id) {

    var config  = cfgLoader.getConfig();
    var success = true;
    var shots   = 0;

    var baseDir = config.base + '/' + id;
    if (util.directoryExists(baseDir)) {
        rimraf(baseDir);
    }

    log.verbose(util.format('Found %d size%s, %d page%s and %d component%s',
        config.sizes.length,
        util.plural(config.sizes.length),
        config.pages.length,
        util.plural(config.pages.length),
        config.components.length,
        util.plural(config.components.length)));

    config.sizes.forEach(size => {
        config.pages.forEach(page => {
            page.components.forEach(componentId => {

                var component = config.components.find(component => {
                    if (component.name === componentId) {
                        return component;
                    }
                });

                var base = baseDir + '/' + size + '/' + page.name;
                var file = base + '/' + component.name + '.png';
                util.mkdir(base);

                log.verbose(util.format("Taking screenshot with PhantomJS for image: '%s'",
                    path.relative(baseDir, file)));

                // Run PhantomJS and take screenshot
                var args = [
                    __dirname + '/phantomjs-script.js',
                    page.url,
                    file,
                    size,
                    component.selector,
                    component.ignore ? JSON.stringify(component.ignore) : '[]'
                ];
                var proc = child_process.spawnSync(phantomjsPath, args, { encoding: 'utf8' });

                // Process results
                if (proc.status === 0 && !proc.error && !proc.stderr) {
                    return shots++;
                }

                // Report errors if we're still here
                success = false;
                log.error(util.format("PhantomJS errored for file: '%s'", path.relative(process.cwd(), file)));

                if (proc.error) {
                    log.verbose(' ' + JSON.stringify(proc.error));
                }
                if (proc.stderr) {
                    log.warning(util.prefixStdStream(' stderr', proc.stderr));
                }
                if (proc.stdout) {
                    log.warning(util.prefixStdStream(' stdout', proc.stdout));
                }
            });
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
