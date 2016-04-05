var argumentLoader = require('./cli/argumentLoader');
var userCfgLoader  = require('./cli/userConfigLoader');
var log            = require('./log');
var util           = require('./util');
var async          = require('async');
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
 * @param {Function} cb - The callback function, returns a boolean representing success
 * @returns {Boolean}
 */
module.exports = function capture(id, cb) {

    var config = argumentLoader.getConfig();
    var userConfig = userCfgLoader.getUserConfig();

    id = id.replace('/', '-');
    var baseDir = config.base + '/' + id;
    if (util.directoryExists(baseDir)) {
        rimraf(baseDir);
    }

    log.verbose(util.format('Using a PhantomJS concurrency of %s', config.concurrency));
    log.verbose(util.format('Found %d size%s, %d page%s and %d component%s',
        userConfig.sizes.length,
        util.plural(userConfig.sizes.length),
        userConfig.pages.length,
        util.plural(userConfig.pages.length),
        userConfig.components.length,
        util.plural(userConfig.components.length)));

    var q = async.queue(createWorker(userConfig, baseDir), config.concurrency);

    var shots = 0, failed = 0;

    userConfig.sizes.forEach(size =>
        userConfig.pages.forEach(page =>
            q.push({ size, page }, (err, res) => {
                shots += res.shots;
                failed += res.failed;
            })));

    q.drain = function() {

        util.removeEmptyDirectories(baseDir);

        log.success(util.format('Saved %d screenshot%s in: %s/%s',
            shots,
            util.plural(shots),
            path.relative(process.cwd(), config.base),
            id));

        cb(failed === 0);
    };
};

/**
 * Creates a queue worker
 *
 * @param userConfig
 * @param baseDir
 * @returns {Function}
 */
function createWorker(userConfig, baseDir) {
    return function(task, cb) {
        return queueWorker(userConfig, baseDir, task, cb);
    }
}

/**
 * The worker itself
 *
 * @param {UserConfig} userConfig
 * @param {String} baseDir
 * @param {{ size: String, page: { name: String, url: String, components: String[] } }} task
 * @param {Function} cb
 * @returns {{ shots: Number, failed: Number }} - The number of captures taken and failed.
 */
function queueWorker(userConfig, baseDir, task, cb) {

    var pageBase = baseDir + '/' + task.size + '/' + task.page.name;
    util.mkdir(pageBase);

    log.verbose(util.format("Taking screenshots with PhantomJS for page: '%s' size: %s", task.page.name, task.size));

    var componentsJSON = JSON.stringify(task.page.components.map(componentId =>
        userConfig.components.find(component => component.name === componentId)));

    // Run PhantomJS and take screenshot
    var args = [
        __dirname + '/phantomjs-script.js',
        task.page.url,
        pageBase,
        task.size,
        componentsJSON,
        (userConfig['finished-when'] || 'return true')
    ];
    var proc = child_process.spawn(phantomjsPath, args, { encoding: 'utf8' });

    // Collect standard streams
    var stdout = '', stderr = '';
    proc.stdout.on('data', data => stdout += data);
    proc.stderr.on('data', data => stderr += data);

    // Report on error
    proc.on('error', err => {
        log.error(util.format("Failed to start PhantomJS for page: '%s'", task.page.name));
        log.verbose(' ' + JSON.stringify(err));
        cb(null, { shots: 0, failed: task.page.components.length });
        cb = () => {};
    });

    // Process finished
    proc.on('close', code => {

        // Check exit status
        if (code === 0) {

            if (stderr) log.verbose(util.prefixStdStream(' PhantomJS stderr', stderr));
            if (stdout) log.warning(util.prefixStdStream(' PhantomJS stdout', stdout));

            var shots = 0, failed = 0;

            // Check existence of all .png files
            var tasks = task.page.components.map(componentId => {
                return cb => {
                    var pngfile = pageBase + '/' + componentId + '.png';
                    util.fileExistsAsync(pngfile, (err, exists) => {
                        if (!err && exists) {
                            shots++;
                        } else {
                            failed++;
                            log.error(util.format("PhantomJS errored for page '%s' and component '%s'",
                                task.page.name,
                                componentId));
                        }
                        cb();
                    });
                };
            });

            async.parallel(tasks, () => {
                cb(null, {shots, failed});
                cb = () => {};
            });

            return;

        }

        // Report errors if we're still here
        log.error(util.format("PhantomJS errored for page: '%s'", task.page.name));

        if (stderr) log.warning(util.prefixStdStream(' PhantomJS stderr', stderr));
        if (stdout) log.warning(util.prefixStdStream(' PhantomJS stdout', stdout));

        cb(null, { shots: 0, failed: task.page.components.length });
        cb = () => {};

    });
}
