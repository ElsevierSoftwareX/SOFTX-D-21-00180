"use strict";
/**@module  temporal-plugins-client/CSTNU/cstnuChecked
 * @description
 * In the process of verification of the CSTNU, an updated CSTNU is generated 
 * if the consistency of the network is True. This module reads the updated network 
 * and updates the temporal properties of the elements in the BPMN diagram. 
 */

import extHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";


export default function cstnuChecked(xmlCTNUChecked, myObjs) {

  let parser = new DOMParser();
  let xmlCSTNU_Doc = parser.parseFromString(xmlCTNUChecked, "text/xml");
  const modeling = window.bpmnjs.get('modeling');
  const elementRegistry = window.bpmnjs.get('elementRegistry');
  let elementsUpdated = [];

  let currentBPMN_Obj;

  // Update elements --> NO contingents 
  let tmpElement;

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
              tmpElement = elementRegistry.get(currentBPMN_Obj.id);

              let maxDurationTmp = getExtensionElementValue(tmpElement, "TDuration", "maxDuration");

              if (maxDurationTmp && maxDurationTmp != newValue) {
                window.elementsUpdated.push(currentBPMN_Obj.id);
                modeling.updateProperties(tmpElement, {
                  // maxDuration: newValue,
                  updated: true
                });
                setExtensionElementValue(tmpElement, "TDuration", "maxDuration", newValue);
                elementsUpdated.push(currentBPMN_Obj.id);
              }

            }
            else if (currentBPMN_Obj.cstnuEdgeIds[i][0] === 'E') { //Update min value
              tmpElement = elementRegistry.get(currentBPMN_Obj.id);

              if (Number(newValue) != 0) newValue = -Number(newValue);

              let minDurationTmp = getExtensionElementValue(tmpElement, "TDuration", "minDuration");

              if (minDurationTmp && minDurationTmp != newValue) {
                window.elementsUpdated.push(currentBPMN_Obj.id);
                modeling.updateProperties(tmpElement, {
                  // minDuration: newValue,
                  updated: true
                });
                setExtensionElementValue(tmpElement, "TDuration", "minDuration", newValue);

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
              tmpElement = elementRegistry.get(currentBPMN_Obj.id);
              let maxDurationTmp = getExtensionElementValue(tmpElement, "TDuration", "maxDuration");


              // if (tmpElement.businessObject.maxDuration && tmpElement.businessObject.maxDuration != newValue) {
              if (maxDurationTmp && maxDurationTmp != newValue) {
                window.elementsUpdated.push(currentBPMN_Obj.id);
                modeling.updateProperties(tmpElement, {
                  // maxDuration: newValue,
                  updated: true
                });
                setExtensionElementValue(tmpElement, "TDuration", "maxDuration", newValue);
                elementsUpdated.push(currentBPMN_Obj.id);
              }
            }
            else if (currentBPMN_Obj.cstnuEdgeIds[i][0] === 'S') { //Update min value
              tmpElement = elementRegistry.get(currentBPMN_Obj.id);
              if (Number(newValue) != 0) newValue = -Number(newValue);

              let minDurationTmp = getExtensionElementValue(tmpElement, "TDuration", "minDuration");

              // if (tmpElement.businessObject.minDuration && tmpElement.businessObject.minDuration != newValue) {
              if (minDurationTmp && minDurationTmp != newValue) {

                window.elementsUpdated.push(currentBPMN_Obj.id);
                modeling.updateProperties(tmpElement, {
                  // minDuration: newValue,
                  updated: true
                });

                setExtensionElementValue(tmpElement, "TDuration", "minDuration", newValue);
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




// function getExtensionElementValue(element, typeName, property) {
//   let businessObject = element.businessObject || element;

//   let tempConObj;

//   if (businessObject.$type.includes('Task')) {
//     tempConObj = "TTask";
//   } else if (businessObject.$type.includes('Gateway')) {
//     tempConObj = "TGateway";
//   } else if (businessObject.$type.includes('Event')) {
//     tempConObj = "TEvent";
//   } else if (businessObject.$type.includes('Flow')) {
//     tempConObj = "TSequenceFlow";
//   }

//   let extensions = extHelper.getExtensionElements(
//     businessObject,
//     "tempcon:" + tempConObj
//   );
//   let returnValue;
//   if (extensions) {
//     if (extensions.length > 0) {
//       returnValue = extensions[0][property];
//       if (property != 'observedProposition' && property != 'isTrueBranch')
//         returnValue = extensions[0].duration[property];
//       else
//         returnValue = extensions[0][property];
//     }
//   }
//   return returnValue;
// }


function getExtensionElementValue(element, typeName, property) {
  return window.bpmnjs.getExtensionElementValue(element, typeName, property);
}


function setExtensionElementValue(element, typeName, property, value) {

  const moddle = window.bpmnjs.get('moddle');
  const modeling = window.bpmnjs.get('modeling');
  let businessObject = element.businessObject || element;

  let tempConType;
  if (businessObject.$type.includes('Task')) {
    tempConType = "TTask";
  } else if (businessObject.$type.includes('Gateway')) {
    tempConType = "TGateway";
  } else if (businessObject.$type.includes('Event') && !businessObject.$type.includes('StartEvent') && !businessObject.$type.includes('EndEvent')) {
    tempConType = "TEvent"
  } else if (businessObject.$type.includes('Flow')) {
    tempConType = "TSequenceFlow";
  }

  if (tempConType) {

    let prefixTypeElement = "tempcon:" + tempConType;

    const extensionElements = element.businessObject.extensionElements || moddle.create('bpmn:ExtensionElements');
    let tempConElement = getExtensionElement(element.businessObject, prefixTypeElement);

    if (!tempConElement) {
      tempConElement = moddle.create(prefixTypeElement);
      extensionElements.get('values').push(tempConElement);
      let duration = moddle.create("tempcon:TDuration");
      tempConElement["duration"] = duration;
    }
    if (property != 'observedProposition' && property != 'isTrueBranch')
      tempConElement.duration[property] = value;
    else
      tempConElement[property] = value;


    modeling.updateProperties(element, {
      extensionElements
    });
  }

}

function getExtensionElement(element, type) {
  if (!element.extensionElements) {
    return;
  }

  return element.extensionElements.values.filter((extensionElement) => {
    return extensionElement.$instanceOf(type);
  })[0];
}

