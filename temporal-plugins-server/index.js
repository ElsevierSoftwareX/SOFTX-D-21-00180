/**@module  temporal-plugins-server 
 * @description
 * This module loads as plugins the modules to perform temporal verification 
 * of the models generated and sended from the Web TimeAwareBPMN-editor.
*/

const glob = require('glob');

const PLUGINS_PATTERN = './temporal-plugins-server/*/index.js';

let evaluationModules = [];

/** Load modules in the directory temporal-plugins-server */
glob.sync(PLUGINS_PATTERN).forEach(function (pluginPath) {
    let newPath = pluginPath.replace('./temporal-plugins-server', '.');
    evaluationModules.push(require(newPath));
});

module.exports = {
    evaluationModules: evaluationModules
};