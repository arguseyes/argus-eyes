var chalk = require('chalk');

var useColor = false;

/**
 * Expose module functions
 */
module.exports = {
    setColor,
    info,
    success,
    warning,
    error,
    verbose
};

/**
 * Set the color for all logging from now on
 *
 * @param {Boolean} color
 */
function setColor(color) {
    useColor = !!color;
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
 * Verbose logging level
 *
 * @param {Boolean} output - Only output `str` if this is `true`
 * @param {String} msg
 */
function verbose(output, msg) {
    if (output) {
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
    console.log(useColor ? coloredMessage : chalk.stripColor(coloredMessage));
}
