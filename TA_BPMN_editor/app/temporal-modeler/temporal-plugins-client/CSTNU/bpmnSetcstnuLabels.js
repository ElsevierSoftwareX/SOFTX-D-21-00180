/**@module  temporal-plugins-client/CSTNU/bpmnSetcstnuLabels
 * @description
 * This module reads a BPMN XML string and creates a dictionary with the nodes and edges 
 * of the elements to create/asign the labels used in the verification of the CSTNU. 
 * 
 */
//** 20210530

/**@function bpmnSetcstnuLabels
 * @description
 * Main function of the module. After reading the BPMN elements and creates a graph, 
 * it performs a depth-first search to compute and assign the labels to the elements. 
 * @param {*} bpmn XML string of a BPMN model
 * @returns {Object} Dictionary with { xmlString, myLogObj, countObjs, myObjs, textMessage } 
 */
export default function bpmnSetcstnuLabels(bpmn) {

  const eventBus = window.bpmnjs.get('eventBus');
  const elementRegistry = window.bpmnjs.get('elementRegistry');
  let parser = new DOMParser();
  let xmlDoc = parser.parseFromString(bpmn, "text/xml");

  // The nodes are elements (keys) in the dictionary, 
  // the edges will be stores in the element (key) arrows
  let myObjs = {};
  myObjs['arrows'] = {};  // Will represent the edges to create the graph
  // Possible letters to use as observation  /[a-zA-F]/
  myObjs['nodeObservation'] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
    'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E'];
  myObjs['nodeObservationUsed'] = [];  // This will be filled with the used letters to check there are not repeated ones 
  // To keep track of errors and show them to the user
  let myLogObj = { log: "", errors: "", warnings: "" };

  let countObjs = {
    nObservedProposition: 0,
    elementsWithError: 0,
    elementsWithWarning: 0,
    startEventsTotal: 0,
    startEvents: 0,
    endEvents: 0,
    endEventsTotal: 0,
    boundaryEvents: 0,
    boundaryEventsTotal: 0
  };

  // Read the elements in the XML and create the dictionary with the elements
  createDictionaryFromBpmnXml(xmlDoc, myLogObj, countObjs, myObjs);

  // ------------------ Create labels ------------------ //
  let cps = []; // Current Partial Scenario: variable that will contains the labels
  let visited = {};
  let visitList = [];
  let isSplit = false;
  let tempProposition = '';

  if (myObjs.zNode) { // It is require 1 zNode in the diagram
    // TODO consider more than one START node
    visitList.push({ id: myObjs.zNode, cps: Array.from(cps) });

    while (visitList.length > 0) {
      let node = visitList.pop();
      if (visited[node.id] === undefined) visited[node.id] = 0;
      visited[node.id] += 1;
      if (node.id && visited[node.id] < 2) {
        if (myObjs[node.id].obs != undefined) {
          if (myObjs[node.id].obs === 'join') {

            let tempElement = elementRegistry.get(node.id);

            setExtensionElementValue(tempElement, "TGatewaySplitJoin", "gatewaySplitJoin", "join");
            try {
              eventBus.fire('element.changed', { element: tempElement });
            } catch (error) {
              console.log('Error when fire element.changed ' + tempElement.businessObject.id);
            }

            if (node.cps.length > 0)
              node.cps.pop();
            else {
              myLogObj.errors += '\n' + tempElement.type + '(' + node.id + ')' + ': Empty CSP, it is required a proposition for an exclusive gateway of type join. \n';
              countObjs.elementsWithError += 1;
            }
          }
          if (myObjs[node.id].obs === 'split') {

            let tempElement = elementRegistry.get(node.id);

            setExtensionElementValue(tempElement, "TGatewaySplitJoin", "gatewaySplitJoin", "split");
            if (myObjs[node.id].observedProposition)
              tempProposition = myObjs[node.id].observedProposition;
            else {
              if (myObjs['nodeObservation'].length > 0) {
                tempProposition = myObjs['nodeObservation'].pop();
                setExtensionElementValue(tempElement, "TXorProposition", "observedProposition", tempProposition);
              }
              else {
                myLogObj.errors += '\nMax number of observations reached \n';
                countObjs.elementsWithError += 1;
              }
            }
            isSplit = true;
            try {
              eventBus.fire('element.changed', { element: tempElement });
            } catch (error) {
              console.log('Error when fire element.changed ' + tempElement.businessObject.id);
            }
          }
          if (myObjs[node.id].obs === 'boundaryEvent') {

            let tempElement = elementRegistry.get(node.id);

            if (myObjs[node.id].observedProposition)
              tempProposition = myObjs[node.id].observedProposition;
            else {
              if (myObjs['nodeObservation'].length > 0) {
                tempProposition = myObjs['nodeObservation'].pop();
                myObjs[node.id].observedProposition = tempProposition;
                // Assign the same literal to the boundaryEvent and to task attachedToRef
                // myObjs[myObjs[node.id].boundaryEventRelation].observedProposition = tempProposition;
                setExtensionElementValue(tempElement, "TXorProposition", "observedProposition", tempProposition);
              }
              else {
                myLogObj.errors += '\nMax number of observations reached \n';
                countObjs.elementsWithError += 1;
              }
            }
            isSplit = true;
            // try {
            //   eventBus.fire('element.changed', { element: tempElement });
            // } catch (error) {
            //   console.log('Error when fire element.changed ' + tempElement.businessObject.id);
            // }
          }

          if (myObjs['nodeObservationUsed'].includes(tempProposition) && tempProposition != '') {
            myLogObj.errors += '\nobservedProposition "' + tempProposition + '" used more than once (' + node.id + ') \n';
            countObjs.elementsWithError += 1;
          }
          else {
            myObjs['nodeObservationUsed'].push(tempProposition);
          }

          myObjs[node.id].label = Array.from(node.cps);

        }
        //Update element in BPMN diagram
        let tempElement = elementRegistry.get(node.id);
        setExtensionElementValue(tempElement, "TDuration", "propositionalLabel", Array.from(node.cps).join(""));
        eventBus.fire('element.changed', { element: tempElement });

        myObjs[node.id].outputs.forEach(adj => {
          cps = Array.from(node.cps);
          if (isSplit) {
            let prefx = '';
            if (myObjs.arrows[adj].isTrueBranch === 'false') {
              prefx = '¬';
            }
            cps.push(prefx + tempProposition);
          }
          visitList.push({ id: myObjs.arrows[adj].target, cps: Array.from(cps) });
        });
        isSplit = false;
        tempProposition = '';
      }
    }
  }
  else { // No zNode found in the model 
    myLogObj.errors += '\n No zNode found in the model  \n';
    countObjs.elementsWithError += 1;
  }

  // Update message of error 
  myLogObj.errors = 'Elements with error: ' + countObjs.elementsWithError + '\n' + myLogObj.errors;
  myLogObj.warnings = 'Elements with warning: ' + countObjs.elementsWithWarning + '\n' + myLogObj.warnings;

  let textMessage = 'Errors: ' + countObjs.elementsWithError;
  let divModalContent = document.getElementById("divModalContent");

  if (countObjs.elementsWithError > 0)
    textMessage += '\n' + myLogObj.errors;

  textMessage += '\n' + 'Warnings: ' + countObjs.elementsWithWarning;

  if (countObjs.elementsWithWarning > 0)
    divModalContent.innerText += '\n' + myLogObj.warnings;
  let xmlString = '';
  return { xmlString, myLogObj, countObjs, myObjs, textMessage };
}

