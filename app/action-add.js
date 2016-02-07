var argumentLoader = require('./cli/argumentLoader');
var userCfgLoader  = require('./cli/userConfigLoader');
var log            = require('./log');
var util           = require('./util');
var child_process  = require('child_process');
var path           = require('path');
var phantomjsPath  = require('phantomjs-prebuilt').path;
var rimraf         = require('rimraf').sync;

/**
 * Action `add`
 *  Takes screenshots for all pages & components specified in `config`
 *
 * @param {String} id - The identifier for this set of screenshots
 * @returns {Boolean}
 */
module.exports = function add(id) {

    var config = argumentLoader.getConfig();
    var userConfig = userCfgLoader.getUserConfig();

    var success = true;
    var shots   = 0;

    id = id.replace('/', '-');
    var baseDir = config.base + '/' + id;
    if (util.directoryExists(baseDir)) {
        rimraf(baseDir);
    }

    log.verbose(util.format('Found %d size%s, %d page%s and %d component%s',
        userConfig.sizes.length,
        util.plural(userConfig.sizes.length),
        userConfig.pages.length,
        util.plural(userConfig.pages.length),
        userConfig.components.length,
        util.plural(userConfig.components.length)));

    userConfig.sizes.forEach(size => {
        userConfig.pages.forEach(page => {
            page.components.forEach(componentId => {

                var component = userConfig.components.find(component => {
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
                    component.ignore ? JSON.stringify(component.ignore) : '[]',
                    (userConfig['finished-when'] || 'return true')
                ];
                var proc = child_process.spawnSync(phantomjsPath, args, { encoding: 'utf8' });

                // Process results
                if (proc.status === 0 && !proc.error && !proc.stderr) {
                    if (proc.stdout) log.verbose(util.prefixStdStream(' PhantomJS stdout', proc.stdout));
                    return shots++;
                }

                // Report errors if we're still here
                success = false;
                log.error(util.format("PhantomJS errored for file: '%s'", path.relative(process.cwd(), file)));

                if (proc.error)  log.verbose(' ' + JSON.stringify(proc.error));
                if (proc.stderr) log.warning(util.prefixStdStream(' stderr', proc.stderr));
                if (proc.stdout) log.warning(util.prefixStdStream(' stdout', proc.stdout));
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
