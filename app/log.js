var chalk = require('chalk');

/**
 * Construct log functions, preset with or without color highlighting
 *
 * @param {Boolean} color
 */
module.exports = function(color) {
    return {
        message: function(str) {
            log(false, str);
        },
        verbose: function(output, str) {
            if (output) log(color, chalk.gray('[verbose] ' + str));
        },
        success: function(str) {
            log(color, chalk.green(str));
        },
        warning: function(str) {
            log(color, chalk.yellow(str));
        },
        error: function(str) {
            log(color, chalk.red(str));
        }
    };
};

/**
 * Log a message, either colored or not
 *
 * @param {Boolean} useColor - If this is false, color will be stripped from `coloredMessage`
 * @param {String} coloredMessage
 */
function log(useColor, coloredMessage) {
    console.log(useColor ? coloredMessage : chalk.stripColor(coloredMessage));
}
