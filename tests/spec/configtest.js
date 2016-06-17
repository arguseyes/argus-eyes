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

    it('should fail with and incorrect config file', function() {

        var tests = [
            ['missing-sizes.json', /sizes/],
            ['invalid-sizes.json', /sizes/],
            ['missing-pages.json', /pages/],
            ['invalid-pages.json', /pages/],
            ['missing-components.json', /components/],
            ['invalid-components.json', /components/],
            ['invalid-wait-for-script.json', /wait-for-script/],
            ['invalid-wait-for-delay.json', /wait-for-delay/],
            ['invalid-phantomjs-flags.json', /phantomjs-flags/]
        ];

        tests.forEach(function(test) {

            var args = [
                normalize(__dirname + '/../../bin/argus-eyes.js'),
                'configtest',
                '--config=tests/fixtures/configtest/' + test[0]
            ];

            var proc = spawnSync('node', args, { encoding: 'utf8' });

            assert.equal(proc.status, 1, 'Exitcode not 1!');
            assert.equal(/Config invalid/.test(proc.stdout), true, proc.stdout);
            assert.equal(test[1].test(proc.stdout), true, proc.stdout);

        });

    });

});
