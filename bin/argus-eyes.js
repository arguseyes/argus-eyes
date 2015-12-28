#!/usr/bin/env node

process.title = 'argus-eyes';

// Load dependencies
var pkg           = require('../package');
var cfgLoader     = require('../app/configLoader');
var util          = require('../app/util');
var actionAdd     = require('../app/action-add');
var actionCompare = require('../app/action-compare');
var argv          = require('yargs').argv;

// Initialize configuration
var config = cfgLoader.loadConfig(argv);
var action = cfgLoader.getAction(argv);

// Initialize logger
global.log = require('../app/log')(config.color);

// Test given arguments and config for errors
var configError = cfgLoader.getConfigError(config, action);
if (configError instanceof Error) {
    log.error('Error: ' + configError.message);
    process.exit(1);
}

// Run action
switch (action[0]) {

    case 'add':
        var success = actionAdd(config, action[1]);
        process.exit(success ? 0 : 1);
        break;

    case 'compare':
        actionCompare(config, action[1], action[2], success => process.exit(success ? 0 : 1));
        break;

    case 'version':
        log.message('v' + pkg.version);
        break;

    case 'help':
        log.message(
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
