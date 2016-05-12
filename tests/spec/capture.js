var assert = require('assert');
var spawnSync = require('child_process').spawnSync;
var normalize = require('path').normalize;
var glob = require('glob').sync;
var rimraf = require('rimraf').sync;

describe('Action: Capture', function() {

    var cleanDirectories = function() {
        rimraf(normalize(__dirname + '/../../.argus-eyes'));
        rimraf(normalize(__dirname + '/../../.argus-eyes-custom-dir'));
        rimraf(normalize(__dirname + '/../fixtures/capture/*/test-generated'));
        rimraf(normalize(__dirname + '/../fixtures/capture/*/diff_baseline_test-generated'));
    };
    beforeEach(cleanDirectories);
    afterEach(cleanDirectories);

    it('should pass scenario: config with 2 sizes, 2 pages with both 2 components', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'capture',
            'test',
            '--config=' + normalize(__dirname + '/../fixtures/capture/valid.json')
        ], { encoding: 'utf8' });

        // Assert correct exitcode and output
        assert.equal(proc.status, 0, 'Exitcode not 0!');
        assert.equal(/saved \d screenshot/i.test(proc.stdout), true, "string not found: 'saved x screenshots'");

        // Assert size directories
        var numDirs1 = glob(normalize(__dirname + '/../../.argus-eyes/test') + '/*').length;
        assert.equal(numDirs1, 2, 'Result must have 2 size directories!');

        // Assert page directories
        var numDirs2 = glob(normalize(__dirname + '/../../.argus-eyes/test/320x480') + '/*').length;
        var numDirs3 = glob(normalize(__dirname + '/../../.argus-eyes/test/768x1024') + '/*').length;
        assert.deepEqual([numDirs2, numDirs3], [2, 2], 'Both sizes must have 2 page directories!');

        // Assert capture files
        var numDirs4 = glob(normalize(__dirname + '/../../.argus-eyes/test/320x480/homepage') + '/*.png').length;
        var numDirs5 = glob(normalize(__dirname + '/../../.argus-eyes/test/320x480/contact') + '/*.png').length;
        var numDirs6 = glob(normalize(__dirname + '/../../.argus-eyes/test/768x1024/homepage') + '/*.png').length;
        var numDirs7 = glob(normalize(__dirname + '/../../.argus-eyes/test/768x1024/contact') + '/*.png').length;
        assert.deepEqual([numDirs4, numDirs5, numDirs6, numDirs7], [2, 2, 2, 2], 'All pages must have 2 page captures!');

    });

    it('should pass scenario: taken captures should match known positives', function() {

        var procCapture = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'capture',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/known-positives/known-positives.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/known-positives')
        ], { encoding: 'utf8' });

        var procCompare = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/known-positives/known-positives.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/known-positives')
        ], { encoding: 'utf8' });

        assert.equal(procCapture.status, 0, 'Exitcode not 0!');
        assert.equal(/saved \d screenshot/i.test(procCapture.stdout), true, "string not found: 'saved x screenshots'");

        assert.equal(procCompare.status, 0, 'Exitcode not 0!');
        assert.equal(/no significant differences/.test(procCompare.stdout), true, "string not found: 'no significant differences'");

    });

    it('should fail scenario: taken captures should not match known negatives', function() {

        var procCapture = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'capture',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/known-negatives/known-negatives.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/known-negatives')
        ], { encoding: 'utf8' });

        var procCompare = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/known-negatives/known-negatives.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/known-negatives')
        ], { encoding: 'utf8' });

        assert.equal(procCapture.status, 0, 'Exitcode not 0!');
        assert.equal(/saved \d screenshot/i.test(procCapture.stdout), true, "string not found: 'saved x screenshots'");

        assert.equal(procCompare.status, 1, 'Exitcode not 1!');
        assert.equal(/Found 1 difference/.test(procCompare.stdout), true, procCompare.stdout);

    });

    it('should wait for a global wait-for-script', function() {

        var procCapture = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'capture',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/wait-for-script/wait-for-script.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/wait-for-script')
        ], { encoding: 'utf8' });

        var procCompare = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/wait-for-script/wait-for-script.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/wait-for-script')
        ], { encoding: 'utf8' });

        assert.equal(procCapture.status, 0, 'Exitcode not 0!');
        assert.equal(/saved \d screenshot/i.test(procCapture.stdout), true, "string not found: 'saved x screenshots'");

        assert.equal(procCompare.status, 0, 'Exitcode not 0!');
        assert.equal(/no significant differences/.test(procCompare.stdout), true, "string not found: 'no significant differences'");

    });

    it('should wait for multiple wait-for-script', function() {

        var procCapture = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'capture',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/wait-for-script/wait-for-script-multiple.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/wait-for-script')
        ], { encoding: 'utf8' });

        var procCompare = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/wait-for-script/wait-for-script-multiple.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/wait-for-script')
        ], { encoding: 'utf8' });

        assert.equal(procCapture.status, 0, 'Exitcode not 0!');
        assert.equal(/saved \d screenshot/i.test(procCapture.stdout), true, "string not found: 'saved x screenshots'");

        assert.equal(procCompare.status, 0, 'Exitcode not 0!');
        assert.equal(/no significant differences/.test(procCompare.stdout), true, "string not found: 'no significant differences'");

    });

    it('should wait for wait-for-delay', function() {

        var procCapture = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'capture',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/wait-for-delay/wait-for-delay.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/wait-for-delay')
        ], { encoding: 'utf8' });

        var procCompare = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/wait-for-delay/wait-for-delay.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/wait-for-delay')
        ], { encoding: 'utf8' });

        assert.equal(procCapture.status, 0, 'Exitcode not 0!');
        assert.equal(/saved \d screenshot/i.test(procCapture.stdout), true, "string not found: 'saved x screenshots'");

        assert.equal(procCompare.status, 0, 'Exitcode not 0!');
        assert.equal(/no significant differences/.test(procCompare.stdout), true, "string not found: 'no significant differences'");

    });

    it('should run the user scripts', function() {

        var procCapture = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'capture',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/run-script/run-script.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/run-script')
        ], { encoding: 'utf8' });

        var procCompare = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/run-script/run-script.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/run-script')
        ], { encoding: 'utf8' });

        assert.equal(procCapture.status, 0, 'Exitcode not 0!');
        assert.equal(/saved \d screenshot/i.test(procCapture.stdout), true, "string not found: 'saved x screenshots'");

        assert.equal(procCompare.status, 0, 'Exitcode not 0!');
        assert.equal(/no significant differences/.test(procCompare.stdout), true, "string not found: 'no significant differences'");

    });

    it('should handle ignored elements', function() {

        var procCapture = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'capture',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/ignored-element/ignored-element.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/ignored-element')
        ], { encoding: 'utf8' });

        var procCompare = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/capture/ignored-element/ignored-element.json'),
            '--base=' + normalize(__dirname + '/../fixtures/capture/ignored-element')
        ], { encoding: 'utf8' });

        assert.equal(procCapture.status, 0, 'Exitcode not 0!');
        assert.equal(/saved \d screenshot/i.test(procCapture.stdout), true, "string not found: 'saved x screenshots'");

        assert.equal(procCompare.status, 0, 'Exitcode not 0!');
        assert.equal(/no significant differences/.test(procCompare.stdout), true, "string not found: 'no significant differences'");

    });

    it('should handle identifiers with a slash', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'capture',
            'test1/test2',
            '--config=' + normalize(__dirname + '/../fixtures/capture/slugified-identifiers/slugified-identifiers.json')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, 'Exitcode not 0!');
        assert.equal(/saved \d screenshot/i.test(proc.stdout), true, "string not found: 'saved x screenshots'");
        assert.equal(glob('.argus-eyes/*')[0], '.argus-eyes/test1-test2', 'Correct directory not found!');
        assert.equal(glob('.argus-eyes/test1-test2/320x480/*')[0], '.argus-eyes/test1-test2/320x480/pages-contact', 'Correct directory not found!');

    });

    it('should be able to save in a different base directory', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'capture',
            'test',
            '--config=' + normalize(__dirname + '/../fixtures/capture/valid.json'),
            '--base=' + normalize(__dirname + '/../../.argus-eyes-custom-dir')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, 'Exitcode not 0!');
        assert.equal(/saved \d screenshot/i.test(proc.stdout), true, "string not found: 'saved x screenshots'");

        var numDirs = glob(normalize(__dirname + '/../../.argus-eyes-custom-dir') + '/*').length;
        assert.equal(numDirs, 1);

    });

});
