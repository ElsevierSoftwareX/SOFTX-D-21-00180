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
  const modeling = window.bpmnjs.get('modeling');
  const elementRegistry = window.bpmnjs.get('elementRegistry');
  let elementsUpdated = [];

  let currentBPMN_Obj;

  // Update elements --> NO contingents 
  let tmpElement;
  let i, j, k, edge, labeled, newLabel, newValue, maxDurationTmp, minDurationTmp;

  // let contingentElements = ["UserTask", "ServiceTask", "SendTask", "ReceiveTask", "SubProcess",
  //   "TimerEventDefinition", "MessageEventDefinition", "SignalEventDefinition"];
  // let noContingentElements = ["ScripTask", "SequenceFlow", "ParallelGateway", "ExclusiveGateway", "EventBasedGateway"];
  // let noConsideredElements = ["Task"];

  let myKeys = Object.keys(myObjs);
  for (k = 0; k < myKeys.length; k++) {
    currentBPMN_Obj = myObjs[myKeys[k]];

    if (currentBPMN_Obj.cstnuEdgeIds && currentBPMN_Obj.edgeType === 'normal') {
      for (i = 0; i < currentBPMN_Obj.cstnuEdgeIds.length; i++) {

        edge = xmlCSTNU_Doc.getElementById(currentBPMN_Obj.cstnuEdgeIds[i]);
        for (j = 0; j < edge.children.length; j++) {
          labeled = edge.children[j];
          if (labeled.attributes.key.value === 'LabeledValues') {
            // debugger;
            // if (currentBPMN_Obj.cstnuEdgeIds[i][0] != 'Z') {
            newLabel = labeled.textContent;
            newValue = newLabel.split(',')[0].split('(').slice(-1)[0];

            if (currentBPMN_Obj.cstnuEdgeIds[i][0] === 'S') { //Update max value
              tmpElement = elementRegistry.get(currentBPMN_Obj.id);

              maxDurationTmp = getExtensionElementValue(tmpElement, "TDuration", "maxDuration");

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

              minDurationTmp = getExtensionElementValue(tmpElement, "TDuration", "minDuration");

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
            // }
          }
        }
      }
    }
    currentBPMN_Obj = undefined;
  }

  // Update arrows
  myKeys = Object.keys(myObjs.arrows);
  for (k = 0; k < myKeys.length; k++) {
    currentBPMN_Obj = myObjs.arrows[myKeys[k]];
    // debugger;

    if (currentBPMN_Obj.cstnuEdgeIds && currentBPMN_Obj.edgeType === 'normal' && currentBPMN_Obj.presentInBPMN == true) {
      for (i = 0; i < currentBPMN_Obj.cstnuEdgeIds.length; i++) {
        // debugger;
        edge = xmlCSTNU_Doc.getElementById(currentBPMN_Obj.cstnuEdgeIds[i]);
        for (j = 0; j < edge.children.length; j++) {
          labeled = edge.children[j];
          if (labeled.attributes.key.value === 'LabeledValues') {

            newLabel = labeled.textContent;
            console.log(newLabel);
            debugger;
            newValue = getNewValue(newLabel);
            // newValue = newLabel.split(',')[0].split('(').slice(-1)[0];
            if (newValue) {
              if (currentBPMN_Obj.cstnuEdgeIds[i][0] === 'E') { //Update max value
                tmpElement = elementRegistry.get(currentBPMN_Obj.id);
                maxDurationTmp = getExtensionElementValue(tmpElement, "TDuration", "maxDuration");

                // if (tmpElement.businessObject.maxDuration && tmpElement.businessObject.maxDuration != newValue) {
                if (maxDurationTmp && maxDurationTmp != newValue) {
                  debugger;
                  console.log(newValue);
                  setExtensionElementValue(tmpElement, "TDuration", "maxDuration", newValue);
                  window.elementsUpdated.push(currentBPMN_Obj.id);
                  modeling.updateProperties(tmpElement, {
                    // maxDuration: newValue,
                    updated: true
                  });
                  elementsUpdated.push(currentBPMN_Obj.id);
                }
              }
              else if (currentBPMN_Obj.cstnuEdgeIds[i][0] === 'S') { //Update min value
                tmpElement = elementRegistry.get(currentBPMN_Obj.id);
                if (Number(newValue) != 0) newValue = -Number(newValue);
                // 
                minDurationTmp = getExtensionElementValue(tmpElement, "TDuration", "minDuration");

                // if (tmpElement.businessObject.minDuration && tmpElement.businessObject.minDuration != newValue) {
                if (minDurationTmp && minDurationTmp != newValue) {
                  debugger;
                  console.log(newValue);
                  window.elementsUpdated.push(currentBPMN_Obj.id);
                  setExtensionElementValue(tmpElement, "TDuration", "minDuration", newValue);
                  elementsUpdated.push(currentBPMN_Obj.id);
                  modeling.updateProperties(tmpElement, {
                    // minDuration: newValue,
                    updated: true
                  });


                }
              }
            }
            // else if (currentBPMN_Obj.cstnuEdgeIds[i][0] === 'Z' || currentBPMN_Obj.cstnuEdgeIds[i][0] === 'Ω') { 
            //   tmpElement = elementRegistry.get(currentBPMN_Obj.id);
            //   if (Number(newValue) != 0) newValue = -Number(newValue);
            //   // debugger
            //   let minDurationTmp = getExtensionElementValue(tmpElement, "TDuration", "minDuration");

            //   // if (tmpElement.businessObject.minDuration && tmpElement.businessObject.minDuration != newValue) {
            //   if (minDurationTmp && minDurationTmp != newValue) {

            //     window.elementsUpdated.push(currentBPMN_Obj.id);
            //     modeling.updateProperties(tmpElement, {
            //       // minDuration: newValue,
            //       updated: true
            //     });

            //     setExtensionElementValue(tmpElement, "TDuration", "minDuration", newValue);
            //     elementsUpdated.push(currentBPMN_Obj.id);
            //   }
            // }
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


function getNewValue(newLabel) {

  let newLabelSplit = newLabel.split(/[{}(),\s]+/);
  let newValue = Number.MAX_SAFE_INTEGER;
  for (let l = 0; l < newLabelSplit.length; l++) {
    let newLabelSplitInteger = parseInt(newLabelSplit[l]);
    if (!isNaN(newLabelSplitInteger)) {
      if (newLabelSplitInteger > 0 && newValue > newLabelSplitInteger)
        newValue = newLabelSplitInteger;
    }
  }

  if (newValue === Number.MAX_SAFE_INTEGER) newValue = undefined;

  return newValue;

}

function getExtensionElementValue(element, typeName, property) {
  return window.bpmnjs.getExtensionElementValue(element, typeName, property);
}


function setExtensionElementValue(element, typeName, property, value) {
  console.log(value);
  const moddle = window.bpmnjs.get('moddle');
  const modeling = window.bpmnjs.get('modeling');
  let businessObject = element.businessObject || element;

  let tempConType;
  if (businessObject.$type.includes('Task')) {
    tempConType = "TTask";
  } else if (businessObject.$type.includes('Gateway')) {
    tempConType = "TGateway";
  } else if (businessObject.$type.includes('Event') && !businessObject.$type.includes('StartEvent') && !businessObject.$type.includes('EndEvent')) {
    tempConType = "TEvent";
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

