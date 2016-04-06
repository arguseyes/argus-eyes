#!/usr/bin/env node

process.title = 'argus-eyes';

// Load dependencies
var pkg            = require('../package');
var log            = require('../app/log');
var argumentLoader = require('../app/cli/argumentLoader');
var userCfgLoader  = require('../app/cli/userConfigLoader');
var actionCapture  = require('../app/action-capture');
var actionCompare  = require('../app/action-compare');

// Parse cli arguments into action & config
try {
    var action = argumentLoader.getAction();
    var config = argumentLoader.getConfig();
    log.setVerbose(config.verbose);
    log.setUseColor(config.color);
} catch (e) {
    log.error('Error: ' + e.message);
    process.exit(1);
}

// Run action
switch (action[0]) {

    case 'capture':
        try {
            userCfgLoader.getUserConfig();
            actionCapture(action[1], success => process.exit(success ? 0 : 1));
        } catch (e) {
            log.error('Error: ' + e.message);
            process.exit(1);
        }
        break;

    case 'compare':
        try {
            userCfgLoader.getUserConfig();
            process.exit(actionCompare(action[1], action[2]) ? 0 : 1);
        } catch (e) {
            log.error('Error: ' + e.message);
        }
        process.exit(1);
        break;

    case 'configtest':
        try {
            userCfgLoader.getUserConfig();
            log.success('Config valid.');
            process.exit(0);
        } catch (e) {
            log.error('Config invalid: ' + e.message);
            process.exit(1);
        }
        break;

    case 'version':
        log.info('v' + pkg.version);
        break;

    case 'help':
        log.info(
            '\nUsage:\n' +
            ' argus-eyes capture <name>            Capture new screenshots, save set as <name>\n' +
            ' argus-eyes compare <left> <right>    Compare 2 sets of screenshots by name\n' +
            ' argus-eyes configtest                Test the config file\n' +
            '\nOptions:\n' +
            " --config=…                           Specify config file, defaults to 'argus-eyes.json'\n" +
            " --base=…                             Set base for storing and comparing image sets, defaults to '.argus-eyes'\n" +
            ' --threshold=…                        Set the threshold for comparison differences, number between 0 and 100\n' +
            ' --concurrency=…                      Set the number of concurrent PhantomJS instances, number between 0 and 100\n' +
            ' --verbose                            Turn on verbose output\n' +
            ' --no-color                           Turn off colored output\n' +
            ' --help                               Print usage information\n' +
            ' -v, --version                        Print version');
        break;
}
