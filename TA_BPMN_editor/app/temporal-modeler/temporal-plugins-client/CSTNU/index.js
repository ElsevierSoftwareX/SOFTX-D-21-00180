"use strict";

/**
 * @module temporal-plugins-client/CSTNU
 * @description
 * This module contains the functions to communicate TimeAwareBPMN-editor and CSTNU tool. 
 * It performs the translation from BPMN to CSTNU and interacts and modify the 
 * properties of the BPMN elements. 
 * 
 * This module performs:
 * <ul>
 *      <li>Set the labels of the conditions in each node</li>   
 *      <li>Send the CSTNU to the server to perform the temporal verification. 
 *          After that the temporal properties of the elements can be modified.</li>
 *      <li>Download the CSTNU as XML file.</li>
 *      <li>Reset the color of the boxes with the ranges, 
 *          that can me changen if the temporal properties were update.</li>
 * </ul> 
 * 
 * The module exports an object moduleInfo, that contains 
 * information about the module and allows the tool the execution  
 * functions that receive the string bpmnXML and intertasksJSON. 
 * This information is processed to generate a CSTNU XML string that is sent 
 * in an HTTP POST request to the url server/moduleURL/functionURL
 * to perform the functionality implemented in functionURL. 
 * 
 * 
 * Example of the object moduleInfo to export:<br>
 * <pre>
        const moduleInfo = {
            name: 'CSTNU',
            buttonFunctions: [
                { label: 'Set conditions', function: setCSTNULabels },
                { label: 'Temporal verification', function: evaluateCSTNU },
                { label: 'Download CSTNU', function: downloadCSTNU },
                { label: 'Reset colors', function: removeNotesUpdatedError }
            ]
        };
 * </pre>
 */


import bpmn2cstnu from './bpmn2cstnu';
import bpmnSetcstnuLabels from './bpmnSetcstnuLabels';
import cstnuChecked from './cstnuChecked';

// Contains the name of the Module and the function to be executed 
// the functions receive 2 parameters, the bpmnXML and intertasksJSON
// TODO Change to accept different parameters? 
const moduleInfo = {
    name: 'CSTNU',
    buttonFunctions: [
        { label: 'Set conditions', function: setCSTNULabels },
        { label: 'Temporal verification', function: evaluateCSTNU },
        { label: 'Download CSTNU', function: downloadCSTNU },
        { label: 'Reset colors', function: removeNotesUpdatedError }
    ]
};

export default { moduleInfo };


function removeNotesUpdatedError() {

    const eventBus = window.bpmnjs.get('eventBus');
    const elementRegistry = window.bpmnjs.get('elementRegistry');
    // Remove notes/color of elements updated or with error  
    window.elementsUpdated.forEach(elementId => {

        let tempElement = elementRegistry.get(elementId);
        // Using this insted of modeling.updateProperties, this does not produce ctr+z
        tempElement.businessObject.updated = '';
        eventBus.fire('element.changed', { element: tempElement });

    });
    let elementsErrorTmp = [...window.elementsError];
    window.elementsUpdated = [];
    window.elementsError = [];

    elementsErrorTmp.forEach(elementId => {

        let tempElement = elementRegistry.get(elementId);
        // Using this insted of modeling.updateProperties, this does not produce ctr+z
        eventBus.fire('element.changed', { element: tempElement });

    });
}

function setCSTNULabels(bpmnXml, customElements) {

    let tmpObj = bpmnSetcstnuLabels(bpmnXml);

    let myLogObj = tmpObj.myLogObj;
    let countObjs = tmpObj.countObjs;
    if (countObjs.elementsWithError > 0) {

        // Get the modal
        let modal = document.getElementById("divModalMessages");
        let btnDownloadCSTNU = document.getElementById("btnDownloadCSTNU");
        let divModalContent = document.getElementById("divModalContent");

        let divLoader = document.getElementById("divLoader");
        divLoader.style.display = "none";

        btnDownloadCSTNU.style.display = "none";
        modal.style.display = "block";

        allowCloseModal(true);

        divModalContent.innerText = myLogObj.errors;
        if (countObjs.elementsWithWarning > 0)
            divModalContent.innerText += '\n' + myLogObj.warnings;

    }

}

function evaluateCSTNU(bpmnXml, customElements) {
    showModalExportCSTNU(bpmnXml, customElements, 'evaluate');
}

function downloadCSTNU(bpmnXml, customElements) {
    showModalExportCSTNU(bpmnXml, customElements, 'download');
}

function allowCloseModal(allow) {
    let modal = document.getElementById("divModalMessages");
    let span = document.getElementsByClassName("close")[0];


    if (allow) {
        // When the user clicks on <span> (x), close the modal
        span.style.display = "block";
        span.onclick = function () {
            modal.style.display = "none";
        };

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function (event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        };
    }
    else {
        span.style.display = "none";
        span.onclick = null;
        window.onclick = null;
    }
}


