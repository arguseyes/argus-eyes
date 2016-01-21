const child_process = require('child_process');
const fs = require('fs');
const path = require('path');

const pidfile = __dirname + '/pid';

/**
 * Parse arguments
 */
function printUsage() {
    console.log('Incorrect arguments!');
    console.log('Usage:');
    console.log(' node server-controller.js start');
    console.log(' node server-controller.js stop');
    process.exit(1);
}
if (process.argv.length !== 3) {
    printUsage();
}
var action = process.argv[process.argv.length - 1];
if (action !== 'start' && action !== 'stop') {
    printUsage();
}

/**
 * Checks if a path exists and is of the type 'file'
 */
function fileExists(file) {
    try {
        return fs.statSync(file).isFile();
    } catch (e) {
        return false;
    }
}

/**
 * Start server
 */
if (action === 'start') {

    if (fileExists(pidfile)) {
        console.log('PID file already found at: ' + path.relative(process.cwd(), pidfile));
        console.log('Server already running?');
        process.exit(1);
    }

    var proc = child_process.spawn('node', [__dirname + '/server.js'], { detached: true });
    fs.writeFileSync(pidfile, proc.pid);
    proc.unref();

    console.log('Successfully started server, PID ' + proc.pid);
    process.exit();
}

/**
 * Start server
 */
if (action === 'stop') {

    if (!fileExists(pidfile)) {
        console.log('PID file not found at: ' + path.relative(process.cwd(), pidfile));
        console.log('Server not running?');
        process.exit(1);
    }

    var pid = fs.readFileSync(pidfile, { encoding: 'utf8' });
    process.kill(pid);
    fs.unlinkSync(pidfile);

    console.log('Successfully stopped PID ' + pid);
    process.exit();
}
