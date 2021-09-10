"use strict";
/**@module  temporal-plugins-client/CSTNU/cstnuChecked
 * @description
 * In the process of verification of the CSTNU, an updated CSTNU is generated 
 * if the consistency of the network is True. This module reads the updated network 
 * and updates the temporal properties of the elements in the BPMN diagram. 
 */

export default function cstnuChecked(xmlCTNUChecked, myObjs) {

  let parser = new DOMParser();
  let xmlCSTNU_Doc = parser.parseFromString(xmlCTNUChecked, "text/xml");
  let modeling = window.bpmnjs.get('modeling');
  let elementsUpdated = [];

  let currentBPMN_Obj;

  // Update elements --> NO contingents 

  let contingentElements = ["UserTask", "ServiceTask", "SendTask", "ReceiveTask", "SubProcess",
    "TimerEventDefinition", "MessageEventDefinition", "SignalEventDefinition"];
  let noContingentElements = ["ScripTask", "SequenceFlow", "ParallelGateway", "ExclusiveGateway", "EventBasedGateway"];
  let noConsideredElements = ["Task"];

  let myKeys = Object.keys(myObjs);
  for (let k = 0; k < myKeys.length; k++) {
    currentBPMN_Obj = myObjs[myKeys[k]];

    if (currentBPMN_Obj.cstnuEdgeIds && currentBPMN_Obj.edgeType === 'normal') {
      for (let i = 0; i < currentBPMN_Obj.cstnuEdgeIds.length; i++) {

        let edge = xmlCSTNU_Doc.getElementById(currentBPMN_Obj.cstnuEdgeIds[i]);
        for (let j = 0; j < edge.children.length; j++) {
          let labeled = edge.children[j];
          if (labeled.attributes.key.value === 'LabeledValues') {

            let newLabel = labeled.textContent;
            let newValue = newLabel.split(',')[0].split('(').slice(-1)[0];

            if (currentBPMN_Obj.cstnuEdgeIds[i][0] === 'S') { //Update max value
              let tempElement = window.bpmnjs.get('elementRegistry').get(currentBPMN_Obj.id);

              if (tempElement.businessObject.maxDuration && tempElement.businessObject.maxDuration != newValue) {
                window.elementsUpdated.push(currentBPMN_Obj.id);
                modeling.updateProperties(tempElement, {
                  maxDuration: newValue,
                  updated: true
                });
                elementsUpdated.push(currentBPMN_Obj.id);
              }

            }
            else if (currentBPMN_Obj.cstnuEdgeIds[i][0] === 'E') { //Update min value
              let tempElement = window.bpmnjs.get('elementRegistry').get(currentBPMN_Obj.id);

              if (Number(newValue) != 0) newValue = -Number(newValue);

              if (tempElement.businessObject.minDuration && tempElement.businessObject.minDuration != newValue) {
                window.elementsUpdated.push(currentBPMN_Obj.id);
                modeling.updateProperties(tempElement, {
                  minDuration: newValue,
                  updated: true
                });
                elementsUpdated.push(currentBPMN_Obj.id);
              }
            }
            else {
              console.log('No updated ' + currentBPMN_Obj.id + ' ' + currentBPMN_Obj.cstnuEdgeIds);
            }
          }

        }

      }

    }
    currentBPMN_Obj = undefined;
  }

  // Update arrows
  myKeys = Object.keys(myObjs.arrows);
  for (let k = 0; k < myKeys.length; k++) {
    currentBPMN_Obj = myObjs.arrows[myKeys[k]];

    if (currentBPMN_Obj.cstnuEdgeIds && currentBPMN_Obj.edgeType === 'normal') {
      for (let i = 0; i < currentBPMN_Obj.cstnuEdgeIds.length; i++) {

        let edge = xmlCSTNU_Doc.getElementById(currentBPMN_Obj.cstnuEdgeIds[i]);
        for (let j = 0; j < edge.children.length; j++) {
          let labeled = edge.children[j];
          if (labeled.attributes.key.value === 'LabeledValues') {

            let newLabel = labeled.textContent;
            let newValue = newLabel.split(',')[0].split('(').slice(-1)[0];

            if (currentBPMN_Obj.cstnuEdgeIds[i][0] === 'E') { //Update max value
              let tempElement = window.bpmnjs.get('elementRegistry').get(currentBPMN_Obj.id);

              if (tempElement.businessObject.maxDuration && tempElement.businessObject.maxDuration != newValue) {
                window.elementsUpdated.push(currentBPMN_Obj.id);
                modeling.updateProperties(tempElement, {
                  maxDuration: newValue,
                  updated: true
                });
                elementsUpdated.push(currentBPMN_Obj.id);
              }
            }
            else if (currentBPMN_Obj.cstnuEdgeIds[i][0] === 'S') { //Update min value
              let tempElement = window.bpmnjs.get('elementRegistry').get(currentBPMN_Obj.id);
              if (Number(newValue) != 0) newValue = -Number(newValue);
              
              if (tempElement.businessObject.minDuration && tempElement.businessObject.minDuration != newValue) {
                
                window.elementsUpdated.push(currentBPMN_Obj.id);
                modeling.updateProperties(tempElement, {
                  minDuration: newValue,
                  updated: true
                });
                elementsUpdated.push(currentBPMN_Obj.id);
              }
            }
            else {
              console.log('No updated ' + currentBPMN_Obj.id + ' ' + currentBPMN_Obj.cstnuEdgeIds);
            }

          }
        }

      }

    }
    currentBPMN_Obj = undefined;
  }
  return elementsUpdated;

}
