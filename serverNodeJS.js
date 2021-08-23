"use strict";

/**@module serverNodeJs
 * @description
 * Creates an http server, loads the Web TimeAwareBPMN-editor and communicates it through 
 * HTTP POST requests with the plug-ins of the tools to perform the verification of time constraints
 *
 */

const http = require('http');
const staticNode = require('node-static');
const opn = require('open');
const TCEvaluations = require('./temporal-plugins-server');


let file = new (staticNode.Server)(__dirname + '/TA_BPMN_editor/dist');
const evaluationModules = TCEvaluations.evaluationModules;

const server = http.createServer(function (request, response) {

  if (request.method == 'POST') { //
    // TODO on load check Modules
    let isFunctionFound = false;
    let [_, urlModule, urlFunction] = request.url.split('/');


    evaluationModules.forEach(function (mod) {
      if (mod.moduleInfo.url.includes(urlModule)) {
        mod.moduleInfo.postRequests.forEach(function (action) {
          console.log(action.function);
          if (action.url.includes(urlFunction)) {
            isFunctionFound = true;
            action.function(request, response);
          }
        });
      }

      if (!isFunctionFound) {
        var body = '';

        request.on('data', function (data) {
          body += data;
        });

        request.on('end', function () {

          let jsonRes = {
            cstnuEvaluation: '',
            cstnuChecked: '',
            status: "error",
            error: 'URL not found "' + request.url + '"'
          };

          response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          response.end(JSON.stringify(jsonRes));
        });
      }

    });

  }
  else if (request.method == 'GET') {
    file.serve(request, response);
  }
  else {
    response.end("Undefined request.");
  }
});

const port = 3000;
const host = '127.0.0.1';
server.listen(port, host);
console.log(`Listening at http://${host}:${port}`);
// opens the url in the default browser 
opn(`http://${host}:${port}`);
