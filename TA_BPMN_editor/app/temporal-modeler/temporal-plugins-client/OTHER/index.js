"use strict";

// Example module 
// entry-point for the module
// contains properties and functions to comunicate BPMN and the module 

const moduleInfo = {
    name: 'Other',
    buttonFunctions: [
        { label: 'setLabelOther', function: setLabelsOther },
        { label: 'bpmn2cstnuOther', function: bpmn2cstnuOther }
    ]
};

function setLabelsOther(bpmnXml, intertasks) {
    window.alert('In set labels setLabelsOther');
}

function bpmn2cstnuOther(bpmnXml, intertasks) {
    window.alert('In set labels bpmn2cstnuOther');
}

export default { moduleInfo };