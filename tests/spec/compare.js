var assert = require('assert');
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

        assert.equal(proc.status, 0, proc.stdout);
        assert.equal(/no significant differences/.test(proc.stdout), true, "string not found: 'no significant differences'");

    });

    it('should pass scenario: effectively equal captures', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'current',
            '--verbose',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + '/../fixtures/compare/known-positives-effectively')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, proc.stdout);
        assert.equal(/no significant differences/.test(proc.stdout), true, "string not found: 'no significant differences'");
        assert.equal(/not bigger than threshold/.test(proc.stdout), true, "string not found: 'not bigger than threshold'");

    });

    it('should fail scenario: unequal captures', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'current',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + '/../fixtures/compare/known-negatives')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 1, proc.stdout);
        assert.equal(/Found 1 difference/.test(proc.stdout), true, "string not found: 'Found 1 difference'");

    });

    it('should pass scenario: unequal captures with custom theshold', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'current',
            '--threshold=0.05',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + '/../fixtures/compare/known-positives-effectively')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 1, proc.stdout);
        assert.equal(/Found 1 difference/.test(proc.stdout), true, "string not found: 'Found 1 difference'");

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

        assert.equal(proc.status, 0, proc.stdout);
        assert.equal(/no significant differences/.test(proc.stdout), true, "string not found: 'no significant differences'");
        assert.equal(/dimensions differ/.test(proc.stdout), true, "string not found: 'dimensions differ'");
        assert.equal(/resizing/i.test(proc.stdout), true, "string not found: 'resizing'");

    });

    it('should fail scenario: unequal captures of different sizes', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'compare',
            'baseline',
            'current',
            '--verbose',
            '--config=' + normalize(__dirname + '/../fixtures/compare/valid.json'),
            '--base=' + normalize(__dirname + '/../fixtures/compare/known-negatives-different-sizes')
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 1, proc.stdout);
        assert.equal(/Found 1 difference/.test(proc.stdout), true, "string not found: 'Found 1 difference'");
        assert.equal(/dimensions differ/.test(proc.stdout), true, "string not found: 'dimensions differ'");
        assert.equal(/resizing/i.test(proc.stdout), true, "string not found: 'resizing'");

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

        assert.equal(proc.status, 0, proc.stdout);
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

        assert.equal(proc.status, 0, proc.stdout);
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

        assert.equal(proc.status, 0, proc.stdout);
        assert.equal(/no significant differences/.test(proc.stdout), true, "string not found: 'no significant differences'");

    });

    // @todo Implement
    xit('should not leave empty directories', function() {});
    xit('should handle a specified imagemagick path', function() {});

});
