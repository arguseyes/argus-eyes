var argumentLoader = require('./cli/argumentLoader');
var userCfgLoader  = require('./cli/userConfigLoader');
var log            = require('./log');
var util           = require('./util');
var child_process  = require('child_process');
var fs             = require('fs');
var path           = require('path');
var phantomjsPath  = require('phantomjs-prebuilt').path;
var rimraf         = require('rimraf').sync;

/**
 * Action `capture`
 *  Captures screenshots for all pages & components specified in `config`
 *
 * @param {String} id - The identifier for this set of screenshots
 * @returns {Boolean}
 */
module.exports = function capture(id) {

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

            var pageBase = baseDir + '/' + size + '/' + page.name;
            util.mkdir(pageBase);

            log.verbose(util.format("Taking screenshots with PhantomJS for page: '%s'",
                path.relative(baseDir, page.name)));

            var componentsJSON = JSON.stringify(page.components.map(componentId =>
                userConfig.components.find(component => component.name === componentId)));

            // Run PhantomJS and take screenshot
            var args = [
                __dirname + '/phantomjs-script.js',
                page.url,
                pageBase,
                size,
                componentsJSON,
                (userConfig['finished-when'] || 'return true')
            ];
            var proc = child_process.spawnSync(phantomjsPath, args, { encoding: 'utf8' });

            // Check exit status
            if (proc.status === 0 && !proc.error) {

                if (proc.stderr) log.verbose(util.prefixStdStream(' PhantomJS stderr', proc.stderr));
                if (proc.stdout) log.warning(util.prefixStdStream(' PhantomJS stdout', proc.stdout));

                // Check existance of all .png files
                page.components.forEach(componentId => {
                    if (!util.fileExists(pageBase + '/' + componentId + '.png')) {
                        success = false;
                        log.error(util.format("PhantomJS errored for page '%s' and component '%s'",
                            page.name,
                            componentId));
                    }
                });
                if (!success) return;

                return shots += page.components.length;
            }

            // Report errors if we're still here
            success = false;
            log.error(util.format("PhantomJS errored for page: '%s'", page.name));

            if (proc.error)  log.verbose(' ' + JSON.stringify(proc.error));
            if (proc.stderr) log.warning(util.prefixStdStream(' PhantomJS stderr', proc.stderr));
            if (proc.stdout) log.warning(util.prefixStdStream(' PhantomJS stdout', proc.stdout));
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
