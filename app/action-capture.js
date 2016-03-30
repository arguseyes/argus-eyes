var argumentLoader = require('./cli/argumentLoader');
var userCfgLoader  = require('./cli/userConfigLoader');
var log            = require('./log');
var util           = require('./util');
var child_process  = require('child_process');
var fs             = require('fs');
var path           = require('path');
var phantomjsPath  = require('phantomjs-prebuilt').path;
var PNGImage       = require('pngjs-image');
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
            var pageFile = pageBase + '.png';
            util.mkdir(pageBase);

            log.verbose(util.format("Taking screenshots with PhantomJS for page: '%s'",
                path.relative(baseDir, page.name)));

            var componentsJSON = JSON.stringify(page.components.map(componentId =>
                userConfig.components.find(component => component.name === componentId)));

            // Run PhantomJS and take screenshot
            var args = [
                __dirname + '/phantomjs-script.js',
                page.url,
                pageFile,
                size,
                componentsJSON,
                (userConfig['finished-when'] || 'return true')
            ];
            var proc = child_process.spawnSync(phantomjsPath, args, { encoding: 'utf8' });

            // Load page image into memory and remove it
            try {
                var pageImgData = fs.readFileSync(pageFile);
                fs.unlinkSync(pageFile);
            } catch (e) {
                return log.warning(util.format("PhantomJS could not take screenshots for page: '%s'", page.name));
            }

            // Crop components
            if (proc.status === 0 && !proc.error && proc.stdout) {

                try {
                    var components = JSON.parse(proc.stdout);
                } catch (e) {
                    return log.warning(util.format("PhantomJS errored for page: '%s'", page.name));
                }

                if (proc.stderr) log.warning(util.prefixStdStream(' PhantomJS stderr', proc.stderr));

                components.forEach(component => {

                    var componentFile = pageBase + '/' + component.name + '.png';
                    util.mkdir(pageBase);

                    // Crop and save component image
                    var componentImg = PNGImage.loadImageSync(pageImgData);
                    var clip = component.clip;
                    componentImg.clip(clip.left, clip.top, clip.width, clip.height);
                    componentImg.writeImageSync(componentFile);

                    return shots++;
                });

                return;
            }

            // Report errors if we're still here
            success = false;
            log.error(util.format("PhantomJS errored for file: '%s'", path.relative(process.cwd(), pageFile)));

            if (proc.error)  log.verbose(' ' + JSON.stringify(proc.error));
            if (proc.stderr) log.warning(util.prefixStdStream(' stderr', proc.stderr));
            if (proc.stdout) log.warning(util.prefixStdStream(' stdout', proc.stdout));
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
