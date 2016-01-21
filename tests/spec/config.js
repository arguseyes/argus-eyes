var assert = require('assert');
var spawnAdd = require('../helpers/spawn-argus-eyes').spawnAdd;

describe('Config file', function() {

    it('should fail without a config file', function() {
        var proc = spawnAdd('dev', 'file-does-not-exist.json');
        assert.equal(1, proc.status);
    });

    // @todo implement
    xit('should fail with an invalid config file', function() {});
    xit('should fail without correct sizes', function() {});
    xit('should fail without correct pages', function() {});
    xit('should fail without correct components', function() {});
    xit('should fail when url\'s do not respond', function() {});
    xit('should fail when components do not exist in the DOM', function() {});
});
