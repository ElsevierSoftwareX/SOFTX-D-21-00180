/** @module  temporal-plugins-server/CSTNU

@description
 * This module contains the functionability to execute 
 * the Java application CSTNU to verify the dynamic controlability 
 * of Constraint Simple Temporal networks with Uncertainty. 
 * <br>
 * This module corrspond to the server part of a plugin for the tool TimeAwareBPMN-js
 * <br>
 * The module exports an object moduleInfo, that contains 
 * information about the module and allows the tool the execution  
 * functions that receive the objects request and response from a
 * HTTP request perfomed with method POST to the url server/moduleURL/functionURL
 * from the complement of the plugin in the client. 
 * <br><br>
 * Example of the object moduleInfo to export:<br>
 * <pre>
 * const moduleInfo = {
 *     name: 'pluginName',
 *     url: '/moduleURL',
 *     postRequests: [{
 *         url: '/function01URL',
 *         function: function01Toexecute,
 *     },
 *     {
 *         url: '/function02URL',
 *         function: function02Toexecute,
 *     }]
 * };
 * </pre>
 */

// Specific requirments for the module to execute a Java tool  
const java = require("java");

java.options.push('-Xms2G');
java.options.push('-Xmx4G');
java.options.push('-Djava.util.logging.config.file=nologging.properties');
java.classpath.push("./temporal-plugins-server/CSTNU/javaRep/CSTNU-Tool-4.1.jar");


/** 
 * moduleInfo object 
 * @description JS object to export. It contains information of the module and 
 * functions to execute.
 * @type {{ name: string,url: string,  postRequests: Array }}
 */
const moduleInfo = {
    name: 'CSTNU',
    url: '/cstnu',
    postRequests: [{
        url: '/dcChecking',
        function: checkDynamicControllability,
    }]
};

module.exports = { moduleInfo };

/**
 * Exeute the verification or checking with the Java tool CSTNU
 * @param {Object} request http request object 
 * @param {Object} response http response object
 */
function checkDynamicControllability(request, response) {
    var body = '';

    request.on('data', function (data) {
        body += data;
    });

    request.on('end', function () {

        let cstnuEvaluation, cstnuChecked;

        // Object to be returned
        let jsonRes = {
            cstnuEvaluation: '',
            cstnuChecked: '',
            status: "error",
            error: ''
        };

        try {
            // Crete an instance of the CSTNU tool
            let cstnu = java.newInstanceSync("it.univr.di.cstnu.algorithms.CSTNU", body);
            // Execute the verification or checking
            let status = cstnu.dynamicControllabilityCheckSync();

            cstnuEvaluation = { consistency: status.consistency };

            // Get the negative loop, is there is any
            if (status.negativeLoopNode != null)
                cstnuEvaluation.negativeLoopNode = status.negativeLoopNode.toString();

            // Get the optimized graph 
            cstnuChecked = cstnu.getGCheckedAsGraphMLSync();

            console.log('Packing results in JSON');

            jsonRes = {
                cstnuEvaluation: JSON.stringify(cstnuEvaluation),
                cstnuChecked: String(cstnuChecked),
                status: "ok",
                error: ''
            };

        } catch (error) {
            // In case of error return this information 
            console.log('error');
            console.log(error.message);
            jsonRes.error = String(error.message);
        }

        response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        response.end(JSON.stringify(jsonRes));
    });

}
