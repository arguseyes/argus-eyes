var child_process = require('child_process');
var fs            = require('fs');
var util          = require('util');
var glob          = require('glob').sync;
var mkdirp        = require('mkdirp').sync;

/**
 * Expose module functions
 */
module.exports = {
    escape,
    fileExists,
    fileExistsAsync,
    directoryExists,
    isExecutable,
    mkdir,
    removeEmptyDirectories,
    format: util.format,
    prefixStdStream,
    plural
};

/**
 * Escape double quotes
 *
 * @param {String} str
 * @returns {String}
 */
function escape(str) {
    return str.replace(/"/g, '\\"');
}

/**
 * Checks if a path exists and is of the type 'file'
 *
 * @param {String} file
 * @returns {Boolean}
 */
function fileExists(file) {
    try {
        return fs.statSync(file).isFile();
    } catch (e) {
        return false;
    }
}

/**
 * Async fileExists()
 *
 * @param {String} file
 * @param {Function} cb
 */
function fileExistsAsync(file, cb) {
    fs.stat(file, (err, stats) => {
        if (err) return cb(err);
        return cb(null, stats.isFile());
    });
}

/**
 * Checks if a path exists and is of the type 'directory'
 *
 * @param {String} dir
 * @returns {Boolean}
 */
function directoryExists(dir) {
    try {
        return fs.statSync(dir).isDirectory();
    } catch (e) {
        return false;
    }
}

/**
 * Checks if a command is executable, and returns an exit code 0
 *
 * @param {String} cmd
 * @param {String[]} args
 * @returns {Boolean}
 */
function isExecutable(cmd, args) {
    try {
        child_process.execFileSync(cmd, args);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Brute-force try to make a directory, ignoring a failure
 *
 * @param {String} dir
 */
function mkdir(dir) {
    try {
        mkdirp(dir);
    } catch (e) {}
}

/**
 * Remove all empty directories within a path
 *
 * @param {String} path
 * @returns {Boolean}
 */
function removeEmptyDirectories(path) {

    var getEmptyDirs = node => {
        dirs = getAllDirs(node).filter(isEmptyDir);
        return dirs.length ? dirs : false;
    };
    var getAllDirs = node => getAllNodes(node).filter(directoryExists);
    var isEmptyDir = node => getAllNodes(node).length === 0;
    var getAllNodes = path => glob(path + '/**/*');

    try {
        var dirs;
        while (dirs = getEmptyDirs(path)) dirs.map(fs.rmdirSync);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Prefix standard stream output
 *
 * @param {String} stream - Stream name, such as 'stdout'
 * @param {String} str - Output string to process
 * @returns {String}
 */
function prefixStdStream(stream, str) {
    return str
        .trim()
        .split('\n')
        .map(line => stream + ': ' + line)
        .join('\n');
}

/**
 * Returns an empty string or a 's' character depending on whether it needs pluralization
 *
 * @param {Number} num
 * @returns {String}
 */
function plural(num) {
    return num === 1 ? '' : 's';
}
