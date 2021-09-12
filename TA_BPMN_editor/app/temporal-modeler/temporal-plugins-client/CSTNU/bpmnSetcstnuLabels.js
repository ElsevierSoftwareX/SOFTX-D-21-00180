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
  myObjs['nodeObservation'] = ['P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y'];  // pLabels 
  // To keep track of errors and show them to the user
  let myLogObj = { log: "", errors: "", warnings: "" };

  let countObjs = {
    nObservedProposition: 0,
    elementsWithError: 0,
    elementsWithWarning: 0,
    startEventsTotal: 0,
    startEvents: 0,
    endEvents: 0,
    endEventsTotal: 0
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
            tempElement.businessObject.gatewaySplitJoin = 'join';
            try {
              eventBus.fire('element.changed', { element: tempElement });
            } catch (error) {
              console.log('Error when fire element.changed ' + tempElement.businessObject.id);
            }

            if (node.cps.length > 0)
              node.cps.pop();
            else {
              myLogObj.errors += '\n' + tempElement.type + '(' + node.id + ')' + ': Empty CSP, it is required a porposition for node markerd as join \n';
              countObjs.elementsWithError += 1;
            }
          }
          if (myObjs[node.id].obs === 'split') {
            let tempElement = elementRegistry.get(node.id);
            tempElement.businessObject.gatewaySplitJoin = 'split';

            if (myObjs[node.id].observedProposition)
              tempProposition = myObjs[node.id].observedProposition;
            else {
              if (myObjs['nodeObservation'].length > 0) {
                tempProposition = myObjs['nodeObservation'].shift();
                tempElement.businessObject.observedProposition = tempProposition;
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
          myObjs[node.id].label = Array.from(node.cps);

        }
        //Update element in BPMN diagram
        let tempElement = elementRegistry.get(node.id);
        tempElement.businessObject.propositionalLabel = Array.from(node.cps).join("");
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
  myLogObj.errors = 'Elements with error: ' + countObjs.elementsWithError + '\n\n' + myLogObj.errors;
  myLogObj.warnings = 'Elements with warning: ' + countObjs.elementsWithWarning + '\n\n' + myLogObj.warnings;

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

  if (element.attributes.id != undefined) {
    myObjs[element.attributes.id.value] = { nodeName: '', name: '', id: '', inputs: [], outputs: [] };
    myObjs[element.attributes.id.value].id = element.attributes.id.value;
    myObjs[element.attributes.id.value].nodeName = element.nodeName;
    if (element.attributes.name != undefined) myObjs[element.attributes.id.value].name = element.attributes.name.value.replace(/(\r\n|\n|\r)/gm, "") + ' ';

    if (element.nodeName.includes("exclusiveGateway") || element.nodeName.includes("parallelGateway")) {

      // Check incoming and outgoing to detect split or join 
      // This is use to add or remove observations (letters) in the propositions
      let nIncoming = 0, nOutgoing = 0;
      for (let i = 0; i < element.children.length; i++) {
        let child = element.children[i];
        if (child.tagName.includes("incoming")) {
          nIncoming++;
        }
        else if (child.tagName.includes("outgoing")) {
          nOutgoing++;
        }
      }

      if (element.attributes['tempcon:gatewaySplitJoin'] != undefined) { //Read it
        if (element.attributes['tempcon:gatewaySplitJoin'].value.includes('join')) {

          // if join, it should have 2 inputs and 1 output
          if (nIncoming != 2 || nOutgoing != 1) {
            myLogObj.errors += '\n' + element.nodeName + '(' + element.attributes.id.value + ')' + ' invalid number of incoming/outcoming arrows \n';
            countObjs.elementsWithError += 1;
            return;
          }
          if (element.nodeName.includes("exclusiveGateway")) {
            myObjs[element.attributes.id.value].obs = 'join';
          }
        }
        else if (element.attributes['tempcon:gatewaySplitJoin'].value.includes('split')) {

          // if split, it should have 1 input and 2 outputs
          if (nIncoming != 1 || nOutgoing != 2) {
            myLogObj.errors += '\n' + element.nodeName + '(' + element.attributes.id.value + ')' + ' invalid number of incoming/outcoming arrows \n';
            countObjs.elementsWithError += 1;
            return;
          }
          if (element.nodeName.includes("exclusiveGateway")) {

            if (element.attributes['tempcon:observedProposition'] != undefined) {
              myObjs[element.attributes.id.value].observedProposition = element.attributes['tempcon:observedProposition'].value.trim().charAt(0);
              // Check and remove from array of possible letters 
              const index = myObjs['nodeObservation'].indexOf(myObjs[element.attributes.id.value].observedProposition);
              if (index > -1) {
                myObjs['nodeObservation'].splice(index, 1);
              }
              countObjs.nObservedProposition += 1;
            }
            else {
              myObjs[element.attributes.id.value].observedProposition = undefined; // This will be set when the labels are created            
            }
            myObjs[element.attributes.id.value].obs = 'split';
          }
        }
        else {
          myLogObj.errors += '\n' + element.nodeName + ' (' + element.attributes.id.value + '): gatewaySplitJoin="' + element.attributes['tempcon:gatewaySplitJoin'].value + '" not valid \n';
          countObjs.elementsWithError += 1;
          return;
        }
      }
      else { // Set it
        // If 2 inputs and 1 output, join
        if (nIncoming == 2 || nOutgoing == 1) {
          myObjs[element.attributes.id.value].obs = 'join';
        }
        // If 1 input and 2 outputs, split
        else if (nIncoming == 1 || nOutgoing == 2) {
          myObjs[element.attributes.id.value].obs = 'split';

          if (element.nodeName.includes("exclusiveGateway")) {

            if (element.attributes['tempcon:observedProposition'] != undefined) {
              myObjs[element.attributes.id.value].observedProposition = element.attributes['tempcon:observedProposition'].value.trim().charAt(0);
              // Check and remove from array of possible letters 
              const index = myObjs['nodeObservation'].indexOf(myObjs[element.attributes.id.value].observedProposition);
              if (index > -1) {
                myObjs['nodeObservation'].splice(index, 1);
              }
              countObjs.nObservedProposition += 1;
            }
            else {
              myObjs[element.attributes.id.value].observedProposition = undefined; // This will be set when the labes are created            
            }
          }
        }
        else {
          myLogObj.errors += '\n' + element.nodeName + '(' + element.attributes.id.value + ')' + ' invalid number of incoming/outcoming arrows \n';
          countObjs.elementsWithError += 1;
          return;
        }
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

  let nodeLabel = '', nodeType = '', nodeNumber = '';

  if (element.nodeName.includes("startEvent")) {
    nodeLabel += 'Z';
    nodeType = 'START';
    if (countObjs.startEventsTotal > 1) {
      nodeLabel += countObjs.startEvents;
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
    nodeLabel += 'Ω';
    nodeType = 'END';
    if (countObjs.endEventsTotal > 1) {
      nodeLabel += countObjs.endEvents;
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

  //Get cstnuId of the connected nodes
  let source = element.attributes.sourceRef.value;
  let target = element.attributes.targetRef.value;

  let idArrow = element.attributes.id.value;

  myObjs['arrows'][idArrow] = { id: idArrow, source: source, target: target };
  myObjs[source].outputs.push(idArrow);
  myObjs[target].inputs.push(idArrow);
  if (myObjs[source].obs != undefined) {
    if (myObjs[source].obs === 'split') {
      if (element.attributes['tempcon:isTrueBranch'] != undefined) {
        if (element.attributes['tempcon:isTrueBranch'].value != '') {
          myObjs['arrows'][idArrow].isTrueBranch = element.attributes['tempcon:isTrueBranch'].value;
          if (myObjs['arrows'][idArrow].isTrueBranch == 'true')
            myObjs[source].obsTrueArrow = idArrow;
          else
            myObjs[source].obsFalseArrow = idArrow;

        }
        else {

          let tempElement = elementRegistry.get(idArrow);
          if (myObjs[source].obsTrueArrow == undefined) {
            tempElement.businessObject.isTrueBranch = 'true';
            tempElement.businessObject.name = 'True';
            myObjs[source].obsTrueArrow = idArrow;
          }
          else if (myObjs[source].obsFalseArrow == undefined) {
            tempElement.businessObject.isTrueBranch = 'false';
            tempElement.businessObject.name = 'False';
            myObjs[source].obsFalseArrow = idArrow;
          }
          else {
            myLogObj.errors += "\n Invalid edges " + element.nodeName + ' of split ' + source;
            countObjs.elementsWithError += 1;
            return;
          }

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
          tempElement.businessObject.name = 'True';
          myObjs[source].obsTrueArrow = idArrow;
        }
        else if (myObjs[source].obsFalseArrow == undefined) {
          tempElement.businessObject.isTrueBranch = 'false';
          tempElement.businessObject.name = 'False';
          myObjs[source].obsFalseArrow = idArrow;
        }
        else {
          myLogObj.errors += "\n Invalid edges " + element.nodeName + ' of split ' + source;
          countObjs.elementsWithError += 1;
          return;
        }

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

function isInclude(searchName, arrayOfNames) {

  arrayOfNames.forEach(function (partialName) {
    if (searchName.includes(partialName)) return true;
    else return false;
  });
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
  let i = 0, j = 0;

  let elementsNodes = ['userTask', 'serviceTask', 'scriptTask', 'sednTask', 'receivetask']; // subProcess
  let elementsStartEnd = ['startEvent', 'endEvent'];
  let elementsGateways = ['startEvent', 'endEvent'];

  for (i = 0; i < xmlDoc.children[0].children.length; i++) {
    let elementP = xmlDoc.children[0].children[i];
    if (elementP.nodeName.includes("process")) {
      for (j = 0; j < elementP.children.length; j++) {
        let element = elementP.children[j];
        let params = { element, myLogObj, countObjs, myObjs };
        let elementName = element.nodeName; //.toLowerCase(isInclude)           
        // ---------------- Tasks --------------- //     
        // if(isInclude(elementName,elementsNodes )){
        //   processElements(params);  
        // }
        // else if(isInclude(elementName, elementsStartEnd)){

        // }

        if (elementName.includes("task")) {
          // console.log(elementName + " not allowed");
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
        else if (elementName.includes("subProcess")) {
          processElements(params);
        }
        //  ---------------------- Events ---------------//
        else if (elementName.includes("intermediateCatchEvent")) {
          // Subtypes are
          //  bpmn:timerEventDefinition   // This is a bit different TODO
          //  bpmn:messageEventDefinition
          //  bpnm:singleEventDefinition
          processElements(params);
        }
        else if (elementName.includes("boundaryEvent")) {
          // console.log(elementName + " not now");
          myLogObj.warnings += "\n" + elementName + " no processed";
          countObjs.elementsWithWarning++;
        }
        else if (elementName.includes("startEvent")) {
          //Need to know how many to decide Z or Z_i
          countObjs.startEventsTotal += 1;
        }
        else if (elementName.includes("endEvent")) {
          //Need to know how many to decide Omega or Omega_i
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
        // Non considerated    
        else {
          myLogObj.warnings += "\n" + elementName + " no processed";
          countObjs.elementsWithWarning++;
        }
      }
    }
  }
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


}
