var assert = require('assert');
var spawnSync = require('child_process').spawnSync;
var normalize = require('path').normalize;

describe('Action: Version', function() {

    it('should print the version', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            '--version'
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, 'Exitcode not 0!');
        assert.equal(/v\d+\.\d+\.\d+/.test(proc.stdout), true, proc.stdout);

    });

    it('should print the version without a correct config file', function() {

        var proc = spawnSync('node', [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            '--version',
            '--config=file-does-not-exist.json'
        ], { encoding: 'utf8' });

        assert.equal(proc.status, 0, 'Exitcode not 0!');
        assert.equal(/v\d+\.\d+\.\d+/.test(proc.stdout), true, proc.stdout);

    });

});
