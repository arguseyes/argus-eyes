var async = require('async');
var fs = require('fs');

// 10s timeout on this script
setTimeout(function() {
    return phantom.exit(1);
}, 10 * 1000);

// PhantomJS API
var system = require('system');
var page   = require('webpage').create();

// Configuration
var maxTries   = 50;
var tryTimeout = 100;
var invoker = _invoker(maxTries, tryTimeout);

// CLI Arguments
var basePath      = system.args[1];
var url           = system.args[2];
var pageBase      = system.args[3];
var size          = system.args[4].split('x');
var userPage      = JSON.parse(system.args[5]);
var components    = JSON.parse(system.args[6]);
var delayScript   = system.args[7];
var delayMs       = parseInt(system.args[8], 10);

page.viewportSize = {
    width: size[0],
    height: size[1]
};

page.onConsoleMessage = function(msg) {
    console.log('console: ' + msg);
};

/**
 * PhantomJS script
 */
page.open(url, function(status) {

    if (status !== 'success') {
        console.log('Unable to load the address: ' + url);
        return phantom.exit(1);
    }

    async.waterfall([
        waitForLoad,
        waitForScript,
        waitForDelay,
        tryRemoveIgnores,
        tryClipRect
    ], function(err) {
        if (err) {
            console.log(err);
            phantom.exit(1);
        }
        phantom.exit();
    });

});

/**
 * Wait for the ready state 'complete' (window.onload)
 */
function waitForLoad(cb) {
    invoker(_isLoaded, function(err) {
        if (err) {
            return cb('document.readyState not \'completed\', timed out after ' + (maxTries * tryTimeout) + 'ms.');
        }
        cb();
    });
}

/**
 * Wait for the wait-for-script
 */
function waitForScript(cb) {

    var tasks = [];

    if (delayScript) {
        tasks.push(function(cb) {
            invoker(_isFinished(delayScript), function(err) {
                if (err) {
                    return cb('wait-for-script (global-level) still not returning a truthy value, timed out after ' +
                        (maxTries * tryTimeout) + ' ms.');
                }
                cb();
            });
        });
    }

    if (userPage['wait-for-script']) {
        tasks.push(function(cb) {
            invoker(_isFinished(userPage['wait-for-script']), function(err) {
                if (err) {
                    return cb('wait-for-script (page-level) still not returning a truthy value, timed out after ' +
                        (maxTries * tryTimeout) + ' ms.');
                }
                cb();
            });
        });
    }

    components.forEach(function(component) {
        if (!component['wait-for-script']) return;
        tasks.push(function(cb) {
            invoker(_isFinished(component['wait-for-script']), function(err) {
                if (err) {
                    return cb('wait-for-script (component-level) still not returning a truthy value for component ' +
                        '\'' + component.name + '\', timed out after ' + (maxTries * tryTimeout) + ' ms.');
                }
                cb();
            });
        });
    });

    async.waterfall(tasks, function(err) { cb(err); });
}

/**
 * Wait for the wait-for-delay (in milliseconds)
 */
function waitForDelay(cb) {

    // Wait for - level global
    setTimeout(function() {

        // Wait for - level page
        var delay = parseInt(userPage['wait-for-delay'], 10) || 0;
        setTimeout(function() {

            // Wait for - level components
            async.waterfall(components.map(function(component) {
                var delay = parseInt(component['wait-for-delay'], 10) || 0;
                return function(cb) { setTimeout(cb, delay); };
            }), function() { cb(); });
        }, delay);
    }, delayMs);
}

/**
 * Removes any ignored elements from the DOM
 */
function tryRemoveIgnores(cb) {
    async.parallel(components.map(function(component) {
        return function(cb) {
            if (!component.ignore || !component.ignore.length) return cb();
            invoker(_isRemoved(component), function(err) {
                if (err) {
                    return cb('Unable to hide DOM element: \'' + component.ignore + '\'' +
                        ', timed out after ' + (maxTries * tryTimeout) + ' ms.');
                }
                cb();
            });
        };
    }), function(err) {
        cb(err);
    });
}

/**
 * Clip element and save as .png file
 */
function tryClipRect(cb) {
    async.parallel(components.map(function(component) {
        return function(cb) {
            invoker(_clipRect(component), function(err) {
                if (err) {
                    return cb('Unable to clip component \'' + component.name + '\'' +
                        ', timed out after ' + (maxTries * tryTimeout / 1e3) + ' ms.');
                }
                cb();
            });
        };
    }), function(err) {
        cb(err);
    });
}

/**
 * Returns whether window.onload has fired
 *
 * @private
 * @returns {Boolean}
 */
function _isLoaded() {
    var readyState = page.evaluate(function() {
        return document.readyState;
    });
    return readyState === 'complete';
}

/**
 * Call a wait-for-script user function script
 *
 * @private
 * @param {String} scriptFilename
 * @returns {Function}
 */
function _isFinished(scriptFilename) {

    var scriptPath = scriptFilename;
    if (!fs.isAbsolute(scriptPath)) {
        scriptPath = basePath + '/' + scriptPath;
    }

    try {
        var script = fs.read(scriptPath);
    } catch (e) {
        console.log('Could not read file: ' + scriptFilename);
        phantom.exit(1);
    }

    return function() {
        return page.evaluate(function(script) {
            return (Function(script))();
        }, script);
    };
}

/**
 * Returns a function that tries to hide a HTMLElement
 *
 * @private
 * @param {{name: String, selector: String, ignore: String[]}} component
 * @returns {Function}
 */
function _isRemoved(component) {
    return function() {
        return page.evaluate(function(baseSelector, ignore) {
            try {
                ignore.forEach(function(selector) {
                    var element = document.querySelector(baseSelector + ' ' + selector);
                    element.style.display = 'none';
                });
                return true;
            } catch (e) {
                return false;
            }
        }, component.selector, component.ignore);
    };
}

/**
 * Sets the clipping rectangle for element screenshots
 *
 * @private
 * @param {{name: String, selector: String, ignore: String[]}}component
 * @returns {Function}
 */
function _clipRect(component) {
    return function() {

        var clipRect = page.evaluate(function(component) {
            try {
                var rect = document.querySelector(component.selector).getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) {
                    return false;
                }
                return {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                };
            } catch (e) {
                return false;
            }
        }, component);

        if (!clipRect) return false;
        page.clipRect = clipRect;

        try {
            page.render(pageBase + '/' + component.name + '.png', {
                format: 'png',
                quality: '0' // quality is file compression since png is lossless, 0 is maximum compression
            });
        } catch (e) {
            return false;
        }

        return true;
    };
}

/**
 * Invoker
 *  Repeatedly invokes a function until it returns a truthy value
 *
 * @see https://gist.github.com/branneman/53b820be519b54bfc30a
 * @private
 * @param {Number} limit - The amount of total calls before we timeout
 * @param {Number} interval - The amount of milliseconds between calls
 * @param {Function} fn - The function to execute, must return a truthy value to indicate it's finished
 * @param {Function} cb - The callback for when we're finished. Receives 2 arguments: `error` and `result`
 */
function _invoker(limit, interval) {
    return function(fn, cb) {
        var current = 0;
        var _fn = function() {
            current++;
            var result = fn();
            if (result) {
                cb(null, result);
            } else if (current < limit) {
                setTimeout(_fn, interval);
            } else {
                cb(new Error('Limit exceeded!'), null);
                cb = function() {};
            }
        };
        _fn();
    };
}
