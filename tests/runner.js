const auth = require('basic-auth');
const spawn = require('child_process').spawn;
const connect = require('connect');
const fs = require('fs');
const http = require('http');

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

        console.log('Starting http server');

        const app = connect();

        app.use('/credentials.html', function(req, res, next) {
            const credentials = auth(req);
            if (!credentials || credentials.name !== 'john' || credentials.pass !== 'secret') {
                res.statusCode = 401;
                res.setHeader('WWW-Authenticate', 'Basic realm="argus-eyes"');
                res.end('Access denied');
            } else {
                next();
            }
        });

        app.use(function(req, res, next) {
            const filename = __dirname + '/mock-server' + req.url;
            try {
                if (fs.statSync(filename).isFile()) {
                    return fs.createReadStream(filename).pipe(res);
                }
            } catch (e) {}
            next();
        });

        app.use(function(req, res) {
            res.statusCode = 404;
            res.end('404');
        });

        const httpServer = http.createServer(app).listen(PORT, () => resolve({ httpServer }));
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
        context.httpServer.close(() => resolve(context));
    });
}

/**
 * Exit this process with the correct code
 * @param {Object} context - Mocha's exitcode
 */
function exitWithCode(context) {
    process.exit(context.mochaExitCode);
}