function showModalExportCSTNU(bpmnXml, customElements, action) {


    // Get the modal
    let modal = document.getElementById("divModalMessages");
    let btnDownloadCSTNU = document.getElementById("btnDownloadCSTNU");
    let divModalContent = document.getElementById("divModalContent");
    let divLoader = document.getElementById("divLoader");

    btnDownloadCSTNU.style.display = "none";
    btnDownloadCSTNU.onclick = undefined;
    divModalContent.innerText = "Start translation ... ";
    modal.style.display = "block";
    divLoader.style.display = "none";

    allowCloseModal(true);

    let tmpObj = bpmn2cstnu(bpmnXml, customElements, 'diagrma');
    let cstnuXml = tmpObj.xmlString;
    let myLogObj = tmpObj.myLogObj;
    let countObjs = tmpObj.countObjs;
    let myObjs = tmpObj.myObjs;


    if (countObjs.elementsWithError > 0) {
        // In case we want to allow to process/download it with errors
        // btnDownloadCSTNU.style.display = "block";
        // btnDownloadCSTNU.onclick = function () {

        //     if (action === 'evaluate') {
        //         sendCSTNUtoEvaluate(cstnuXml, myObjs)

        //     }
        //     else if (action === 'download') {
        //         let pom = document.createElement('a');
        //         pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(cstnuXml));
        //         pom.setAttribute('download', 'cstnu.cstnu');

        //         if (document.createEvent) {
        //             let event = document.createEvent('MouseEvents');
        //             event.initEvent('click', true, true);
        //             pom.dispatchEvent(event);
        //         }
        //         else {
        //             pom.click();
        //         }
        //         modal.style.display = "none";
        //     }

        //     btnDownloadCSTNU.style.display = "none";
        // }

        divModalContent.innerText = myLogObj.errors;
        if (countObjs.elementsWithWarning > 0)
            divModalContent.innerText += '\n' + myLogObj.warnings;
    }
    else {

        if (action === 'evaluate') {
            sendCSTNUtoEvaluate(cstnuXml, myObjs);

        }
        else if (action === 'download') {
            let pom = document.createElement('a');
            pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(cstnuXml));
            pom.setAttribute('download', 'cstnu.cstnu');

            if (document.createEvent) {
                let event = document.createEvent('MouseEvents');
                event.initEvent('click', true, true);
                pom.dispatchEvent(event);
            }
            else {
                pom.click();
            }
            modal.style.display = "none";
        }

    }

}

function sendCSTNUtoEvaluate(cstnuXml, myObjs) {

    const eventBus = window.bpmnjs.get('eventBus');

    // Get the modal
    let modal = document.getElementById("divModalMessages");
    let btnDownloadCSTNU = document.getElementById("btnDownloadCSTNU");
    let divModalContent = document.getElementById("divModalContent");
    let divLoader = document.getElementById("divLoader");

    divLoader.style.display = "block";
    btnDownloadCSTNU.style.display = "none";
    btnDownloadCSTNU.onclick = undefined;

    divModalContent.innerText = "Start checking ... ";
    allowCloseModal(false);


    removeNotesUpdatedError();

    //Create httpRequest
    let http = new XMLHttpRequest();
    let url = 'http://localhost:3000/cstnu/dcChecking';

    http.open('POST', url, true);
    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', 'multipart/form-data');

    http.onreadystatechange = function () {//Call a function when the state changes.
        divLoader.style.display = "none";
        // If the connection and response is OK 
        if (http.readyState == 4 && http.status == 200) {

            allowCloseModal(true);

            let jsonRes = JSON.parse(http.responseText);

            if (jsonRes.status === "error") {
                divModalContent.innerText = "Error while processing the evaluation \n\n" + jsonRes.error;

            }
            else {

                let jsonEvaluation = JSON.parse(jsonRes.cstnuEvaluation);
                if (jsonEvaluation.consistency == true) {
                    // Elements updated 
                    let elementsUpdated = cstnuChecked(jsonRes.cstnuChecked, myObjs);

                    divModalContent.innerText = "The given network is dynamic controllable. \n";
                    if (elementsUpdated.length === 0) {
                        divModalContent.innerText += "No nodes will be updated.";
                    }
                    else {
                        divModalContent.innerText += "Nodes to be updated: \n";
                        elementsUpdated.forEach(element => divModalContent.innerText += element + "\n");
                    }

                }
                else if (jsonEvaluation.consistency == false) {
                    //Extract information about the node with the negative loop 
                    let strNodeId = jsonEvaluation.negativeLoopNode.replace("❮", "").replace("❯", "");
                    let strNodeIdArg = strNodeId.split("_");
                    let elementType = strNodeIdArg.slice(-2)[0], elementTypeNumber = strNodeIdArg.slice(-1)[0];
                    let currentObj;

                    let myKeys = Object.keys(myObjs);
                    for (let i = 0; i < myKeys.length; i++) {
                        currentObj = myObjs[myKeys[i]];
                        if (currentObj.elementType) {
                            if (currentObj.elementType === elementType && currentObj.elementTypeNumber == elementTypeNumber) {
                                break;
                            }
                        }
                        currentObj = undefined;
                    }

                    divModalContent.innerText = "The given network is NOT dynamic controllable.";
                    if (currentObj) {
                        divModalContent.innerText += "\nNegative loop in node: " + strNodeId + " (" + currentObj.id + ").";
                        window.elementsError.push(currentObj.id);
                        let tempElement = window.bpmnjs.get('elementRegistry').get(currentObj.id);
                        eventBus.fire('element.changed', { element: tempElement });

                    }
                    else {
                        divModalContent.innerText += "\nNegative loop in node: " + strNodeId + " (" + currentObj + ").";
                    }

                }
                else {
                    divModalContent.innerText = "Error while processing the evaluation parameter 'consistency' not found.";
                }
            }

        }
        else { // If the connection or response is NOT OK 

            if (http.readyState == 4 && http.status != 200) {
                divModalContent.innerText = "Error connecting to the server, status " + http.status + " " + http.statusText;
                allowCloseModal(true);

            }
        }
    };

    http.send(cstnuXml);

}



