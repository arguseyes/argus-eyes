var log           = require('./log');
var util          = require('./util');
var child_process = require('child_process');
var fs            = require('fs');
var path          = require('path');
var glob          = require('glob');
var rimraf        = require('rimraf');

/**
 * Action `compare`
 *  Compares left and right sets of screenshots, reporting any difference
 *
 * @param {{config: String, base: String, components: Array, pages: Array}} config
 * @param {String} id1 - Left set of screenshots
 * @param {String} id2 - Right set of screenshots
 * @param {Function} cb - Callback, invoked when finished
 * @return {Boolean}
 */
module.exports = function compare(config, id1, id2, cb) {

    id1 = id1.replace('/', '-');
    id2 = id2.replace('/', '-');

    var diffDirectory = config.base + '/diff_' + id1 + '_' + id2;
    var dir1 = glob.sync(config.base + '/' + id1 + '/**/*.png');
    var dir2 = glob.sync(config.base + '/' + id2 + '/**/*.png');

    // Clean up a potentially existing diff directory
    if (util.directoryExists(diffDirectory)) {
        rimraf.sync(diffDirectory);
    }
    util.mkdir(diffDirectory);

    showDirectoryDifferenceWarnings(config, dir1, dir2, id1, id2);

    var differences = 0;
    var count = dir1.length;
    var done = () => {
        if (--count === 0) { // are all async functions finished?
            removeEmptyDirectories(diffDirectory);
            reportResults(diffDirectory, differences);
            cb(!!differences);
        }
    };

    // Create diff images, in parallel
    dir1.forEach(file1 => {

        var filename = path.relative(config.base + '/' + id1, file1);
        var diffFile = diffDirectory + '/' + filename;
        var file2    = config.base + '/' + id2 + '/' + filename;

        util.mkdir(path.dirname(diffFile));

        var sizes1 = getImageSize(config, file1);
        var sizes2 = getImageSize(config, file2);
        if (!sizes1 || !sizes2) {
            log.error('Could not probe both left and right for image dimensions: ' + filename);
            return done();
        }
        if (sizes1[0] !== sizes2[0] || sizes1[1] !== sizes2[1]) {
            differences++;
            log.warning('Image dimensions differ left and right: ' + filename);
            return done();
        }

        var command = util.format("'%s' '%s' '%s' -metric AE '%s'", config.im + 'compare', file1, file2, diffFile);
        child_process.exec(command, (err, stdout, stderr) => {

            // `compare` exit code 0 means equal, 1 means different, all else is an error
            if (err instanceof Error && err.code !== 0 && err.code !== 1) {
                differences++;
                log.warning(util.format("ImageMagick exited with code %d for file: '%s'", err.code, filename));
                log.warning(' ' + stderr.trim());
                return done();
            }

            // What percentage of pixels changed?
            var pixelsChanged = parseInt(stderr.trim(), 10);
            var percentage = (pixelsChanged / (sizes1[0] * sizes1[1]) * 100);

            // Report when verbose and remove diff image when necessary
            if (pixelsChanged > 0 && percentage > config.threshold) {
                differences++;
                log.verbose(config.verbose, util.format(
                    "Difference (%d%) above threshold (%d%) found for: '%s'",
                    percentage.toFixed(2),
                    config.threshold,
                    filename));
            } else if (pixelsChanged > 0) {
                fs.unlinkSync(diffFile);
                log.verbose(config.verbose, util.format(
                    "Difference (%d%) not bigger than threshold (%d%) for: '%s'",
                    percentage.toFixed(2),
                    config.threshold,
                    filename));
            } else {
                fs.unlinkSync(diffFile);
                log.verbose(config.verbose, util.format("Found exactly equal: '%s'", filename));
            }

            return done();
        });
    });

};

/**
 * Show warnings for non-existing files in either comparison directory
 *
 * @param {Config} config
 * @param {String[]} dir1 - List of files in the left directory
 * @param {String[]} dir2 - List of files in the right directory
 * @param {String} id1 - Identifier of the left directory
 * @param {String} id2 - Identifier of the right directory
 */
function showDirectoryDifferenceWarnings(config, dir1, dir2, id1, id2) {
    log.verbose(config.verbose, util.format(
        'Found a total of %d screenshot%s on the left side',
        dir1.length,
        util.plural(dir1.length)));
    log.verbose(config.verbose, util.format(
        'Found a total of %d screenshot%s on the right side',
        dir2.length,
        util.plural(dir2.length)));
    getDirectoryDiff(dir1, id1, id2, file => log.warning('Screenshot not found in right side: ' + file));
    getDirectoryDiff(dir2, id2, id1, file => log.warning('Screenshot not found in left side: ' + file));
}

/**
 * Invokes a callback for every file that does not exist in the right side of the comparison
 *
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
 *
 * @param {Config} config
 * @param {String} file - The full path to an image file
 * @returns {[Number, Number] | Boolean}
 */
function getImageSize(config, file) {
    var command = util.format("'%s' -ping -format '%w %h' '%s'", config.im + 'identify', file);
    try {
        var sizes = child_process.execSync(command, { encoding: 'utf8' });
        return sizes.trim().split(' ').map(num => parseInt(num, 10));
    } catch (e) {
        return false;
    }
}

/**
 * Remove all empty directories within a path
 * @param diffDirectory
 */
function removeEmptyDirectories(diffDirectory) {
    glob.sync(diffDirectory + '/**').forEach(node => {
        var isDir = util.directoryExists(node);
        var isEmpty = glob.sync(node + '/**/*').length === 0;
        if (isDir && isEmpty) {
            fs.rmdir(node);
        }
    });
}

/**
 * Output comparison results
 *
 * @param {String} diffDirectory
 * @param {Number} differences
 */
function reportResults(diffDirectory, differences) {
    if (differences) {
        log.error(util.format('Found %d difference%s',
            differences,
            util.plural(differences)));
        log.error(util.format("Diff image%s saved in: '%s'",
            util.plural(differences),
            path.relative(process.cwd(), diffDirectory)));
    } else {
        log.success('Found no significant differences');
    }
}