/**
 * Read information from and process elements: Tasks, Gateways, Events
 * @param {Object} params Object with the variables element, myLogObj,  countObjs,  myObjs
 */
function processElements(params) {
  let { element, // element to transform
    myLogObj,     // To report erros and log
    countObjs,    // To count tasks, nodes, edges, nContingents, nObservedProposition,elementsWithError
    myObjs        // Dictionary to match bpmnId:cstnId
  } = params;

  const elementRegistry = window.bpmnjs.get('elementRegistry');

  if (element.attributes.id != undefined) {
    myObjs[element.attributes.id.value] = { nodeName: '', name: '', id: '', inputs: [], outputs: [] };
    myObjs[element.attributes.id.value].id = element.attributes.id.value;
    myObjs[element.attributes.id.value].nodeName = element.nodeName;
    if (element.attributes.name != undefined) myObjs[element.attributes.id.value].name = element.attributes.name.value.replace(/(\r\n|\n|\r)/gm, "") + ' ';

    if (element.nodeName.includes("exclusiveGateway") || element.nodeName.includes("parallelGateway")) {

      let sourceElement = elementRegistry.get(element.attributes.id.value);
      let gatewaySplitJoinTmp = window.bpmnjs.checkSplitJoin(sourceElement);

      if (gatewaySplitJoinTmp != undefined) { // Read it
        if (gatewaySplitJoinTmp.includes('join')) {

          if (element.nodeName.includes("exclusiveGateway")) {
            myObjs[element.attributes.id.value].obs = 'join';
          }
        }
        else if (gatewaySplitJoinTmp.includes('split')) {

          if (element.nodeName.includes("exclusiveGateway")) {

            let observedPropositionTmp = getExtensionElementValue(sourceElement, "TXorProposition", "observedProposition");
            if (observedPropositionTmp != undefined && observedPropositionTmp != '') {
              if (/[a-zA-F]/.test(observedPropositionTmp)) {
                myObjs[element.attributes.id.value].observedProposition = observedPropositionTmp.trim().charAt(0);
                // Check and remove from array of possible letters 
                const index = myObjs['nodeObservation'].indexOf(myObjs[element.attributes.id.value].observedProposition);
                if (index > -1) {
                  myObjs['nodeObservation'].splice(index, 1);
                }
                countObjs.nObservedProposition += 1;
              }
              else {
                myLogObj.errors += "ObservedProposition (" + observedPropositionTmp + ") not valid in " + element.nodeName + '(' + element.attributes.id.value + ') \n';
                countObjs.elementsWithError += 1;
                return;
              }
            }
            else {
              myObjs[element.attributes.id.value].observedProposition = undefined; // This will be set when the labels are created            
            }
            myObjs[element.attributes.id.value].obs = 'split';

            // Check if the output arrow has a value
            for (let i = 0; i < element.children.length; i++) {
              let child = element.children[i];
              if (child.tagName.includes("outgoing")) {

                let idArrow = child.innerHTML;
                let tempElement = elementRegistry.get(idArrow);
                let isTrueBranchTmp = getExtensionElementValue(tempElement, "TPLiteralValue", "isTrueBranch");

                if (isTrueBranchTmp != undefined) {
                  if (isTrueBranchTmp != '') {

                    if (isTrueBranchTmp == true || isTrueBranchTmp == 'true')
                      myObjs[element.attributes.id.value].obsTrueArrow = idArrow;
                    else
                      myObjs[element.attributes.id.value].obsFalseArrow = idArrow;
                  }
                }
              }
            }
          }
        }
        else {
          myLogObj.errors += '\n' + element.nodeName + ' (' + element.attributes.id.value + '): gatewaySplitJoin="' + element.attributes['tempcon:gatewaySplitJoin'].value + '" not valid \n';
          countObjs.elementsWithError += 1;
          return;
        }
      }
      else {
        myLogObj.errors += '\n' + element.nodeName + '(' + element.attributes.id.value + ')' + ' invalid number of incoming/outcoming arrows \n';
        countObjs.elementsWithError += 1;
        return;
      }
    }
  }
  else {
    myLogObj.errors += element.nodeName + ' without id \n';
    countObjs.elementsWithError += 1;
  }
}

