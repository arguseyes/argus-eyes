var cfgLoader     = require('./configLoader');
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
 * @param {String} id1 - Left set of screenshots
 * @param {String} id2 - Right set of screenshots
 * @param {Function} cb - Callback, invoked when finished
 * @return {Boolean}
 */
module.exports = function compare(id1, id2, cb) {

    var config = cfgLoader.getConfig();

    var diffDirectory = config.base + '/diff_' + id1 + '_' + id2;
    var dir1 = glob.sync(config.base + '/' + id1 + '/**/*.png');
    var dir2 = glob.sync(config.base + '/' + id2 + '/**/*.png');

    // Clean up a potentially existing diff directory
    if (util.directoryExists(diffDirectory)) {
        rimraf.sync(diffDirectory);
    }
    util.mkdir(diffDirectory);

    showDirectoryDifferenceWarnings(dir1, dir2, id1, id2);

    // Asynchronous "is-everything-finished?" method
    var differences = 0;
    var count = dir1.length;
    var done = () => {
        if (--count === 0) { // are all async functions finished?
            util.removeEmptyDirectories(diffDirectory);
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

        var sizes1 = getImageSize(file1);
        var sizes2 = getImageSize(file2);
        if (!sizes1 || !sizes2) {
            log.error('Could not probe both left and right for image dimensions: ' + filename);
            return done();
        }

        // Resize image if it's smaller
        var fileResized = false;
        if (sizes1[0] !== sizes2[0] || sizes1[1] !== sizes2[1]) {
            log.verbose('Image dimensions differ left and right: ' + filename);
            try {
                if (isSmallest(sizes1, sizes2)) {
                    fileResized = file1 = resizeTo(file1, sizes2);
                } else {
                    fileResized = file2 = resizeTo(file2, sizes1);
                }
            } catch (e) {
                differences++;
                log.error('Could not resize smaller image: ' + filename);
                return done();
            }
        }

        // Execute imagemagick `compare` command
        var command = util.format('"%s" "%s" "%s" -metric AE "%s"',
            util.escape(config.im + 'compare'),
            util.escape(file1),
            util.escape(file2),
            util.escape(diffFile));
        child_process.exec(command, (err, stdout, stderr) => {

            // Remove temporary image
            if (fileResized && util.fileExists(fileResized)) {
                fs.unlinkSync(fileResized);
            }

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
                log.verbose(util.format(
                    "Difference (%d%) above threshold (%d%) found for: '%s'",
                    percentage.toFixed(2),
                    config.threshold,
                    filename));
            } else if (pixelsChanged > 0) {
                fs.unlinkSync(diffFile);
                log.verbose(util.format(
                    "Difference (%d%) not bigger than threshold (%d%) for: '%s'",
                    percentage.toFixed(2),
                    config.threshold,
                    filename));
            } else {
                fs.unlinkSync(diffFile);
                log.verbose(util.format("Found exactly equal: '%s'", filename));
            }

            return done();
        });
    });

};

/**
 * Show warnings for non-existing files in either comparison directory
 *
 * @param {String[]} dir1 - List of files in the left directory
 * @param {String[]} dir2 - List of files in the right directory
 * @param {String} id1 - Identifier of the left directory
 * @param {String} id2 - Identifier of the right directory
 */
function showDirectoryDifferenceWarnings(dir1, dir2, id1, id2) {
    log.verbose(util.format(
        'Found a total of %d screenshot%s on the left side',
        dir1.length,
        util.plural(dir1.length)));
    log.verbose(util.format(
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
    dir.forEach(file1 => {
        var file2 = file1.replace(id1, id2);
        if (!util.fileExists(file2)) {
            cb(file2);
        }
    });
}

/**
 * Returns the dimensions of an image file
 *
 * @param {String} file - The full path to an image file
 * @returns {[Number, Number] | Boolean}
 */
function getImageSize(file) {

    var config = cfgLoader.getConfig();

    var command = util.format(
        '"%s" -ping -format "%w %h" "%s"',
        util.escape(config.im + 'identify'),
        util.escape(file));

    try {
        var sizes = child_process.execSync(command, { encoding: 'utf8' });
        return sizes.trim().split(' ').map(num => parseInt(num, 10));
    } catch (e) {
        return false;
    }
}

/**
 * Is `file1` smaller than `file2` in image dimensions?
 *
 * @param {[Number, Number]} sizes1 - Dimensions of the left file
 * @param {[Number, Number]} sizes2 - Dimensions of the right file
 * @returns {Boolean}
 */
function isSmallest(sizes1, sizes2) {
    return (sizes1[0] * sizes1[1]) < (sizes2[0] * sizes2[1]);
}

/**
 * Resize an image to specified dimensions
 *
 * @param {String} file - Left filename
 * @param {[Number, Number]} sizes - Dimensions of the left file
 * @throws {Error}
 * @returns {String} - The filename of the just created file
 */
function resizeTo(file, sizes) {

    var imConvert = cfgLoader.getConfig().im + 'convert';
    var newName   = file + '.tmp.png';
    var newSizes  = sizes[0] + 'x' + sizes[1];

    log.verbose("Resizing '" + path.relative(process.cwd(), file) + "' to " + newSizes);

    var command = util.format(
        '"%s" "%s" -background transparent -extent %s "%s"',
        util.escape(imConvert),
        util.escape(file),
        newSizes,
        util.escape(newName));
    child_process.execSync(command);

    return newName;
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
