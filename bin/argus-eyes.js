#!/usr/bin/env node

process.title = 'argus-eyes';

// Load dependencies
var pkg       = require('../package');
var cfgLoader = require('../app/configLoader');
var util      = require('../app/util');
var add       = require('../app/add');
var compare   = require('../app/compare');
var argv      = require('yargs').argv;

// Initialize configuration
var config = cfgLoader.loadConfig(argv);
var action = cfgLoader.getAction(argv);

// Initialize logger
global.log = require('../app/log')(config.color);
log.success('argus-eyes - v' + pkg.version);

// Test required cli arguments
if (!config.components || !config.pages) {
    log.error('No config file found!');
    process.exit(-1);
}
if (!action) {
    log.error('No action found! Specify either `add` or `compare`');
    process.exit(-1);
}

// Test availability of ImageMagick
if (!util.isExecutable('compare', ['-version'])) {
    log.error('No ImageMagick found! Ensure the `compare` executable is in your PATH');
    process.exit(-1);
}

// Run action
var exitCode;
if (action[0] === 'add') {
    exitCode = add(config, action[1]);
} else if (action[0] === 'compare') {
    exitCode = compare(config, action[1], action[2])
}

// Report status with exitcode
process.exit(exitCode ? 0 : -1);
