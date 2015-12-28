var system = require('system');
var page   = require('webpage').create();

// Configuration
var currentTries;
var maxTries = 20;
var tryTimeout = 100;

// CLI Arguments
var url    = system.args[1];
var file   = system.args[2];
var size   = system.args[3].split('x');
var sel    = system.args[4];
var ignore = JSON.parse(system.args[5]);

page.viewportSize = {
    width: size[0],
    height: size[1]
};

page.onConsoleMessage = function(msg, lineNum, sourceId) {
    if (lineNum && sourceId) {
        msg += ' (from line #' + lineNum + ' in "' + sourceId + '")';
    }
    console.log('Console: ' + msg);
};

page.open(url, function(status) {

    if (status !== 'success') {
        console.log('Unable to load the address: ' + url);
        return phantom.exit(1);
    }

    /**
     * Removes any ignored elements from the DOM
     *  Repeatedly invoked until it succeeds or maxTries is reached.
     */
    currentTries = 0;
    function tryRemoveIgnores() {

        currentTries++;

        var removed = page.evaluate(function(baseSelector, ignore) {
            try {
                ignore.forEach(function(selector) {
                    var element = document.querySelector(baseSelector + ' ' + selector);
                    element.parentNode.removeChild(element);
                });
                return true;
            } catch (e) {
                return false;
            }
        }, sel, ignore);

        if (removed) {
            currentTries = 0;
            tryClipRect();
        } else if (currentTries < maxTries) {
            setTimeout(tryRemoveIgnores, tryTimeout);
        } else {
            console.log('Unable to remove DOM element: \'' + file + '\', timed out after ' + maxTries + ' tries.');
            return phantom.exit(1);
        }
    }

    /**
     * Define the area of the web page to be rasterized when `page.render` is invoked
     *  Repeatedly invoked until it succeeds or maxTries is reached.
     */
    function tryClipRect() {

        currentTries++;

        var clipRect = page.evaluate(function(sel) {
            try {
                var element = document.querySelector(sel);
                return element.getBoundingClientRect();
            } catch (e) {
                return false;
            }
        }, sel);

        if (clipRect) {
            page.clipRect = {
                top:    clipRect.top,
                left:   clipRect.left,
                width:  clipRect.width,
                height: clipRect.height
            };
            currentTries = 0;
            tryScreenshot();
        } else if (currentTries < maxTries) {
            return setTimeout(tryClipRect, tryTimeout);
        } else {
            console.log('Unable to clip element \'' + sel + '\' at address: ' + url + ', timed out after ' + maxTries + ' tries.');
            return phantom.exit(1);
        }
    }

    /**
     * Save clipped element as .png file
     *  Repeatedly invoked until it succeeds or maxTries is reached.
     */
    function tryScreenshot() {

        currentTries++;

        if (page.render(file, { format: 'png', quality: '100' })) {
            phantom.exit();
        } else if (currentTries < maxTries) {
            setTimeout(tryScreenshot, tryTimeout);
        } else {
            console.log('Unable to write file: \'' + file + '\', timed out after ' + maxTries + ' tries.');
            return phantom.exit(1);
        }
    }

    if (ignore.length) {
        tryRemoveIgnores();
    } else {
        tryClipRect();
    }

});
