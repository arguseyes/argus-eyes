var system = require('system');
var page   = require('webpage').create();

// Configuration
var currentTries;
var maxTries = 20;
var tryTimeout = 100;

// CLI Arguments
var url  = system.args[1];
var file = system.args[2];
var size = system.args[3].split('x');
var sel  = system.args[4];

page.viewportSize = {
    width: size[0],
    height: size[1]
};

page.open(url, function(status) {

    if (status !== 'success') {
        console.log('Unable to load the address: ' + url);
        return phantom.exit(1);
    }

    // Define the area of the web page to be rasterized when `page.render` is invoked
    currentTries = 0;
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
            tryScreenshot();
        } else if (currentTries < maxTries) {
            return setTimeout(tryClipRect, tryTimeout);
        } else {
            console.log('Unable to clip element \'' + sel + '\' at address: ' + url);
            return phantom.exit(1);
        }
    }

    // Repeatedly invoke page.render() until the method returns true
    currentTries = 0;
    function tryScreenshot() {
        currentTries++;
        if (page.render(file, { format: 'png', quality: '100' })) {
            phantom.exit();
        } else if (currentTries < maxTries) {
            setTimeout(tryScreenshot, tryTimeout);
        }
    }

    tryClipRect();

});
