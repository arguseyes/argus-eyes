var chalk = require('chalk');

/**
 * Construct log functions, preset with or without color highlighting
 * @param {Boolean} color
 */
module.exports = function(color) {
    return {
        message: function(str) {
            var colored = timestamp() + str;
            console.log(color ? colored : chalk.stripColor(colored));
        },
        success: function(str) {
            var colored = timestamp() + chalk.green(str);
            console.log(color ? colored : chalk.stripColor(colored));
        },
        warning: function(str) {
            var colored = timestamp() + chalk.yellow(str);
            console.log(color ? colored : chalk.stripColor(colored));
        },
        error: function(str) {
            var colored = timestamp() + chalk.red(str);
            console.log(color ? colored : chalk.stripColor(colored));
        }
    };
};

/**
 * Makes a formatted time string, to be prefixed to console.log()
 * @returns {String}
 */
function timestamp() {
    var now = new Date;
    var pad = function(n) {
        return ('00' + n).substr(-2, 2);
    };
    var time = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    return '[' + chalk.grey(time) + '] ';
}
