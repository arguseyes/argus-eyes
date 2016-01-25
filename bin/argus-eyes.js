#!/usr/bin/env node

process.title = 'argus-eyes';

// Load dependencies
var pkg           = require('../package');
var log           = require('../app/log');
var cfgLoader     = require('../app/configLoader');
var util          = require('../app/util');
var actionAdd     = require('../app/action-add');
var actionCompare = require('../app/action-compare');

// Get action
var config;
try {
    var action = cfgLoader.getAction();
} catch (e) {
    log.error('Error: ' + e.message);
    process.exit(1);
}

// Run action
switch (action[0]) {

    case 'add':
        try {
            config = cfgLoader.getConfig();
        } catch (e) {
            log.error('Error: ' + e.message);
            process.exit(1);
        }
        process.exit(actionAdd(action[1]) ? 0 : 1);
        break;

    case 'compare':
        try {
            config = cfgLoader.getConfig();
        } catch (e) {
            log.error('Error: ' + e.message);
            process.exit(1);
        }
        process.exit(actionCompare(action[1], action[2]) ? 0 : 1);
        break;

    case 'version':
        log.info('v' + pkg.version);
        break;

    case 'help':
        log.info(
            '\nUsage:\n' +
            ' argus-eyes add <name>                Take new screenshots, save set as <name>\n' +
            ' argus-eyes compare <left> <right>    Compare 2 sets of screenshots by name\n' +
            '\nOptions:\n' +
            " --config=…                           Specify config file, defaults to 'argus-eyes.json'\n" +
            " --base=…                             Set base for storing and comparing image sets, defaults to '.argus-eyes'\n" +
            ' --threshold=…                        Set the threshold for comparison differences, number between 0 and 100\n' +
            ' --im=…                               ImageMagick base path\n' +
            ' --verbose                            Turn on verbose output\n' +
            ' --no-color                           Turn off colored output\n' +
            ' --help                               Print usage information\n' +
            ' -v, --version                        Print version');
        break;
}
