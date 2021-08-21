/**@module  temporal-plugins-client 
 * @description
 * This module loads as plug-ins the modules to process the BPMN models, 
 * and send them in a HTTP POST request to the server to perform the temporal verification 
 * with the corresponding plug-in in temporal-plugins-server
*/

import evalCSTNU from './CSTNU';
import evalOther from './OTHER';

let evaluationModules = [evalCSTNU, evalOther];


function getEvaluationModules() {
  return evaluationModules;
}


export default {
  getEvaluationModules: getEvaluationModules
};
