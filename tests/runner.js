const spawn = require('child_process').spawn;
const fs = require('fs');

/**
 * A fairly random unassigned port
 * @see http://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml
 * @type {Number}
 */
const PORT = 6530;

/**
 * Run tests
 */
startMockServer()
    .then(runMocha)
    .then(stopMockServer)
    .then(exitWithCode);

/**
 * Start mock-server, used from the functional tests
 * @return {Promise}
 */
function startMockServer() {

    return new Promise(resolve => {

        console.log('Starting http-server');

        const mockserver = spawn('node', [
            __dirname + '/../node_modules/http-server/bin/http-server',
            '-p', PORT,
            __dirname + '/mock-server'
        ], { stdio: 'ignore' });

        // Give http-server a second to start
        setTimeout(function() {
            const context = { mockServer: mockserver };
            resolve(context);
        }, 2e3);
    });
}

/**
 * Run all tests with Mocha
 * @param {Object} context
 * @return {Promise}
 */
function runMocha(context) {

    return new Promise(resolve => {

        console.log('\nRunning tests');

        const child = spawn('node', [
            __dirname + '/../node_modules/mocha/bin/mocha',
            '--recursive',
            '--timeout', '0',
            __dirname + '/spec/'
        ], { stdio: ['ignore', process.stdout, process.stderr] });

        child.on('close', code => {
            context.mochaExitCode = code;
            resolve(context);
        });
    });
}

/**
 * Stop the mock-server
 * @param {Object} context
 * @return {Promise}
 */
function stopMockServer(context) {
    return new Promise(resolve => {
        console.log('Stopping http-server');
        context.mockServer.kill();
        resolve(context);
    });
}

/**
 * Exit this process with the correct code
 * @param {Object} context - Mocha's exitcode
 */
function exitWithCode(context) {
    process.exit(context.mochaExitCode);
}
