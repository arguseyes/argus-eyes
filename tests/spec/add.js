var assert = require('assert');
var spawnSync = require('child_process').spawnSync;
var normalize = require('path').normalize;
var glob = require('glob').sync;
var rimraf = require('rimraf').sync;

describe('Action: Add', function() {

    var cleanDirectories = function() {
        rimraf(normalize(__dirname + '/../../.argus-eyes'));
        rimraf(normalize(__dirname + '/../../.argus-eyes-custom-dir'));
        rimraf(normalize(__dirname + '/../fixtures/add/*/test-generated'));
        rimraf(normalize(__dirname + '/../fixtures/add/*/diff_baseline_test-generated'));
    };
    beforeEach(cleanDirectories);
    afterEach(cleanDirectories);

    it('should pass scenario: config with 2 sizes, 2 pages with both 2 components', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'add',
            'test',
            '--config=' + normalize(__dirname + '/../fixtures/add/valid.json')
        ], { encoding: 'utf8' });

        // Assert correct exitcode
        assert.equal(proc.status, 0, proc.stdout);

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

        var procAdd = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'add',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/add/known-positives/known-positives.json'),
            '--base=' + normalize(__dirname + '/../fixtures/add/known-positives')
        ], { encoding: 'utf8' });

        var procCompare = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/add/known-positives/known-positives.json'),
            '--base=' + normalize(__dirname + '/../fixtures/add/known-positives'),
            '--verbose'
        ], { encoding: 'utf8' });

        assert.equal(procAdd.status, 0, procAdd.stdout);
        assert.equal(procCompare.status, 0, procCompare.stdout);
        console.log('lol!');
        process.exit();

    });

    it('should fail scenario: taken captures should not match known negatives', function() {

        var procAdd = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'add',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/add/known-negatives/known-negatives.json'),
            '--base=' + normalize(__dirname + '/../fixtures/add/known-negatives')
        ], { encoding: 'utf8' });

        var procCompare = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'test-generated',
            '--config=' + normalize(__dirname + '/../fixtures/add/known-negatives/known-negatives.json'),
            '--base=' + normalize(__dirname + '/../fixtures/add/known-negatives'),
            '--verbose'
        ], { encoding: 'utf8' });

        assert.equal(procAdd.status, 0, procAdd.stdout);
        assert.equal(procCompare.status, 1, procCompare.stdout);
        assert.equal(/Found 1 difference/.test(procCompare.stdout), true, procCompare.stdout);

    });

    it('should handle identifiers with a slash', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'add',
            'test1/test2',
            '--config=' + normalize(__dirname + '/../fixtures/add/valid.json')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, proc.stdout);
        assert.equal(glob('.argus-eyes/*')[0], '.argus-eyes/test1-test2', 'Correct directory not found!');

    });

    it('should be able to save in a different base directory', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'add',
            'test',
            '--config=' + normalize(__dirname + '/../fixtures/add/valid.json'),
            '--base=' + normalize(__dirname + '/../../.argus-eyes-custom-dir')
        ], { encoding: 'utf8' });

        var numDirs = glob(normalize(__dirname + '/../../.argus-eyes-custom-dir') + '/*').length;

        assert.equal(proc.status, 0, proc.stdout);
        assert.equal(numDirs, 1);

    });

});
