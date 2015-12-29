var cfgLoader = require('./configLoader');
var chalk     = require('chalk');

/**
 * Expose module functions
 */
module.exports = {
    info,
    success,
    warning,
    error,
    verbose
};

/**
 * Information logging level
 *
 * @param {String} msg
 */
function info(msg) {
    _log(msg);
}

/**
 * Verbose logging level, only outputs when config.verbose is `true`
 *
 * @param {String} msg
 */
function verbose(msg) {
    if (cfgLoader.getConfig().verbose) {
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
    var useColor = cfgLoader.getConfig().color;
    console.log(useColor ? coloredMessage : chalk.stripColor(coloredMessage));
}
