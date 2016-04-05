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
var url        = system.args[1];
var pageBase   = system.args[2];
var size       = system.args[3].split('x');
var components = JSON.parse(system.args[4]);
var userScript = system.args[5];

page.viewportSize = {
    width: size[0],
    height: size[1]
};

page.onConsoleMessage = function(msg) {
    console.log('console: ' + msg);
};

page.open(url, function(status) {

    if (status !== 'success') {
        console.log('Unable to load the address: ' + url);
        return phantom.exit(1);
    }

    // Initalize PhantomJS script
    waitForLoad();

    /**
     * Wait for the ready state 'complete'
     *  Repeatedly invoked until it succeeds or maxTries is reached.
     */
    function waitForLoad() {

        var isLoaded = function() {
            var readyState = page.evaluate(function() {
                return document.readyState;
            });
            return readyState === 'complete';
        };

        invoker(isLoaded, function(err) {
            if (err) {
                console.log('document.readyState not \'completed\', timed out after ' + (maxTries * tryTimeout) + 'ms.');
                return phantom.exit(1);
            }
            waitForUserScript();
        });
    }

    /**
     * Wait for the user script to report the page is ready for a screenshot
     *  Repeatedly invoked until it succeeds or maxTries is reached.
     */
    function waitForUserScript() {

        var isFinished = function() {
            return page.evaluate(function(userScript) {
                return (Function(userScript))();
            }, userScript);
        };

        invoker(isFinished, function(err) {
            if (err) {
                console.log('finished-when userscript still not completed, timed out after ' +
                    (maxTries * tryTimeout) + ' ms.');
                return phantom.exit(1);
            }
            tryRemoveIgnores();
        });
    }

    /**
     * Removes any ignored elements from the DOM
     *  Repeatedly invoked until it succeeds or maxTries is reached.
     */
    function tryRemoveIgnores() {

        var count = components.length;
        var done = function() {
            if (--count === 0) {
                done = function() {};
                tryClipRect();
            }
        };

        components.forEach(function(component) {

            if (!component.ignore || !component.ignore.length) return done();

            var isRemoved = function() {
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

            invoker(isRemoved, function(err) {
                if (err) {
                    console.log('Unable to remove DOM element: \'' + component.selector + '\'' +
                        ', timed out after ' + (maxTries * tryTimeout) + ' ms.');
                    return phantom.exit(1);
                }
                done();
            });

        });
    }

    /**
     * Clip element and save as .png file
     *  Repeatedly invoked until it succeeds or maxTries is reached.
     */
    function tryClipRect() {

        var count = components.length;
        var done = function() {
            if (--count === 0) phantom.exit();
        };

        components.forEach(function(component) {

            var clipRect = function() {

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

                if (!clipRect) return;
                page.clipRect = clipRect;

                try {
                    page.render(pageBase + '/' + component.name + '.png', {
                        format: 'png',
                        quality: '0' // quality is file compression since png is lossless
                    });
                } catch (e) {
                    return false;
                }

                return true;
            };

            invoker(clipRect, function(err) {
                if (err) {
                    console.log('Unable to clip component \'' + component.name + '\'' +
                        ', timed out after ' + (maxTries * tryTimeout / 1e3) + ' ms.');
                    return phantom.exit(1);
                }
                done();
            });
        });
    }

});

/**
 * Invoker
 *  Repeatedly invokes a function until it returns a truthy value
 *
 * @see https://gist.github.com/branneman/53b820be519b54bfc30a
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