/**
 * Read information from and process elements: Start, End
 * @param {Object} params Object with the variables element, myLogObj,  countObjs,  myObjs
 */
function processStartEndElements(params) {
  let { element, // element to transform
    myLogObj,     // To report erros and log
    countObjs,    // To count tasks, nodes, edges, nContingents, nObservedProposition, elementsWithError
    myObjs        // Dictionary to match bpmnId:cstnId
  } = params;

  let nodeType = '', nodeNumber = '';

  if (element.nodeName.includes("startEvent")) {
    nodeType = 'START';
    if (countObjs.startEventsTotal > 1) {
      nodeNumber = String(countObjs.startEvents);
      countObjs.startEvents += 1;
    }
    if (myObjs.zNode === undefined)
      myObjs.zNode = element.attributes.id.value;
    else {
      myLogObj.errors += '\n More than one Start node' + element.nodeName + ' \n';
      countObjs.elementsWithError += 1;
    }
  }
  else if (element.nodeName.includes("endEvent")) {
    nodeType = 'END';
    if (countObjs.endEventsTotal > 1) {
      nodeNumber = String(countObjs.endEvents);
      countObjs.endEvents += 1;
    }
  }
  else {
    myLogObj.errors += "\n one Node unknown " + element.nodeName;
    return;
  }

  if (element.attributes.id != undefined) {
    myObjs[element.attributes.id.value] = { nodeName: '', name: '', id: '', idCSTNU: nodeType + nodeNumber, inputs: [], outputs: [] };
    myObjs[element.attributes.id.value].id = element.attributes.id.value;
    myObjs[element.attributes.id.value].nodeName = element.nodeName;
    if (element.attributes.name != undefined) myObjs[element.attributes.id.value].name = element.attributes.name.value.replace(/(\r\n|\n|\r)/gm, "") + ' ';
  }
  else {
    myLogObj.errors += element.nodeName + ' without id \n';
    countObjs.elementsWithError += 1;
  }
}


