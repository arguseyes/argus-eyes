var assert = require('assert');
var spawnSync = require('child_process').spawnSync;
var normalize = require('path').normalize;

describe('Action: Help', function() {

    it('should print the usage information', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            '--help'
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, proc.stdout);
        assert.equal(/Usage:[\s\S]+Options:/.test(proc.stdout), true, proc.stdout);

    });

    it('should print the usage information without a correct config file', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            '--help',
            '--config=file-does-not-exist.json'
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, proc.stdout);
        assert.equal(/Usage:[\s\S]+Options:/.test(proc.stdout), true, proc.stdout);

    });

});
