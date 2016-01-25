var assert = require('assert');
var rimraf = require('rimraf');
var spawnAdd = require('../../helpers/spawn-argus-eyes').spawnAdd;

describe('Action: Add', function() {

    describe('Exitcode', function() {

        it('should return 0 on successful capture', function() {
            var proc = spawnAdd('dev', 'add/exitcode-success.json');
            assert.equal(0, proc.status);
        });

        it('should return 1 on failing capture', function() {
            var proc = spawnAdd('dev', 'add/exitcode-fail.json');
            assert.equal(1, proc.status);
        });
    });
});
