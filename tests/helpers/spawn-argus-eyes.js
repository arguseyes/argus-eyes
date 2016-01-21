var spawnSync = require('child_process').spawnSync;
var path = require('path');

// Export module
module.exports = {
    spawnAdd,
    spawnCompare
};

/**
 * Spawn a add-action process
 *
 * @param {String} name
 * @param {String} configFile
 * @returns {ChildProcess}
 */
function spawnAdd(name, configFile) {

    var args = [
        path.normalize(__dirname + '/../../bin/argus-eyes.js'),
        'add',
        name,
        '--config=' + path.normalize(__dirname + '/../fixtures/config/' + configFile)
    ];

    return spawnSync('node', args, { encoding: 'utf8' });
}

/**
 * Spawn a compare-action process
 *
 * @param {String} name1
 * @param {String} name2
 * @param {String} configFile
 * @returns {ChildProcess}
 */
function spawnCompare(name1, name2, configFile) {

    var args = [
        path.normalize(__dirname + '/../../bin/argus-eyes.js'),
        'compare',
        name1,
        name2,
        '--config=' + path.normalize(__dirname + '/../../fixtures/config/' + configFile)
    ];

    return spawnSync('node', args, { encoding: 'utf8' });
}
