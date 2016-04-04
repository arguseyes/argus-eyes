var assert = require('assert');
var spawnSync = require('child_process').spawnSync;
var normalize = require('path').normalize;

describe('Action: Configtest', function() {

    it('should fail without a config file', function() {

        var args = [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'configtest',
            '--config=file-does-not-exist.json'
        ];

        var proc = spawnSync('node', args, { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/file not found/.test(proc.stdout), true, proc.stdout);

    });

    it('should fail with an invalid config file', function() {

        var args = [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'configtest',
            '--config=tests/fixtures/configtest/invalid-json.json'
        ];

        var proc = spawnSync('node', args, { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/Incorrect JSON/.test(proc.stdout), true, proc.stdout);

    });

    it('should succeed with a valid config file', function() {

        var args = [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'configtest',
            '--config=tests/fixtures/configtest/valid-json.json'
        ];

        var proc = spawnSync('node', args, { encoding: 'utf8' });

        assert.equal(proc.status, 0, 'Exitcode not 0!');
        assert.equal(/Config valid/.test(proc.stdout), true, proc.stdout);

    });

    it('should fail without sizes', function() {

        var args = [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'configtest',
            '--config=tests/fixtures/configtest/missing-sizes.json'
        ];

        var proc = spawnSync('node', args, { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/Config invalid/.test(proc.stdout), true, proc.stdout);
        assert.equal(/sizes/.test(proc.stdout), true, proc.stdout);

    });

    it('should fail without correct sizes', function() {

        var args = [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'configtest',
            '--config=tests/fixtures/configtest/invalid-sizes.json'
        ];

        var proc = spawnSync('node', args, { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/Config invalid/.test(proc.stdout), true, proc.stdout);
        assert.equal(/sizes/.test(proc.stdout), true, proc.stdout);

    });

    it('should fail without pages', function() {

        var args = [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'configtest',
            '--config=tests/fixtures/configtest/missing-pages.json'
        ];

        var proc = spawnSync('node', args, { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/Config invalid/.test(proc.stdout), true, proc.stdout);
        assert.equal(/pages/.test(proc.stdout), true, proc.stdout);

    });

    it('should fail without correct pages', function() {

        var args = [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'configtest',
            '--config=tests/fixtures/configtest/invalid-pages.json'
        ];

        var proc = spawnSync('node', args, { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/Config invalid/.test(proc.stdout), true, proc.stdout);
        assert.equal(/pages/.test(proc.stdout), true, proc.stdout);

    });

    it('should fail without components', function() {

        var args = [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'configtest',
            '--config=tests/fixtures/configtest/missing-components.json'
        ];

        var proc = spawnSync('node', args, { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/Config invalid/.test(proc.stdout), true, proc.stdout);
        assert.equal(/components/.test(proc.stdout), true, proc.stdout);

    });

    it('should fail without correct components', function() {

        var args = [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'configtest',
            '--config=tests/fixtures/configtest/invalid-components.json'
        ];

        var proc = spawnSync('node', args, { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/Config invalid/.test(proc.stdout), true, proc.stdout);
        assert.equal(/components/.test(proc.stdout), true, proc.stdout);

    });

    it('should fail with incorrect concurrency', function() {

        var args = [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'configtest',
            '--config=tests/fixtures/configtest/invalid-concurrency.json'
        ];

        var proc = spawnSync('node', args, { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/Config invalid/.test(proc.stdout), true, proc.stdout);
        assert.equal(/concurrency/.test(proc.stdout), true, proc.stdout);

    });

    it('should fail with incorrect finished-when', function() {

        var args = [
            normalize(__dirname + '/../../bin/argus-eyes.js'),
            'configtest',
            '--config=tests/fixtures/configtest/invalid-finished-when.json'
        ];

        var proc = spawnSync('node', args, { encoding: 'utf8' });

        assert.equal(proc.status, 1, 'Exitcode not 1!');
        assert.equal(/Config invalid/.test(proc.stdout), true, proc.stdout);
        assert.equal(/finished-when/.test(proc.stdout), true, proc.stdout);

    });

});
