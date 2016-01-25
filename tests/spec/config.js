var assert = require('assert');
var path = require('path');
var spawnSync = require('child_process').spawnSync;
var spawnAdd = require('../helpers/spawn-argus-eyes').spawnAdd;

describe('Config file', function() {

    it('should print the usage information without a config file', function() {

        var args = [
            path.normalize(__dirname + '/../../bin/argus-eyes.js'),
            '--help'
        ];

        var proc = spawnSync('node', args, { encoding: 'utf8' });

        assert.equal(0, proc.status, proc.stdout);
        assert.equal(true, /Usage:[\s\S]+Options:/.test(proc.stdout), proc.stdout);
    });

    it('should print the version without a config file', function() {

        var args = [
            path.normalize(__dirname + '/../../bin/argus-eyes.js'),
            '--version'
        ];

        var proc = spawnSync('node', args, { encoding: 'utf8' });

        assert.equal(0, proc.status, proc.stdout);
        assert.equal(true, /v\d+\.\d+\.\d+/.test(proc.stdout), proc.stdout);
    });

    it('should fail add & compare without a config file', function() {
        var proc = spawnAdd('dev', 'file-does-not-exist.json');
        assert.equal(1, proc.status, proc.stdout);
    });

    // @todo implement
    xit('should fail with an invalid config file', function() {});
    xit('should fail without correct sizes', function() {});
    xit('should fail without correct pages', function() {});
    xit('should fail without correct components', function() {});
    xit('should fail when url\'s do not respond', function() {});
    xit('should fail when components do not exist in the DOM', function() {});
});
