var util          = require('./util');
var child_process = require('child_process');
var fs            = require('fs');
var path          = require('path');
var glob          = require('glob');
var rimraf        = require('rimraf');

/**
 * Compare left and right sets of screenshots, reporting any difference
 * @param {{config: String, base: String, components: Array, pages: Array}} config
 * @param {String} id1 - Left set of screenshots
 * @param {String} id2 - Right set of screenshots
 * @param {Function} cb - Callback, invoked when finished
 * @return {Boolean}
 */
module.exports = function compare(config, id1, id2, cb) {

    id2 = id2.replace('/', '-');

    var diffDirectory = config.base + '/diff_' + id1 + '_' + id2;
    var dir1 = glob.sync(config.base + '/' + id1 + '/**/*.png');
    var dir2 = glob.sync(config.base + '/' + id2 + '/**/*.png');

    if (!util.directoryExists(config.base + '/' + id1)) {
        log.error(util.format("Left side not found: '%s'", id1));
        return cb(false);
    }
    if (!util.directoryExists(config.base + '/' + id2)) {
        log.error(util.format("Right side not found: '%s'", id2));
        return cb(false);
    }

    if (util.directoryExists(diffDirectory)) {
        rimraf.sync(diffDirectory);
    }
    util.mkdir(diffDirectory);

    // Show warnings for non-existing files in either comparison directory
    log.verbose(config.verbose, util.format('Found %d screenshots on the left side', dir1.length));
    log.verbose(config.verbose, util.format('Found %d screenshots on the right side', dir2.length));
    getDirectoryDiff(dir1, id1, id2, file => log.warning('Screenshot not found in right side: ' + file));
    getDirectoryDiff(dir2, id2, id1, file => log.warning('Screenshot not found in left side: ' + file));

    // Create diff images, in parallel
    var count = dir1.length;
    dir1.forEach(file1 => {

        var filename = path.relative(config.base + '/' + id1, file1);
        var diffFile = diffDirectory + '/' + filename;
        var file2    = config.base + '/' + id2 + '/' + filename;

        util.mkdir(path.dirname(diffFile));

        var sizes = getImageSize(file1);

        log.verbose(config.verbose, 'Running diff with ImageMagick for image: ' + filename);
        var command = util.format("compare '%s' '%s' -metric AE '%s'", file1, file2, diffFile);

        child_process.exec(command, function(err, stdout, stderr) {

            // What percentage of pixels changed?
            var percentage = stderr / (sizes[0] * sizes[1]);
            var keepFile = false;

            if (stderr > 0) {
                if (percentage > config.threshold) {
                    log.verbose(config.verbose, util.format(
                        'Difference (%d%) above threshold (%d%) found for: %s',
                        (percentage * 100).toFixed(0),
                        config.threshold * 100,
                        filename));
                    keepFile = true;
                } else {
                    log.verbose(config.verbose, util.format(
                        "Difference (%d%) not bigger than threshold (%d%) for: '%s'",
                        (percentage * 100).toFixed(0),
                        config.threshold * 100,
                        filename));
                }
            } else {
                log.verbose(config.verbose, util.format('Found exactly equal: %s', filename));
            }

            if (!keepFile) fs.unlinkSync(diffFile);

            if (--count === 0) {
                var differences = glob.sync(diffDirectory + '/**/*.png').length;
                reportComparison(differences, diffDirectory);
                cb(!!differences);
            }
        });
    });

};

/**
 * Invokes a callback for every file that does not exist in the right side of the comparison
 * @param {String[]} dir - List of files in the left directory
 * @param {String} id1 - Identifier of the left directory
 * @param {String} id2 - Identifier of the right directory
 * @param {Function} cb - Callback for each difference, passed a single argument, the file
 */
function getDirectoryDiff(dir, id1, id2, cb) {
    dir.forEach(function(file1) {
        var file2 = file1.replace(id1, id2);
        if (!util.fileExists(file2)) {
            cb(file2);
        }
    });
}

/**
 * Returns the dimensions of an image file
 * @param {String} file - The full path to an image file
 * @returns {Array}
 */
function getImageSize(file) {

    var command = "identify -ping -format '%w %h' '" + file + "'";

    try {
        var sizes = child_process.execSync(command, { encoding: 'utf8' });
        return sizes.trim().split(' ').map(num => parseInt(num, 10));
    } catch (e) {
        log.error('Could not probe image file: ' + file);
    }
}

/**
 * Output comparison results
 * @param {Number} differences
 * @param {String} diffDirectory
 */
function reportComparison(differences, diffDirectory) {
    if (differences) {
        log.error('Found ' + differences + ' difference' + util.plural(differences));
        log.error("Diff images saved in: '" + diffDirectory + "'");
    } else {
        log.success('Found no significant differences');
    }
}
