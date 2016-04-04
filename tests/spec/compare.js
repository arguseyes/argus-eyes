var assert = require('assert');
var glob = require('glob').sync;
var spawnSync = require('child_process').spawnSync;
var normalize = require('path').normalize;
var rimraf = require('rimraf').sync;

describe('Action: Compare', function() {

    var cleanDirectories = function() {
        rimraf(normalize(__dirname + '/../fixtures/compare/*/diff_baseline_current'));
        rimraf(normalize(__dirname + '/../fixtures/compare/*/diff_shots-baseline_shots-current'));
    };
    beforeEach(cleanDirectories);
    afterEach(cleanDirectories);

    it('should pass scenario: 100% equal captures', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'current',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + '/../fixtures/compare/known-positives')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, 'Exitcode not 0!');
        assert.equal(/no significant differences/.test(proc.stdout), true, "string not found: 'no significant differences'");

    });

    it('should fail scenario: effectively equal captures', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'current',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + '/../fixtures/compare/known-positives-effectively')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/Found 1 difference/.test(proc.stdout), true, "string not found: 'Found 1 difference'");

    });

    it('should pass scenario: effectively equal captures with custom threshold', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'current',
            '--verbose',
            '--threshold=2',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + '/../fixtures/compare/known-positives-effectively')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, 'Exitcode not 0!');
        assert.equal(/no significant differences/.test(proc.stdout), true, "string not found: 'no significant differences'");
        assert.equal(/not bigger than threshold/.test(proc.stdout), true, "string not found: 'not bigger than threshold'");

    });

    it('should fail scenario: unequal captures', function() {

        var dir = '/../fixtures/compare/known-negatives';
        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'current',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + dir)
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/Found 1 difference/.test(proc.stdout), true, "string not found: 'Found 1 difference'");

        var diff = glob(normalize(__dirname + dir + '/diff_baseline_current/768x1024/homepage/footer.png')).length;
        assert.equal(diff, 1, 'Diff file was not created!');

    });

    it('should pass scenario: unequal captures with custom theshold', function() {

        var dir = '/../fixtures/compare/known-positives-effectively';
        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'current',
            '--threshold=0.01',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + dir),
            '--verbose'
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/Found 1 difference/.test(proc.stdout), true, "string not found: 'Found 1 difference'");

        var diff = glob(normalize(__dirname + dir + '/diff_baseline_current/768x1024/homepage/footer.png')).length;
        assert.equal(diff, 1, 'Diff file was not created!');

    });

    it('should pass scenario: equal captures of different sizes', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'current',
            '--verbose',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + '/../fixtures/compare/known-positives-different-sizes')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, 'Exitcode not 0!');
        assert.equal(/no significant differences/.test(proc.stdout), true, "string not found: 'no significant differences'");
        assert.equal(/dimensions differ/.test(proc.stdout), true, "string not found: 'dimensions differ'");

    });

    it('should fail scenario: unequal captures of different sizes', function() {

        var dir = '/../fixtures/compare/known-negatives-different-sizes';
        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'current',
            '--verbose',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + dir)
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/Found 1 difference/.test(proc.stdout), true, "string not found: 'Found 1 difference'");
        assert.equal(/dimensions differ/.test(proc.stdout), true, "string not found: 'dimensions differ'");

        var diff = glob(normalize(__dirname + dir + '/diff_baseline_current/768x1024/homepage/footer.png')).length;
        assert.equal(diff, 1, 'Diff file was not created!');

    });

    it('should fail scenario: missing left captures', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'current',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + '/../fixtures/compare/known-positives-missing-left')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, 'Exitcode not 0!');
        assert.equal(/no significant differences/.test(proc.stdout), true, "string not found: 'no significant differences'");
        assert.equal(/not found in left side/.test(proc.stdout), true, "string not found: 'not found in left side'");

    });

    it('should fail scenario: missing right captures', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'current',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + '/../fixtures/compare/known-positives-missing-right')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, 'Exitcode not 0!');
        assert.equal(/no significant differences/.test(proc.stdout), true, "string not found: 'no significant differences'");
        assert.equal(/not found in right side/.test(proc.stdout), true, "string not found: 'not found in left side'");

    });

    it('should handle identifiers with a slash', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'shots/baseline',
            'shots/current',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + '/../fixtures/compare/known-positives-slashes')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, 'Exitcode not 0!');
        assert.equal(/no significant differences/.test(proc.stdout), true, "string not found: 'no significant differences'");

    });

    // @todo Implement
    xit('should not leave empty directories', function() {});

});
