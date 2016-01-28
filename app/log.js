var chalk = require('chalk');

/**
 * @type {Boolean}
 * @private
 */
var _verbose  = false;
var _useColor = true;

/**
 * Expose module functions
 */
module.exports = {
    setVerbose,
    setUseColor,
    info,
    success,
    warning,
    error,
    verbose
};

/**
 * Set whether verbose logging is enabled
 *
 * @param {Boolean} verbose
 * @returns {Boolean}
 */
function setVerbose(verbose) {
    return _verbose = verbose;
}

/**
 * Set whether color is used in all output
 *
 * @param {Boolean} useColor
 * @returns {Boolean}
 */
function setUseColor(useColor) {
    return _useColor = useColor;
}

/**
 * Information logging level
 *
 * @param {String} msg
 */
function info(msg) {
    _log(msg);
}

/**
 * Verbose logging level, only outputs when _verbose is `true`
 *
 * @param {String} msg
 */
function verbose(msg) {
    if (_verbose) {
        _log(chalk.gray('[verbose] ' + msg));
    }
}

/**
 * Success logging level
 *
 * @param {String} msg
 */
function success(msg) {
    _log(chalk.green(msg));
}

/**
 * Warning logging level
 *
 * @param {String} msg
 */
function warning(msg) {
    _log(chalk.yellow(msg));
}

/**
 * Error logging level
 *
 * @param {String} msg
 */
function error(msg) {
    _log(chalk.red(msg));
}

/**
 * Log a message
 *
 * @private
 * @param {String} coloredMessage
 */
function _log(coloredMessage) {
    console.log(_useColor ? coloredMessage : chalk.stripColor(coloredMessage));
}