/**
 * Read information from and process elements: boundary events
 * Check structure 
 * @param {Object} params Object with the variables element, myLogObj,  countObjs,  myObjs
 */
function createBoundaryNode(params) {
  let { element, // element to transform
    myLogObj,     // To report erros and log
    countObjs,    // To count tasks, nodes, edges, nContingents, nObservedProposition, elementsWithError
    myObjs        // Dictionary to match bpmnId:cstnId
  } = params;

  // Create the arrow that connects the task and the boundary event 
  let elementRegistry = window.bpmnjs.get('elementRegistry');

  // Get cstnuId of the connected nodes
  let source = element.attributes.attachedToRef.value;
  let target = element.attributes.id.value;

  let idArrow = element.attributes.id.value + '_arrow';

  if (source == undefined || target == undefined) {
    myLogObj.errors += "\n Invalid edge " + idArrow + ", source  " + source + ' and target ' + target;
    countObjs.elementsWithError += 1;
    return;
  }

  if (myObjs[source] == undefined || myObjs[target] == undefined) {
    myLogObj.errors += "\n Invalid edge " + idArrow + ", source  " + source + ' and target ' + target;
    countObjs.elementsWithError += 1;
    return;
  }

  // If event non Interrupting
  if (element.attributes.cancelActivity && element.attributes.cancelActivity.value == "false") {
    // Check that the Task A has one output
    if (myObjs[source].outputs.length != 1) {
      myLogObj.errors += "\n" + myObjs[source].nodeName + " must have one output sequenceFlow";
      countObjs.elementsWithError += 1;
      return;
    }
    else {
      myObjs.arrows[myObjs[source].outputs[0]].isTrueBranch = false;
    }

    // Check that the BoundaryEvent B has one output
    if (myObjs[source].outputs.length != 1) {
      myLogObj.errors += "\n" + myObjs[target].nodeName + " must have one output sequenceFlow";
      countObjs.elementsWithError += 1;
      return;
    }
    // Chenck that the output is connected to a Task
    else if (!myObjs[myObjs.arrows[myObjs[target].outputs[0]].target].nodeName.includes("Task")) {
      myLogObj.errors += "\n" + myObjs[target].nodeName + " must be connected to a Task";
      countObjs.elementsWithError += 1;
      return;
    }
    else {
      myObjs.arrows[myObjs[target].outputs[0]].isTrueBranch = true;
    }

    let taskAfterEvent = myObjs.arrows[myObjs[target].outputs[0]].target;
    // Check that the task connected to the BoundaryEvent B has one output
    if (myObjs[taskAfterEvent].outputs.length != 1) {
      myLogObj.errors += "\n" + myObjs[target].nodeName + " must have one output sequenceFlow";
      countObjs.elementsWithError += 1;
      return;
    }
    // Chenck that the output is connected to a endEvent
    else if (!myObjs[myObjs.arrows[myObjs[taskAfterEvent].outputs[0]].target].nodeName.includes("endEvent")) {
      myLogObj.errors += "\n" + myObjs[taskAfterEvent].nodeName + " (" + myObjs[taskAfterEvent] + ") must be connected to a endEvent";
      countObjs.elementsWithError += 1;
      return;
    }
  }
  else { // Event interrupting 
    // Check that the Task A has one output
    if (myObjs[source].outputs.length != 1) {
      myLogObj.errors += "\n" + myObjs[source].nodeName + " must have one output sequenceFlow";
      countObjs.elementsWithError += 1;
      return;
    }
    // Chenck that the output is connected to a exclusive Gateway
    else if (!myObjs[myObjs.arrows[myObjs[source].outputs[0]].target].nodeName.includes("exclusiveGateway")) {
      myLogObj.errors += "\n" + myObjs[source].nodeName + " must be connected to a exclusiveGateway";
      countObjs.elementsWithError += 1;
      return;
    }
    else {
      myObjs.arrows[myObjs[source].outputs[0]].isTrueBranch = false;
    }

    // Check that the BoundaryEvent B has one output
    if (myObjs[source].outputs.length != 1) {
      myLogObj.errors += "\n" + myObjs[target].nodeName + " must have one output sequenceFlow";
      countObjs.elementsWithError += 1;
      return;
    }
    // Chenck that the output is connected to a Task
    else if (!myObjs[myObjs.arrows[myObjs[target].outputs[0]].target].nodeName.includes("Task")) {
      myLogObj.errors += "\n" + myObjs[target].nodeName + " must be connected to a Task";
      countObjs.elementsWithError += 1;
      return;
    }
    else {
      myObjs.arrows[myObjs[target].outputs[0]].isTrueBranch = true;
    }
    let taskAfterEvent = myObjs.arrows[myObjs[target].outputs[0]].target;
    // Check that the task connected to the BoundaryEvent B has one output
    if (myObjs[taskAfterEvent].outputs.length != 1) {
      myLogObj.errors += "\n" + myObjs[target].nodeName + " must have one output sequenceFlow";
      countObjs.elementsWithError += 1;
      return;
    }
    // Chenck that the output is connected to a exclusiveGateway
    else if (!myObjs[myObjs.arrows[myObjs[taskAfterEvent].outputs[0]].target].nodeName.includes("exclusiveGateway")) {
      myLogObj.errors += "\n" + myObjs[taskAfterEvent].nodeName + " (" + myObjs[taskAfterEvent] + ") must be connected to a exclusiveGateway";
      countObjs.elementsWithError += 1;
      return;
    }
  }

  myObjs['arrows'][idArrow] = { id: idArrow, source: source, target: target };
  myObjs[source].outputs.push(idArrow); // A
  myObjs[target].inputs.push(idArrow);  // Boundary event

  // Add a cross relation
  myObjs[source].boundaryEventRelation = target; // A
  myObjs[target].boundaryEventRelation = source; // Boundary event

  let sourceElement = elementRegistry.get(element.attributes.id.value);

  let observedPropositionTmp = getExtensionElementValue(sourceElement, "TXorProposition", "observedProposition");
  if (observedPropositionTmp != undefined && observedPropositionTmp != '') {
    if (/[a-zA-F]/.test(observedPropositionTmp)) {
      myObjs[element.attributes.id.value].observedProposition = observedPropositionTmp.trim().charAt(0);
      // Check and remove from array of possible letters 
      const index = myObjs['nodeObservation'].indexOf(myObjs[element.attributes.id.value].observedProposition);
      if (index > -1) {
        myObjs['nodeObservation'].splice(index, 1);
      }
      countObjs.nObservedProposition += 1;
    }
    else {
      myLogObj.errors += "ObservedProposition (" + observedPropositionTmp + ") not valid in " + element.nodeName + '(' + element.attributes.id.value + ') \n';
      countObjs.elementsWithError += 1;
      return;
    }
  }
  else {
    myObjs[element.attributes.id.value].observedProposition = undefined; // This will be set when the labels are created            
  }
  // myObjs[source].obs = 'boundaryEvent'; // A
  myObjs[target].obs = 'boundaryEvent'; // Boundary event

}

