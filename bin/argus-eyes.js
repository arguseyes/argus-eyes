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
if (!config.pages || !config.components) {
    log.error('No config file found!');
    process.exit(-1);
}
if (!action) {
    log.error('No action found! Specify either `add` or `compare`');
    process.exit(-1);
}

// Test availability of ImageMagick
if (!util.isExecutable('compare', ['-version']) || !util.isExecutable('identify', ['-version'])) {
    log.error('ImageMagick not found! Ensure the `compare` and `identify` executables are in your PATH');
    process.exit(-1);
}

// Run action
if (action[0] === 'add') {
    var success = add(config, action[1]);
    process.exit(success ? 0 : -1);
}
if (action[0] === 'compare') {
    compare(config, action[1], action[2], success => process.exit(success ? 0 : -1));
}