/**
 * Read information from and process elements SequenceFlow
 * @param {Object} params 
 */
function processSequenceFlow(params) {
  let { element, // element to transform
    myLogObj,     // To report erros and log
    countObjs,    // To count tasks, nodes, edges, nContingents, nObservedProposition,elementsWithError
    myObjs        // Dictionary to match bpmnId:cstnId
  } = params;

  let eventBus = window.bpmnjs.get('eventBus');
  let elementRegistry = window.bpmnjs.get('elementRegistry');
  let modeling = window.bpmnjs.get('modeling');

  // Get cstnuId of the connected nodes
  let source = element.attributes.sourceRef.value;
  let target = element.attributes.targetRef.value;

  let idArrow = element.attributes.id.value;
  let tempElement, isTrueBranchTmp;

  if (source == undefined || target == undefined) {
    myLogObj.errors += "\n Invalid edge " + idArrow + ", source  " + source + ' and target ' + target;
    countObjs.elementsWithError += 1;
    return;
  }

  if (myObjs[source] == undefined || myObjs[target] == undefined) {
    myLogObj.errors += "\n Invalid edge " + idArrow + ", source  " + source + ' and target ' + target;
    countObjs.elementsWithError += 1;
    return;
  }

  myObjs['arrows'][idArrow] = { id: idArrow, source: source, target: target };
  myObjs[source].outputs.push(idArrow);
  myObjs[target].inputs.push(idArrow);

  if (myObjs[source].obs != undefined) {
    if (myObjs[source].obs === 'split' && myObjs[source].nodeName.includes("exclusiveGateway")) {

      tempElement = elementRegistry.get(element.attributes.id.value);
      isTrueBranchTmp = getExtensionElementValue(tempElement, "TPLiteralValue", "isTrueBranch");

      if (isTrueBranchTmp != undefined) {
        if (isTrueBranchTmp != '') {
          myObjs['arrows'][idArrow].isTrueBranch = isTrueBranchTmp;

          if (isTrueBranchTmp == true || isTrueBranchTmp == 'true')
            myObjs[source].obsTrueArrow = idArrow;
          else
            myObjs[source].obsFalseArrow = idArrow;
        }
        else {

          let tempElement = elementRegistry.get(idArrow);
          if (myObjs[source].obsTrueArrow == undefined && myObjs[source].obsFalseArrow == undefined) {
            tempElement.businessObject.isTrueBranch = 'true';
            setExtensionElementValue(tempElement, "TPLiteralValue", "isTrueBranch", "true");
            tempElement.businessObject.name = 'True';
            myObjs[source].obsTrueArrow = idArrow;
          }
          else if (myObjs[source].obsTrueArrow == undefined) {
            tempElement.businessObject.isTrueBranch = 'true';
            setExtensionElementValue(tempElement, "TPLiteralValue", "isTrueBranch", "true");
            tempElement.businessObject.name = 'True';
            myObjs[source].obsTrueArrow = idArrow;
          }
          else if (myObjs[source].obsFalseArrow == undefined) {
            tempElement.businessObject.isTrueBranch = 'false';
            setExtensionElementValue(tempElement, "TPLiteralValue", "isTrueBranch", "false");
            tempElement.businessObject.name = 'False';
            myObjs[source].obsFalseArrow = idArrow;
          }
          else {
            myLogObj.errors += "\n Invalid edges " + element.nodeName + ' of split ' + source;
            countObjs.elementsWithError += 1;
            return;
          }

          myObjs['arrows'][idArrow].isTrueBranch = getExtensionElementValue(tempElement, "TPLiteralValue", "isTrueBranch");
          try {
            modeling.updateLabel(tempElement, tempElement.businessObject.name);
            eventBus.fire('element.changed', { element: tempElement });

          } catch (error) {
            console.log('Error when fire element.changed ' + tempElement.businessObject.id);
          }
        }
      }
      else {

        let tempElement = elementRegistry.get(idArrow);

        if (myObjs[source].obsTrueArrow == undefined) {
          tempElement.businessObject.isTrueBranch = 'true';
          setExtensionElementValue(tempElement, "TPLiteralValue", "isTrueBranch", "true");
          tempElement.businessObject.name = 'True';
          myObjs[source].obsTrueArrow = idArrow;
        }
        else if (myObjs[source].obsFalseArrow == undefined) {
          tempElement.businessObject.isTrueBranch = 'false';
          setExtensionElementValue(tempElement, "TPLiteralValue", "isTrueBranch", "false");
          tempElement.businessObject.name = 'False';
          myObjs[source].obsFalseArrow = idArrow;
        }
        else {
          myLogObj.errors += "\n Invalid edges " + element.nodeName + ' of split ' + source;
          countObjs.elementsWithError += 1;
          return;
        }

        myObjs['arrows'][idArrow].isTrueBranch = getExtensionElementValue(tempElement, "TPLiteralValue", "isTrueBranch");
        try {
          modeling.updateLabel(tempElement, tempElement.businessObject.name);
          eventBus.fire('element.changed', { element: tempElement });
        } catch (error) {
          console.log('Error when fire element.changed ' + tempElement.businessObject.id);
        }

      }
    }
  }
}

/**
 * Iterates all the BPMN elements of xmlDoc and 
 * creates graph in the object myObjs
 * @param {xmlDocument} xmlDoc 
 * @param {Object} myLogObj 
 * @param {Object} countObjs 
 * @param {Object} myObjs 
 */
function createDictionaryFromBpmnXml(xmlDoc, myLogObj, countObjs, myObjs) {
  let i = 0, j = 0, k = 0;

  for (i = 0; i < xmlDoc.children[0].children.length; i++) {
    let elementP = xmlDoc.children[0].children[i];
    if (elementP.nodeName.includes("process")) {
      for (j = 0; j < elementP.children.length; j++) {
        let element = elementP.children[j];
        let params = { element, myLogObj, countObjs, myObjs };
        let elementName = element.nodeName; // .toLowerCase(isInclude)           
        // ---------------- Tasks --------------- //     

        if (elementName.includes("task")) {
          myLogObj.errors += "\n " + elementName + " " + " not allowed \n "; // +element.attributes.id 
          countObjs.elementsWithError += 1;
        }
        else if (elementName.includes("userTask")) {
          processElements(params);
        }
        else if (elementName.includes("serviceTask")) {
          processElements(params);
        }
        else if (elementName.includes("scriptTask")) {
          processElements(params);
        }
        else if (elementName.includes("sendTask")) {
          processElements(params);
        }
        else if (elementName.includes("receiveTask")) {
          processElements(params);
        }
        // else if (elementName.includes("subProcess")) {
        //   processElements(params);
        // }
        //  ---------------------- Events ---------------//
        else if (elementName.includes("intermediateCatchEvent")) {
          // Subtypes are
          //  bpmn:timerEventDefinition   // This is a bit different TODO
          //  bpmn:messageEventDefinition
          //  bpnm:signalEventDefinition
          for (k = 0; k < element.children.length; k++) {
            let eventElement = element.children[k];

            if (eventElement.nodeName.includes('messageEventDefinition') ||
              eventElement.nodeName.includes('signalEventDefinition')) {
              processElements(params);
            }
            // else if (eventElement.nodeName.includes('timerEventDefinition')) { // TODO
            //   processElements(params);
            // }
            else if (eventElement.nodeName.includes('EventDefinition')) {
              myLogObj.errors += "\n " + elementName + "-" + eventElement.nodeName + " not allowed in this version of the CSTNU plug-in \n "; // +element.attributes.id 
              countObjs.elementsWithError++;
            }
          }
        }
        else if (elementName.includes("intermediateThrowEvent")) {
          // no-subtype
          // Subtypes are
          //  bpmn:messageEventDefinition
          //  bpnm:signalEventDefinition

          let numberEventDefinitions = 0;
          for (k = 0; k < element.children.length; k++) {
            let eventElement = element.children[k];

            if (eventElement.nodeName.includes('messageEventDefinition') ||
              eventElement.nodeName.includes('signalEventDefinition')) {
              processElements(params);
              numberEventDefinitions++;
            }
            else if (eventElement.nodeName.includes('EventDefinition')) {
              myLogObj.errors += "\n " + elementName + "-" + eventElement.nodeName + " not allowed in this version of the CSTNU plug-in \n "; // +element.attributes.id 
              countObjs.elementsWithError++;
              numberEventDefinitions++;
            }
            else {
              // No subtype -- none
              // processElements(params);
            }
          }
          if (numberEventDefinitions == 0) {
            processElements(params);
          }

        }
        else if (elementName.includes("boundaryEvent")) {
          // myLogObj.warnings += "\n" + elementName + " no processed";
          // countObjs.elementsWithWarning++;
          countObjs.boundaryEventsTotal += 1;

        }
        else if (elementName.includes("startEvent")) {
          // Need to know how many to decide Z or Z_i
          countObjs.startEventsTotal += 1;
        }
        else if (elementName.includes("endEvent")) {
          // Need to know how many to decide Omega or Omega_i
          countObjs.endEventsTotal += 1;
        }
        // ---------------------------- SequenceFlow -------------------------//
        else if (elementName.includes("sequenceFlow")) {
          // This will be processed later                
        }
        // ----------- Gateways -------------------//
        else if (elementName.includes("parallelGateway")) {
          processElements(params);
        }
        else if (elementName.includes("exclusiveGateway")) {
          processElements(params);
        }
        // else if(elementName.includes( "eventBasedGateway")){
        //   processElements(params);
        // }         
        // Elements allowed in the models but not considered in the translation
        else if (elementName.includes("association") ||
          elementName.includes("Pool") ||
          elementName.includes("laneSet") ||
          elementName.includes("dataObject") ||
          elementName.includes("dataObjectReference") ||
          elementName.includes("dataStoreReference") ||
          elementName.includes("textAnnotation") ||
          elementName.includes("eventBasedGateway")
        ) {
          myLogObj.warnings += "\n" + elementName + " no processed";
          countObjs.elementsWithWarning++;
        }
        // Non considerated    
        else {
          myLogObj.errors += "\n " + elementName + " " + " not allowed in this version of the CSTNU plug-in \n "; // +element.attributes.id 
          countObjs.elementsWithError++;
        }
      }
    }
  }

  let boundaryEventsToProcess = [];
  for (i = 0; i < xmlDoc.children[0].children.length; i++) {
    let elementP = xmlDoc.children[0].children[i];
    if (elementP.nodeName.includes("process")) {
      // startEvent and endEvet
      for (j = 0; j < elementP.children.length; j++) {
        let element = elementP.children[j];
        let params = { element, myLogObj, countObjs, myObjs };
        let elementName = element.nodeName;
        // ---------------------------- startEvent and endEvet -------------------------//
        if (elementName.includes("startEvent")) {
          processStartEndElements(params);
        }
        else if (elementName.includes("endEvent")) {
          processStartEndElements(params);
        }
        else if (elementName.includes("boundaryEvent")) {
          // To create the element
          let numberEventDefinitions = 0;
          for (k = 0; k < element.children.length; k++) {
            let eventElement;
            eventElement = element.children[k];

            if (eventElement && eventElement.nodeName) {
              if (eventElement.nodeName.includes('messageEventDefinition')) {
                processElements(params);
                boundaryEventsToProcess.push(params);
                numberEventDefinitions++;
              }
              else if (eventElement.nodeName.includes('EventDefinition')) {
                myLogObj.errors += "\n " + elementName + "-" + eventElement.nodeName + " not allowed in this version of the CSTNU plug-in \n "; // +element.attributes.id 
                countObjs.elementsWithError++;
                numberEventDefinitions++;
              }
              else {
                // No subtype -- none
                // processElements(params);
                // myLogObj.errors += "\n " + elementName + "-" + eventElement.nodeName + " not allowed in this version of the CSTNU plug-in \n ";
                // countObjs.elementsWithError++;
              }
            }
          }
          if (numberEventDefinitions == 0) {
            myLogObj.errors += "\n " + elementName + " not allowed in this version of the CSTNU plug-in \n ";
            countObjs.elementsWithError++;
          }
        }
      }
    }
  }

  for (i = 0; i < xmlDoc.children[0].children.length; i++) {
    let elementP = xmlDoc.children[0].children[i];
    if (elementP.nodeName.includes("process")) {

      // sequenceFlow processed once all the elments were processed
      for (j = 0; j < elementP.children.length; j++) {
        let element = elementP.children[j];
        let params = { element, myLogObj, countObjs, myObjs };
        let elementName = element.nodeName;
        // ---------------------------- SequenceFlow -------------------------//
        if (elementName.includes("sequenceFlow")) {
          processSequenceFlow(params);
        }
      }
    }
  }


  for (i = 0; i < xmlDoc.children[0].children.length; i++) {
    let elementP = xmlDoc.children[0].children[i];
    if (elementP.nodeName.includes("collaboration")) {

      for (j = 0; j < elementP.children.length; j++) {
        let element = elementP.children[j];
        let elementName = element.nodeName;
        // ---------------------------- MessageFlow -------------------------//
        if (elementName.includes("messageFlow")) {
          myLogObj.errors += "\n" + elementName + " not allowed in this version of the CSTNU plug-in";
          countObjs.elementsWithError++;
        }
      }
    }
  }

  // 
  // for (i = 0; i < xmlDoc.children[0].children.length; i++) {
  //   let elementP = xmlDoc.children[0].children[i];
  //   if (elementP.nodeName.includes("process")) {
  //     // boundaryEvent
  //     for (j = 0; j < elementP.children.length; j++) {
  //       let element = elementP.children[j];
  //       let params = { element, myLogObj, countObjs, myObjs };
  //       let elementName = element.nodeName;
  //       // ---------------------------- boundaryEvent -------------------------//
  //       if (elementName.includes("boundaryEvent")) {
  //         // To fix the connections 
  //         createBoundaryNode(params);
  //       }
  //     }
  //   }
  // }

  // Added at the end to extend/adapt the elements according to the rules for bounday events
  for (i = 0; i < boundaryEventsToProcess.length; i++) {
    createBoundaryNode(boundaryEventsToProcess[i]); // each i contains boundaryEvent element in the structure params
  }
}

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




