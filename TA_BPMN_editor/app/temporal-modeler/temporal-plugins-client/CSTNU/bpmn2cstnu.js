/**@module  temporal-plugins-client/CSTNU/bpmn2cstnu
 * @description
 * Performs the translation of a XML string of the BPMN model to CSTNU XML string.
 */


const builder = require("xmlbuilder");

/** @function bpmn2cstnu
 * Main function of the module.
 * @param {*} bpmn 
 * @param {*} customElements 
 * @param {*} fileName 
 * @returns {Object} { xmlString, myLogObj, countObjs, myObjs, textMessage }
 */
export default function bpmn2cstnu(bpmn, customElements, fileName) {

  let parser = new DOMParser();
  let xmlDoc = parser.parseFromString(bpmn, "text/xml");

  // The nodes are elements (keys) in the dictionary, 
  // the edges will be stores in the element (key) arrows
  let myObjs = {};
  myObjs['relative'] = { datainput: [], dataoutput: [] }; // To recover the relative connection 
  myObjs['edges_ids'] = {};  // To avoid duplicated ids
  myObjs['arrows'] = {};  // To create the graph 
  myObjs['nodeObservation'] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
    'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E'];  // pLabels 
  // To keep track of errors and show them to the user
  let myLogObj = { log: "", errors: "", warnings: "" };

  let countObjs = {
    tasks: 0,
    nodes: 0,
    edges: 0,
    nContingents: 0,
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

  let root = getStart_xml();
  let graph = root.ele("graph", { edgedefault: "directed" });
  let bpmnPlane = get_bpmnPlane(xmlDoc);
  let processName = fileName;

  setElements(xmlDoc, bpmnPlane, graph, myLogObj, countObjs, myObjs, customElements);

  // Elements with global information, to compute at the end.
  graph.ele("data", { key: "nContingent" }, countObjs.nContingents);
  graph.ele("data", { key: "nObservedProposition" }, countObjs.nObservedProposition);
  graph.ele("data", { key: "NetworkType" }, "CSTNU");
  graph.ele("data", { key: "nEdges" }, countObjs.edges);
  graph.ele("data", { key: "nVertices" }, countObjs.nodes);
  graph.ele("data", { key: "Name" }, processName);

  let xmlString = root.end({
    pretty: true,
    indent: "  ",
    newline: "\n",
    width: 0,
    allowEmpty: false,
    spacebeforeslash: "",
  });

  myLogObj.errors = 'Elements with error: ' + countObjs.elementsWithError + '\n' + myLogObj.errors;
  myLogObj.warnings = 'Elements with warning: ' + countObjs.elementsWithWarning + '\n' + myLogObj.warnings;

  let textMessage = '';
  let divModalContent = document.getElementById("divModalContent");

  if (countObjs.elementsWithError > 0)
    textMessage += '\n' + myLogObj.errors;
  textMessage += '\n' + 'Warnings: ' + countObjs.elementsWithWarning;
  if (countObjs.elementsWithWarning > 0)
    divModalContent.innerText += '\n' + myLogObj.warnings;

  return { xmlString, myLogObj, countObjs, myObjs, textMessage };
}

/**
 * Check range of [minDuration, maxDuration] of the elements 
 * @param {xmlNode} element XML node with min and max duration
 * @param {Object} logObj Object with log and errors
 * @param {string} edgeType Contingent or normal
 * @returns {Object} minDuration, maxDuration, okVals
 */
function checkMinMax(element, logObj, edgeType) {
  let minDuration, maxDuration, okVals = true;
  let currentErrors = '';
  let nodeName = element.nodeName + ' ';

  const elementRegistry = window.bpmnjs.get('elementRegistry');
  let tempElement = elementRegistry.get(element.attributes.id.value);

  if (element.attributes.name != undefined) nodeName += element.attributes.name.value.replace(/(\r\n|\n|\r)/gm, " ") + ' ';
  if (element.attributes.id != undefined) nodeName += ' (' + element.attributes.id.value + ') ';
  logObj.log += "\n " + nodeName + " ";

  if (getExtensionElementValue(tempElement, "TDuration", "minDuration") === undefined) {
    currentErrors += '\n\tminDuration undefined';
    okVals = false;
  }
  if (getExtensionElementValue(tempElement, "TDuration", "maxDuration") === undefined) {
    currentErrors += '\n\tmaxDuration undefined';
    okVals = false;
  }

  if (okVals) {
    minDuration = getExtensionElementValue(tempElement, "TDuration", "minDuration");
    maxDuration = getExtensionElementValue(tempElement, "TDuration", "maxDuration");

    if (minDuration === undefined) {
      currentErrors += "\n\tminDuration undefined ";
      okVals = false;
    }
    else if (isNaN(minDuration)) {
      currentErrors += "\n\tminDuration (" + minDuration + ") is NaN ";
      okVals = false;
    }
    else if (!Number.isInteger(parseFloat(minDuration))) {
      currentErrors += "\n\tminDuration (" + minDuration + ") is not integer ";
      okVals = false;
    }
    else if (edgeType === "contingent" && Number(minDuration) <= 0) {
      currentErrors += "\n\tminDuration (" + minDuration + ") should be > 0 ";
      okVals = false;
    }
    else if (edgeType === "normal" && Number(minDuration) < 0) {
      currentErrors += "\n\tminDuration (" + minDuration + ") should be >= 0 ";
      okVals = false;
    }
    else if (edgeType != "normal" && edgeType != "contingent") {
      currentErrors += "\n\tunknown edgeType (" + edgeType + ")";
      okVals = false;
    }
    else logObj.log += "\n " + nodeName + " minDuration " + minDuration + " ";

    if (maxDuration === undefined) {
      currentErrors += "\n\tmaxDuration undefined ";
      okVals = false;
    }
    else if (isNaN(maxDuration)) {
      currentErrors += "\n\tmaxDuration (" + maxDuration + ") is NaN ";
      okVals = false;
    }
    else if (!Number.isInteger(parseFloat(maxDuration))) {
      currentErrors += "\n\tmaxDuration (" + maxDuration + ") is not integer ";
      okVals = false;
    }
    else if (minDuration != undefined) {
      if (edgeType === "contingent" && Number(maxDuration) <= Number(minDuration)) {
        currentErrors += "\n\tmaxDuration (" + maxDuration + ") should be > minDuration (" + minDuration + ")";
        okVals = false;

      }
      else if (edgeType === "normal" && Number(maxDuration) < Number(minDuration)) {
        currentErrors += "\n\tmaxDuration (" + maxDuration + ") should be >= minDuration (" + minDuration + ")";
        okVals = false;
      }
      else if (edgeType != "normal" && edgeType != "contingent") {
        currentErrors += "\n\tunknown edgeType (" + edgeType + ")";
        okVals = false;
      }
      else logObj.log += "\n " + nodeName + " maxDuration " + maxDuration + " ";
    }
  }
  if (currentErrors != '') {
    logObj.errors += nodeName + currentErrors + '\n';
  }
  return { minDuration, maxDuration, okVals };
}

/**
 * Check range of [minDuration, maxDuration] of the sequenceFlow elements
 * @param {*} element 
 * @param {*} logObj 
 * @param {*} edgeType 
 * @returns {Object} { minDuration, maxDuration, okVals }
 */
function checkMinMax_sequenceFlow(element, logObj, edgeType) {
  let minDuration, maxDuration, okVals = true;
  let currentErrors = '';
  let nodeName = element.nodeName + ' ';
  const elementRegistry = window.bpmnjs.get('elementRegistry');
  let tempElement = elementRegistry.get(element.attributes.id.value);

  if (element.attributes.name != undefined) nodeName += element.attributes.name.value.replace(/(\r\n|\n|\r)/gm, " ") + ' ';
  if (element.attributes.id != undefined) nodeName += '\n[' + element.attributes.id.value + '] ';
  logObj.log += "\n " + nodeName + " ";

  if (getExtensionElementValue(tempElement, "TDuration", "minDuration") === undefined)
    minDuration = 0;
  else
    minDuration = getExtensionElementValue(tempElement, "TDuration", "minDuration");

  if (getExtensionElementValue(tempElement, "TDuration", "maxDuration") === undefined)
    maxDuration = Infinity;
  else
    maxDuration = getExtensionElementValue(tempElement, "TDuration", "maxDuration");

  if (okVals) {

    if (minDuration === undefined) {
      minDuration = 0;
    }
    if (isNaN(minDuration)) {
      currentErrors += "\n\tminDuration (" + minDuration + ") is NaN ";
      okVals = false;
    }
    else if (!Number.isInteger(parseFloat(minDuration))) {
      currentErrors += "\n\tminDuration (" + minDuration + ") is not integer ";
      okVals = false;
    }
    else if (edgeType === "contingent" && Number(minDuration) <= 0) {
      currentErrors += "\n\tminDuration (" + minDuration + ") should be > 0 ";
      okVals = false;
    }
    else if (edgeType === "normal" && Number(minDuration) < 0) {
      currentErrors += "\n\tminDuration (" + minDuration + ") should be >= 0 ";
      okVals = false;
    }
    else if (edgeType != "normal" && edgeType != "contingent" && edgeType != "relative") {
      currentErrors += "\n\tunknown edgeType (" + edgeType + ")";
      okVals = false;
    }
    else logObj.log += "\n " + nodeName + " minDuration " + minDuration + " ";

    if (maxDuration === undefined) {
      maxDuration = Infinity;
    }
    if (isNaN(maxDuration)) {
      currentErrors += "\n\tmaxDuration (" + maxDuration + ") is NaN ";
      okVals = false;
    }
    else if (maxDuration != Infinity && !Number.isInteger(parseFloat(maxDuration))) {
      currentErrors += "\n\tmaxDuration (" + maxDuration + ") is not integer ";
      okVals = false;
    }
    else if (minDuration != undefined) {
      if (edgeType === "contingent" && Number(maxDuration) <= Number(minDuration)) {
        currentErrors += "\n\tmaxDuration (" + maxDuration + ") should be > minDuration (" + minDuration + ")";
        okVals = false;

      }
      else if ((edgeType === "normal" || edgeType === "relative") && Number(maxDuration) < Number(minDuration)) {
        currentErrors += "\n\tmaxDuration (" + maxDuration + ") should be >= minDuration (" + minDuration + ")";
        okVals = false;
      }
      else if (edgeType != "normal" && edgeType != "contingent" && edgeType != "relative") {
        currentErrors += "\n\tunknown edgeType (" + edgeType + ")";
        okVals = false;
      }
      else logObj.log += "\n " + nodeName + " maxDuration " + maxDuration + " ";
    }
  }
  if (currentErrors != '') {
    logObj.errors += nodeName + currentErrors + '\n';
  }
  return { minDuration, maxDuration, okVals };
}

/**
 * Check range of [minDuration, maxDuration] of the elements
 * @param {*} element 
 * @param {*} logObj 
 * @param {*} edgeType 
 * @returns {Object} { minDuration, maxDuration, okVals }
 */
function checkMinMax_relativeConstraint(element, logObj, edgeType) {
  let minDuration, maxDuration, okVals = true;
  let currentErrors = '', nodeName = '';

  if (element.id === undefined) {
    currentErrors += '\nRelativeConstraint without Id ';
    okVals = false;
    return { minDuration, maxDuration, okVals };
  }
  else {
    nodeName = element.id + ' ';
  }

  logObj.log += "\n " + nodeName + " ";

  // Get min max values
  if (element.minDuration === undefined)
    minDuration = 0;
  else
    minDuration = element.minDuration;

  if (element.maxDuration === undefined)
    maxDuration = Infinity;
  else
    maxDuration = element.maxDuration;

  // Check values  

  if (minDuration === undefined) {
    minDuration = 0;
  }
  if (isNaN(minDuration)) {
    currentErrors += "\n\tminDuration (" + minDuration + ") is NaN ";
    okVals = false;
  }
  else if (!Number.isInteger(parseFloat(minDuration))) {
    currentErrors += "\n\tminDuration (" + minDuration + ") is not integer ";
    okVals = false;
  }
  else if (edgeType === "contingent" && Number(minDuration) <= 0) {
    currentErrors += "\n\tminDuration (" + minDuration + ") should be > 0 ";
    okVals = false;
  }
  else if (edgeType === "normal" && Number(minDuration) < 0) {
    currentErrors += "\n\tminDuration (" + minDuration + ") should be >= 0 ";
    okVals = false;
  }
  else if (edgeType != "normal" && edgeType != "contingent" && edgeType != "relative") {
    currentErrors += "\n\tunknown edgeType (" + edgeType + ")";
    okVals = false;
  }
  else logObj.log += "\n " + nodeName + " minDuration " + minDuration + " ";

  if (maxDuration === undefined) {
    maxDuration = Infinity;
  }
  if (isNaN(maxDuration)) {
    currentErrors += "\n\tmaxDuration (" + maxDuration + ") is NaN ";
    okVals = false;
  }
  else if (maxDuration != Infinity && !Number.isInteger(parseFloat(maxDuration))) {
    currentErrors += "\n\tmaxDuration (" + maxDuration + ") is not integer ";
    okVals = false;
  }
  else if (minDuration != undefined) {
    if (edgeType === "contingent" && Number(maxDuration) <= Number(minDuration)) {
      currentErrors += "\n\tmaxDuration (" + maxDuration + ") should be > minDuration (" + minDuration + ")";
      okVals = false;

    }
    else if ((edgeType === "normal" || edgeType === "relative") && Number(maxDuration) < Number(minDuration)) {
      currentErrors += "\n\tmaxDuration (" + maxDuration + ") should be >= minDuration (" + minDuration + ")";
      okVals = false;
    }
    else if (edgeType != "normal" && edgeType != "contingent" && edgeType != "relative") {
      currentErrors += "\n\tunknown edgeType (" + edgeType + ")";
      okVals = false;
    }
    else logObj.log += "\n " + nodeName + " maxDuration " + maxDuration + " ";
  }

  if (currentErrors != '') {
    logObj.errors += nodeName + currentErrors + '\n';
  }
  return { minDuration, maxDuration, okVals };
}

/**
 * Get the position of an element in the bpmnPlane
 * @param  {Object} bpmnPlane   XML node corresponding to BPMNPlane. Its children are elements
 * @param  {Object} elementId   Id to look for in bpmnPlane
 * @returns {object}             {x,y} position. If undefined it returns {0,0}
 */
function getXY(bpmnPlane, elementId) {
  let x = 0, y = 0, i = 0;

  for (i = 0; i < bpmnPlane.length; i++) {
    let element = bpmnPlane[i];
    if (element.nodeName === "bpmndi:BPMNShape") {
      if (element.attributes.bpmnElement.value === elementId) {
        x = element.firstElementChild.attributes.x.value;
        y = element.firstElementChild.attributes.y.value;
      }
    }
  }

  if (x === undefined) x = 0;
  if (y === undefined) y = 0;

  return { x, y };
}

/**
 * Check that the Gateway elements contains valid number of 
 * inputs and outputs
 * @param {*} element 
 * @param {*} myObjs 
 * @param {*} myLogObj 
 * @param {*} countObjs 
 * @returns {Boolean}
 */
function checkIfIsGateway_isOK(element, myObjs, myLogObj, countObjs) {

  if (element.nodeName.includes("exclusiveGateway") || element.nodeName.includes("parallelGateway")) {

    const elementRegistry = window.bpmnjs.get('elementRegistry');
    let tmpElement = elementRegistry.get(element.attributes.id.value);
    let gatewaySplitJoinTmp = window.bpmnjs.checkSplitJoin(tmpElement);

    if (gatewaySplitJoinTmp != undefined) { // Read it
      if (gatewaySplitJoinTmp.includes('split')) {

        if (element.nodeName.includes("exclusiveGateway")) {
          let observedPropositionTmp = getExtensionElementValue(tmpElement, "TXorProposition", "observedProposition");

          if (observedPropositionTmp != undefined) {
            myObjs[element.attributes.id.value].observedProposition = observedPropositionTmp;
          }
          else {
            myLogObj.errors += '\n' + element.nodeName + ' (' + element.attributes.id.value + ')' + ' observedProposition not defined \n';
            countObjs.elementsWithError += 1;
            return false;
          }
          myObjs[element.attributes.id.value].obs = 'split';
        }
      }
      else if (gatewaySplitJoinTmp.includes('join')) {

        if (element.nodeName.includes("exclusiveGateway")) {
          myObjs[element.attributes.id.value].obs = 'join';
        }
      }
    }
    else {
      myLogObj.errors += '\n' + element.nodeName + ' (' + element.attributes.id.value + ')' + ' invalid number of incoming/outcoming arrows \n';
      countObjs.elementsWithError += 1;
      return false;
    }
  }
  return true;
}


/**
 * Check that the Gateway elements contains valid number of 
 * inputs and outputs
 * @param {*} element 
 * @param {*} myObjs 
 * @param {*} myLogObj 
 * @param {*} countObjs 
 * @returns {Boolean}
 */
function checkObservedPropositionInBoundaryEvents(element, myObjs, myLogObj, countObjs) {

  if (element.nodeName.includes("boundaryEvent")) {

    const elementRegistry = window.bpmnjs.get('elementRegistry');
    let tmpElement = elementRegistry.get(element.attributes.id.value);

    let observedPropositionTmp = getExtensionElementValue(tmpElement, "TXorProposition", "observedProposition");

    if (observedPropositionTmp != undefined) {
      myObjs[element.attributes.id.value].observedProposition = observedPropositionTmp;
    }
    else {
      myLogObj.errors += '\n' + element.nodeName + ' (' + element.attributes.id.value + ')' + ' observedProposition not defined \n';
      countObjs.elementsWithError += 1;
      return false;
    }
    myObjs[element.attributes.id.value].obs = 'boundaryEvent';
  }
  return true;
}

/**
 * Create two nodes connected by two edges for one BPMN element
 * @param {Object} params Object with the variables element,  graph,  bpmnPlane,
  edgeType,  myLogObj,  countObjs,  myObjs
 */
function setTwoNodesToEdges(params) {
  let { element, // element to transform
    graph,        // node to add the element transformed
    bpmnPlane,    // xml node witht he x,y position
    edgeType,     // contingent or normal
    elementType,  // TASK, XOR, AND
    myLogObj,     // To report erros and log
    countObjs,    // To count tasks, nodes, edges, nContingents, nObservedProposition,elementsWithError
    myObjs        // Dictionary to match bpmnId:cstnId
  } = params;

  // Check minDuration and maxDuration values
  let tmpObj = checkMinMax(element, myLogObj, edgeType);
  let minD = tmpObj.minDuration;
  let maxD = tmpObj.maxDuration;
  let okVals = tmpObj.okVals;

  const elementRegistry = window.bpmnjs.get('elementRegistry');

  //If minD or maxD are not OK, do not create the nodes
  if (!okVals) {
    countObjs.elementsWithError += 1;
    // return;
  }
  tmpObj = getXY(bpmnPlane, element.attributes.id.value);
  let x = tmpObj.x;
  let y = tmpObj.y;
  let taskNumber = countObjs.tasks + 1;

  if (element.attributes.id != undefined) {

    if (countObjs[elementType] === undefined)
      countObjs[elementType] = 0;
    let elementTypeNumber = countObjs[elementType] + 1;

    myObjs[element.attributes.id.value] = { taskNumber: taskNumber, nodeName: '', name: '', id: '', elementType: elementType, elementTypeNumber: elementTypeNumber, cstnuNodeIds: [], cstnuEdgeIds: [], inputs: [], outputs: [], edgeType: edgeType, id_s: '', id_e: '' };
    myObjs[element.attributes.id.value].id = element.attributes.id.value;
    myObjs[element.attributes.id.value].nodeName = element.nodeName;
    if (element.attributes.name != undefined) myObjs[element.attributes.id.value].name = element.attributes.name.value.replace(/(\r\n|\n|\r)/gm, "") + ' ';

    if (!checkIfIsGateway_isOK(element, myObjs, myLogObj, countObjs)) return;
    if (!checkObservedPropositionInBoundaryEvents(element, myObjs, myLogObj, countObjs)) return;

    let propositionalLabel = "⊡";
    let tmpElement = elementRegistry.get(element.attributes.id.value);
    let propositionalLabelTmp = getExtensionElementValue(tmpElement, "TDuration", "propositionalLabel");

    if (propositionalLabelTmp != undefined)
      if (propositionalLabelTmp != '')
        propositionalLabel = propositionalLabelTmp;

    // Nodes
    let id_s = "S_" + elementType + "_" + elementTypeNumber + "_" + element.attributes.id.value;
    let id_e = "E_" + elementType + "_" + elementTypeNumber + "_" + element.attributes.id.value;

    myObjs[element.attributes.id.value].id_s = id_s;
    myObjs[element.attributes.id.value].id_e = id_e;

    let node = graph.ele("node", { id: id_s }, "");
    node.ele("data", { key: "x" }, Number(x) + Number(elementTypeNumber) - 25);
    node.ele("data", { key: "y" }, Number(y) + Number(elementTypeNumber));
    node.ele("data", { key: "Label" }, propositionalLabel);

    node = graph.ele("node", { id: id_e }, "");
    node.ele("data", { key: "x" }, Number(x) - Number(elementTypeNumber) + 25);
    node.ele("data", { key: "y" }, Number(y) - Number(elementTypeNumber));
    node.ele("data", { key: "Label" }, propositionalLabel);

    if (myObjs[element.attributes.id.value].obs) {
      if (myObjs[element.attributes.id.value].obs === 'split' || myObjs[element.attributes.id.value].obs === 'boundaryEvent') {
        node.ele("data", { key: "Obs" }, getExtensionElementValue(tmpElement, "TXorProposition", "observedProposition"));
        myObjs[element.attributes.id.value].observedProposition = getExtensionElementValue(tmpElement, "TXorProposition", "observedProposition");
        countObjs.nObservedProposition += 1;
      }
    }
    myObjs[element.attributes.id.value].cstnuNodeIds = [id_s, id_e];

    // Edges
    let edgeId = id_s + "-" + id_e;
    let countOccurrences = '';
    if (myObjs['edges_ids'][edgeId] === undefined) {
      myObjs['edges_ids'][edgeId] = { elementIds: [element.id], occurrences: 1 };

    }
    else {
      countOccurrences = '_' + myObjs['edges_ids'][edgeId].occurrences;
      myObjs['edges_ids'][edgeId].occurrences++;
      myObjs['edges_ids'][edgeId].elementIds.push(element.id);
    }
    edgeId += countOccurrences;

    let edge = graph.ele(
      "edge",
      {
        id: edgeId,
        source: id_s,
        target: id_e,
      },
      ""
    );
    edge.ele("data", { key: "Type" }, edgeType);
    edge.ele("data", { key: "Value" }, maxD);
    myObjs[element.attributes.id.value].cstnuEdgeIds.push(edgeId);

    if (Number(minD) != 0) minD = -Number(minD);

    edgeId = id_e + "-" + id_s;
    countOccurrences = '';
    if (myObjs['edges_ids'][edgeId] === undefined) {
      myObjs['edges_ids'][edgeId] = { elementIds: [element.id], occurrences: 1 };
    }
    else {
      countOccurrences = '_' + myObjs['edges_ids'][edgeId].occurrences;
      myObjs['edges_ids'][edgeId].occurrences++;
      myObjs['edges_ids'][edgeId].elementIds.push(element.id);
    }
    edgeId += countOccurrences;

    edge = graph.ele(
      "edge",
      {
        id: edgeId,
        source: id_e,
        target: id_s,
      },
      ""
    );
    edge.ele("data", { key: "Type" }, edgeType);
    edge.ele("data", { key: "Value" }, minD);
    myObjs[element.attributes.id.value].cstnuEdgeIds.push(edgeId);

    countObjs[elementType] += 1;
    countObjs.tasks += 1;
    countObjs.nodes += 2;
    countObjs.edges += 2;
    if (edgeType === "contingent") countObjs.nContingents += 1;
  }
  else {
    myLogObj.errors += element.nodeName + ' without id \n';
    countObjs.elementsWithError += 1;
  }
}

/**
 * Creates one node for START or END elements
 * @param {*} params 
 */
function createOneNode(params) {
  let { element, // element to transform
    graph,        // node to add the element transformed
    bpmnPlane,    // xml node witht he x,y position
    edgeType,     // contingent or normal
    myLogObj,     // To report erros and log
    countObjs,    // To count tasks, nodes, edges, nContingents, nObservedProposition,elementsWithError
    myObjs        // Dictionary to match bpmnId:cstnId
  } = params;

  let tmpObj = getXY(bpmnPlane, element.attributes.id.value);
  let x = tmpObj.x;
  let y = tmpObj.y;

  let taskNumber = countObjs.tasks + 1;

  let nodeLabel = '', elementType = '', elementTypeNumber = '';

  if (element.nodeName.includes("startEvent")) {
    nodeLabel += 'Z';
    elementType = 'START';
    if (countObjs.startEventsTotal > 1) {
      nodeLabel += countObjs.startEvents;
      elementTypeNumber = String(countObjs.startEvents);
      countObjs.startEvents += 1;
    }
  }
  else if (element.nodeName.includes("endEvent")) {
    nodeLabel += 'Ω';
    elementType = 'END';
    if (countObjs.endEventsTotal > 1) {
      if (countObjs.endEvents > 0)
        nodeLabel += countObjs.endEvents;
      elementTypeNumber = String(countObjs.endEvents);
      countObjs.endEvents += 1;
    }
  }
  else {
    myLogObj.errors += "\n one Node unknown " + element.nodeName;
    return;
  }

  if (element.attributes.id != undefined) {
    myObjs[element.attributes.id.value] = { taskNumber: taskNumber, nodeName: '', name: '', id: '', elementType: elementType, elementTypeNumber: elementTypeNumber, idCSTNU: elementType + '_' + elementTypeNumber, cstnuNodeIds: [], inputs: [], outputs: [], edgeType: edgeType, id_node: '' };
    myObjs[element.attributes.id.value].id = element.attributes.id.value;
    myObjs[element.attributes.id.value].nodeName = element.nodeName;
    if (element.attributes.name != undefined) myObjs[element.attributes.id.value].name = element.attributes.name.value.replace(/(\r\n|\n|\r)/gm, "") + ' ';

    // Nodes // The N_ is nedded to keep the structure like S_ E_
    let id_node = nodeLabel; // "N_" + elementType + "_" + elementTypeNumber + "_" + element.attributes.id.value;
    myObjs[element.attributes.id.value].id_node = id_node;
    let node = graph.ele("node", { id: id_node }, "");
    node.ele("data", { key: "x" }, Number(x) + Number(elementTypeNumber));
    node.ele("data", { key: "y" }, Number(y) + Number(elementTypeNumber));

    countObjs.tasks += 1;
    countObjs.nodes += 1;
    // myObjs[element.attributes.id.value].cstnuNodeIds = [elementType + '_' + elementTypeNumber];
    myObjs[element.attributes.id.value].cstnuNodeIds = [id_node];
  }
  else {
    myLogObj.errors += element.nodeName + ' without id \n';
    countObjs.elementsWithError += 1;
  }
}

function getGraphNodeFromId(graph, id) {
  let j;
  if (graph.children.length > 0) {
    for (j = 0; j < graph.children.length; j++) {
      let childObj = graph.children[j];
      if (childObj && childObj.attribs.id.value === id) {
        return [j, childObj];
      }
    }
  }

}

function arraymove(arr, fromIndex, toIndex) {
  var element = arr[fromIndex];
  arr.splice(fromIndex, 1);
  arr.splice(toIndex, 0, element);
}


/**
 * Auxiliar function to keep clean the function createBoundaryNode.
 * This creates the edge for the boudary events. 
 * The edge connects the taskA element (that contains the boundaryEvent) and 
 * the boundary event.
 * Create the edge As --[0,0],l--> Bs
 */
function createBoundaryNode_createEdgeAsBs(params) {
  let { element, // element to transform
    graph,        // node to add the element transformed
    bpmnPlane,    // xml node witht he x,y position
    edgeType,     // contingent or normal
    myLogObj,     // To report erros and log
    countObjs,    // To count tasks, nodes, edges, nContingents, nObservedProposition,elementsWithError
    myObjs        // Dictionary to match bpmnId:cstnId
  } = params;

  let minD = 0;
  let maxD = 0;

  //Get cstnuId of the connected nodes
  let source = element.attributes.attachedToRef.value;
  let target = element.attributes.id.value;
  let sourceTaskId, targetTaskId;

  if (source != undefined && myObjs[source] != undefined) {
    sourceTaskId = myObjs[source].id_s;
  }
  if (target != undefined && myObjs[target] != undefined) {
    targetTaskId = myObjs[target].id_s;
  }

  // If they are not there, do not create the edges
  if (targetTaskId === undefined || sourceTaskId === undefined) {

    myLogObj.errors += "\n Edges " + element.nodeName;
    myLogObj.errors += "\n\t source " + source + " \"" + myObjs[source].name + "\" " + ' (CSTNU_id ' + sourceTaskId + ') ';
    myLogObj.errors += "\n\t target " + target + "\"" + myObjs[target].name + "\"" + ' (CSTNU_id ' + targetTaskId + ') ';

    countObjs.elementsWithError += 1;
    return;
  }

  let idArrow = element.attributes.id.value + '_arrow';
  let outputSource = myObjs[source].outputs[0];

  myObjs['arrows'][idArrow] = { id: idArrow, source: source, target: target, cstnuEdgeIds: [], edgeType: edgeType, presentInBPMN: false };
  myObjs[source].outputs.push(idArrow);
  myObjs[target].inputs.push(idArrow);

  // Edges


  let edge, edgeId, countOccurrences;

  if (maxD != Infinity) { // maxD = '∞';

    edgeId = sourceTaskId + "-" + targetTaskId;
    countOccurrences = '';
    if (myObjs['edges_ids'][edgeId] === undefined) {
      myObjs['edges_ids'][edgeId] = { occurrences: 1 };
      myObjs['edges_ids'][edgeId] = { elementIds: [element.id], occurrences: 1 };
    }
    else {
      countOccurrences = '_' + myObjs['edges_ids'][edgeId].occurrences;
      myObjs['edges_ids'][edgeId].occurrences++;
      myObjs['edges_ids'][edgeId].elementIds.push(element.id);
    }
    edgeId += countOccurrences;

    edge = graph.ele(
      "edge",
      {
        id: edgeId,
        source: sourceTaskId,
        target: targetTaskId,
      },
      ""
    );
    edge.ele("data", { key: "Type" }, edgeType);
    edge.ele("data", { key: "Value" }, maxD);
    countObjs.edges += 1;
    myObjs['arrows'][idArrow].cstnuEdgeIds.push(edgeId);
  }

  edgeId = targetTaskId + "-" + sourceTaskId;
  countOccurrences = '';
  if (myObjs['edges_ids'][edgeId] === undefined) {
    myObjs['edges_ids'][edgeId] = { elementIds: [element.id], occurrences: 1 };
  }
  else {
    countOccurrences = '_' + myObjs['edges_ids'][edgeId].occurrences;
    myObjs['edges_ids'][edgeId].occurrences++;
    myObjs['edges_ids'][edgeId].elementIds.push(element.id);
  }
  edgeId += countOccurrences;

  edge = graph.ele(
    "edge",
    {
      id: edgeId,
      source: targetTaskId,
      target: sourceTaskId,
    },
    ""
  );

  if (Number(minD) != 0) minD = -Number(minD);
  edge.ele("data", { key: "Type" }, edgeType);
  edge.ele("data", { key: "Value" }, minD);

  countObjs.edges += 1;
  myObjs['arrows'][idArrow].cstnuEdgeIds.push(edgeId);

}

function createBoundaryNode_getPropositionalLabels(elementD, elementBP) {

  let elementRegistry = window.bpmnjs.get('elementRegistry');
  let propositionalLabel_l = "⊡", propositionalLabel_lnotb;
  let tmpElement = elementRegistry.get(elementD.id);
  let propositionalLabelTmp_l = getExtensionElementValue(tmpElement, "TDuration", "propositionalLabel");
  tmpElement = elementRegistry.get(elementBP.id);
  let propositionalLabel_lb = getExtensionElementValue(tmpElement, "TDuration", "propositionalLabel");
  let propositionalLabel_b = propositionalLabel_lb.slice(-1); // Get the last character
  let tmp_l = propositionalLabel_lb.slice(0, -1); // Get all but the last character 
  propositionalLabel_lnotb = tmp_l + '¬' + propositionalLabel_b;

  if (propositionalLabelTmp_l != undefined)
    if (propositionalLabelTmp_l != '') {
      propositionalLabel_l = propositionalLabelTmp_l;
    }

  return [propositionalLabel_l, propositionalLabel_lb, propositionalLabel_lnotb];

}

function createBoundaryNode_createNodeANDJoin(graph, bpmnPlane, elementD, elementBP, nodeA_e_idx, id_node, propositionalLabel_l, countObjs) {



  // Load position from a "real node" 
  let tmpObj = getXY(bpmnPlane, elementD.id);
  let x = tmpObj.x;
  let y = tmpObj.y;

  let node = graph.ele("node", { id: id_node }, "");
  node.ele("data", { key: "x" }, Number(x) - 50);
  node.ele("data", { key: "y" }, Number(y));
  node.ele("data", { key: "Label" }, propositionalLabel_l);

  let [nodeNew_idx, nodeNew] = getGraphNodeFromId(graph, id_node);

  // The new node has to be before the edges, if not there is an error in CSTNU 
  arraymove(graph.children, nodeNew_idx, nodeA_e_idx);

  countObjs.nodes += 1;

}

/**
 * Creates the nodes for a boundary event and the connection 
 * to the element to which it is atached 
 * @param {*} params 
 */
function createBoundaryNode(params, xmlDoc) {
  let { element, // element to transform
    graph,        // node to add the element transformed
    bpmnPlane,    // xml node witht he x,y position
    edgeType,     // contingent or normal
    myLogObj,     // To report erros and log
    countObjs,    // To count tasks, nodes, edges, nContingents, nObservedProposition,elementsWithError
    myObjs        // Dictionary to match bpmnId:cstnId
  } = params;


  //Get cstnuId of the connected nodes
  let source = element.attributes.attachedToRef.value;
  let target = element.attributes.id.value;
  let sourceTaskId, targetTaskId;


  // Create the edge As --[0,0],l--> Bs   ------------------------------
  createBoundaryNode_createEdgeAsBs(params);

  // For nonInterrupting nodes, a node has to be added after A_end, 
  // Find A_end, and the output edge, update it
  // create the new node and update the connections
  // Find BP_end, update the output edge 
  //


  // Identify the elements (BPMN) and nodes (CSTNU)
  let [nodeA_e_idx, nodeA_e] = getGraphNodeFromId(graph, myObjs[source].id_e);
  let outputElementA = myObjs['arrows'][myObjs[source].outputs[0]];
  let elementD = myObjs[outputElementA.target];
  let [nodeD_s_idx, nodeD_s] = getGraphNodeFromId(graph, elementD.id_s);
  let outputElementB = myObjs['arrows'][myObjs[target].outputs[0]];
  let elementBP = myObjs[outputElementB.target];
  let [nodeBP_idx, nodeBP_e] = getGraphNodeFromId(graph, elementBP.id_e);
  // Compute propositionalLabels of l, lb, and lnotb
  let [propositionalLabel_l, propositionalLabel_lb, propositionalLabel_lnotb] = createBoundaryNode_getPropositionalLabels(elementD, elementBP);


  // If event non Interrupting
  if (element.attributes.cancelActivity && element.attributes.cancelActivity.value == "false") { // Non-interrupting

    // Create new node ----------------
    let id_node = nodeA_e.attribs.id.value + "_join";
    createBoundaryNode_createNodeANDJoin(graph, bpmnPlane, elementD, elementBP, nodeA_e_idx, id_node, propositionalLabel_l, countObjs);

    // Update the arrows connecting A and D, remove the connection from A and use new node + 
    let j;
    for (j = 0; j < outputElementA.cstnuEdgeIds.length; j++) {

      let [idx, edgeToUpdate] = getGraphNodeFromId(graph, outputElementA.cstnuEdgeIds[j]);
      if (edgeToUpdate.attribs.source.value == nodeA_e.attribs.id.value) {
        edgeToUpdate.attribs.source.value = id_node;
      }
      else if (edgeToUpdate.attribs.target.value == nodeA_e.attribs.id.value) {
        edgeToUpdate.attribs.target.value = id_node;
      }
    }
    // Create the new edges connecting A and + 
    sourceTaskId = nodeA_e.attribs.id.value;
    targetTaskId = id_node;
    let edgeId = sourceTaskId + "-" + targetTaskId;
    let edge;
    // Upper bound
    edge = graph.ele(
      "edge",
      {
        id: edgeId,
        source: sourceTaskId,
        target: targetTaskId,
      },
      ""
    );
    edge.ele("data", { key: "Type" }, "normal");
    edge.ele("data", { key: "LabeledValues" }, "{(0, " + propositionalLabel_lnotb + ") }");
    countObjs.edges += 1;

    // Lower bound
    edgeId = targetTaskId + "-" + sourceTaskId;
    edge = graph.ele(
      "edge",
      {
        id: edgeId,
        source: targetTaskId,
        target: sourceTaskId,
      },
      ""
    );
    edge.ele("data", { key: "Type" }, "normal");
    edge.ele("data", { key: "LabeledValues" }, "{(0, " + propositionalLabel_lnotb + ") (0, " + propositionalLabel_lb + ") }");
    countObjs.edges += 1;

    // Create the new edges connecting BPe and + 
    sourceTaskId = nodeBP_e.attribs.id.value;
    targetTaskId = id_node;
    edgeId = sourceTaskId + "-" + targetTaskId;
    // No upper bound, because the value is inf

    // Lower bound
    edgeId = targetTaskId + "-" + sourceTaskId;
    edge = graph.ele(
      "edge",
      {
        id: edgeId,
        source: targetTaskId,
        target: sourceTaskId,
      },
      ""
    );
    edge.ele("data", { key: "Type" }, "normal");
    edge.ele("data", { key: "LabeledValues" }, "{(0, " + propositionalLabel_lb + ") }");
    countObjs.edges += 1;

    // Update connection Be -> BPs
    // for (j = 0; j < outputElementB.cstnuEdgeIds.length; j++) {

    //   let [idx, edgeToUpdate] = getGraphNodeFromId(graph, outputElementB.cstnuEdgeIds[j]);
    //   edgeToUpdate.ele("data", { key: "LabeledValues" }, "{(0, " + propositionalLabel_lb + ") }");

    // }
  }
  else {   

    let outputElementA_xml = xmlDoc.getElementById(outputElementA.id);
    let tmpObj = checkMinMax_sequenceFlow(outputElementA_xml, myLogObj, edgeType);
    let minD = tmpObj.minDuration;
    let maxD = tmpObj.maxDuration;

    // Update the arrows connecting A and D, remove the connection from A and use new node + 
    let j;
    for (j = 0; j < outputElementA.cstnuEdgeIds.length; j++) {

      let [idx, edgeToUpdate] = getGraphNodeFromId(graph, outputElementA.cstnuEdgeIds[j]);

      // TODO remove only the node data-Vaue, not all the nodes 
      edgeToUpdate.children = [];
      if (edgeToUpdate.attribs.source.value == nodeA_e.attribs.id.value) { // Upper bound
        if (maxD != Infinity) { // maxD = '∞';
          // edgeToUpdate.attribs.source.value = id_node;
          edgeToUpdate.ele("data", { key: "Type" }, edgeType);
          edgeToUpdate.ele("data", { key: "LabeledValues" }, "{(" + maxD + ", " + propositionalLabel_lnotb + ") }");
        }
      }
      else if (edgeToUpdate.attribs.target.value == nodeA_e.attribs.id.value) {
        // edgeToUpdate.attribs.target.value = id_node;
        if (Number(minD) != 0) minD = -Number(minD);
        edgeToUpdate.ele("data", { key: "Type" }, edgeType);
        edgeToUpdate.ele("data", { key: "LabeledValues" }, "{(" + minD + ", " + propositionalLabel_lnotb + ") }");
      }
    }
  }
}

/**
 * Create two edges from one sequenceFlow
 * @param {Object} params 
 */
function setTwoEdges_sequenceFlow(params) {
  let { element, // element to transform
    graph,        // node to add the element transformed
    edgeType,     // contingent or normal
    myLogObj,     // To report erros and log
    countObjs,    // To count tasks, nodes, edges, nContingents, nObservedProposition,elementsWithError
    myObjs        // Dictionary to match bpmnId:cstnId
  } = params;

  let tmpObj = checkMinMax_sequenceFlow(element, myLogObj, edgeType);
  let minD = tmpObj.minDuration;
  let maxD = tmpObj.maxDuration;
  let okVals = tmpObj.okVals;

  //If minD or maxD are not OK, do not create the edges
  if (!okVals) {
    countObjs.elementsWithError += 1;
    // return;
  }

  //Get cstnuId of the connected nodes
  let source = element.attributes.sourceRef.value; // id element
  let target = element.attributes.targetRef.value; // id element
  let sourceTaskId, targetTaskId;

  if (myObjs[source] != undefined) {
    if (myObjs[source].elementType === 'START' || myObjs[source].elementType === 'END') {
      // Start and End event elements generates one node, there is no S or E
      sourceTaskId = myObjs[source].id_node;
    }
    else {
      sourceTaskId = myObjs[source].id_e; // "E_" + myObjs[source].elementType + "_" + myObjs[source].elementTypeNumber + "_" + source;
    }
  }
  if (myObjs[target] != undefined) {
    if (myObjs[target].elementType === 'START' || myObjs[target].elementType === 'END') {
      targetTaskId = myObjs[target].id_node; // "N_" + myObjs[target].elementType + '_' + myObjs[target].elementTypeNumber + "_" + target;
    }
    else {
      targetTaskId = myObjs[target].id_s; // "S_" + myObjs[target].elementType + '_' + myObjs[target].elementTypeNumber + "_" + target;
    }
  }

  // If they are not there, do not create the edges
  if (targetTaskId === undefined || sourceTaskId === undefined) {

    myLogObj.errors += "\n Edges " + element.nodeName;
    myLogObj.errors += "\n\t source " + source + " \"" + ((myObjs[source]) ? myObjs[source].name : '') + "\" " + ' (CSTNU_id ' + sourceTaskId + ') ';
    myLogObj.errors += "\n\t target " + target + "\"" + ((myObjs[target]) ? myObjs[target].name : '') + "\"" + ' (CSTNU_id ' + targetTaskId + ') ';

    countObjs.elementsWithError += 1;
    return;
  }

  let idArrow = element.attributes.id.value;

  myObjs['arrows'][idArrow] = { id: idArrow, source: source, target: target, cstnuEdgeIds: [], edgeType: edgeType, presentInBPMN: true };
  myObjs[source].outputs.push(idArrow);
  myObjs[target].inputs.push(idArrow);

  // Edges
  let edgeId = sourceTaskId + "-" + targetTaskId;
  let countOccurrences = '';
  if (myObjs['edges_ids'][edgeId] === undefined) {
    myObjs['edges_ids'][edgeId] = { occurrences: 1 };
    myObjs['edges_ids'][edgeId] = { elementIds: [element.id], occurrences: 1 };
  }
  else {
    countOccurrences = '_' + myObjs['edges_ids'][edgeId].occurrences;
    myObjs['edges_ids'][edgeId].occurrences++;
    myObjs['edges_ids'][edgeId].elementIds.push(element.id);
  }
  edgeId += countOccurrences;

  let edge;
  // Upper bound 
  if (maxD != Infinity) { // maxD = '∞';
    edge = graph.ele(
      "edge",
      {
        id: edgeId,
        source: sourceTaskId,
        target: targetTaskId,
      },
      ""
    );
    edge.ele("data", { key: "Type" }, edgeType);
    edge.ele("data", { key: "Value" }, maxD);
    countObjs.edges += 1;
    myObjs['arrows'][idArrow].cstnuEdgeIds.push(edgeId);
  }

  edgeId = targetTaskId + "-" + sourceTaskId;
  countOccurrences = '';
  if (myObjs['edges_ids'][edgeId] === undefined) {
    myObjs['edges_ids'][edgeId] = { elementIds: [element.id], occurrences: 1 };
  }
  else {
    countOccurrences = '_' + myObjs['edges_ids'][edgeId].occurrences;
    myObjs['edges_ids'][edgeId].occurrences++;
    myObjs['edges_ids'][edgeId].elementIds.push(element.id);
  }
  edgeId += countOccurrences;

  // Lower bound 
  edge = graph.ele(
    "edge",
    {
      id: edgeId,
      source: targetTaskId,
      target: sourceTaskId,
    },
    ""
  );

  if (Number(minD) != 0) minD = -Number(minD);
  edge.ele("data", { key: "Type" }, edgeType);
  edge.ele("data", { key: "Value" }, minD);

  countObjs.edges += 1;
  myObjs['arrows'][idArrow].cstnuEdgeIds.push(edgeId);
}

function setTwoEdges_relativeConstraint(params) {
  let { element, // element to transform
    graph,        // node to add the element transformed
    edgeType,     // contingent or normal
    myLogObj,     // To report erros and log
    countObjs,    // To count tasks, nodes, edges, nContingents, nObservedProposition,elementsWithError
    myObjs        // Dictionary to match bpmnId:cstnId
  } = params;

  let tmpObj = checkMinMax_relativeConstraint(element, myLogObj, edgeType);
  let minD = tmpObj.minDuration;
  let maxD = tmpObj.maxDuration;
  let okVals = tmpObj.okVals;

  //If minD, maxD, or id are not OK, do not create the edges
  if (!okVals) {
    countObjs.elementsWithError += 1;
    // return;
  }

  //Get cstnuId of the connected nodes
  let source = element.source;
  let target = element.target;
  let connFrom = element.from;
  let connTo = element.to;
  let sourceTaskId, targetTaskId;

  let propositionalLabel = "⊡";
  if (element.propositionalLabel != undefined)
    propositionalLabel = element.propositionalLabel;
  if (!/(((¬|¿|)[a-zA-F])+)/.test(propositionalLabel) && propositionalLabel != "⊡") {
    myLogObj.errors += "\n Relative constraint " + element.id + " has invalid propositional label";
    countObjs.elementsWithError += 1;

  }




  if (myObjs[source] != undefined) {
    if (myObjs[source].elementType === 'START' || myObjs[source].elementType === 'END') {
      // Start and End event elements generates one node, there is no S or E
      sourceTaskId = myObjs[source].id_node;

    }
    else {
      if (connFrom == undefined || connFrom === 'end')
        sourceTaskId = myObjs[source].id_e; // "E_" + myObjs[source].elementType + "_" + myObjs[source].elementTypeNumber + "_" + source;
      else
        sourceTaskId = myObjs[source].id_s; //"S_" + myObjs[source].elementType + "_" + myObjs[source].elementTypeNumber + "_" + source;
    }

  }
  if (myObjs[target] != undefined) {
    if (myObjs[target].elementType === 'START' || myObjs[target].elementType === 'END') {
      // Start and End event elements generates one node, there is no S or E
      targetTaskId = myObjs[target].id_node;
    }
    else {
      if (connTo == undefined || connTo === 'start')
        targetTaskId = myObjs[target].id_s; // "S_" + myObjs[target].elementType + '_' + myObjs[target].elementTypeNumber + "_" + target;
      else
        targetTaskId = myObjs[target].id_e; // "E_" + myObjs[target].elementType + '_' + myObjs[target].elementTypeNumber + "_" + target;
    }
  }

  // If they are not there, do not create the edges
  if (targetTaskId === undefined || sourceTaskId === undefined) {
    myLogObj.errors += "\n Edges " + element.id;

    myLogObj.errors += "\n\t source_Id " + source + ' (' + sourceTaskId + ') ';
    if (sourceTaskId != undefined)
      myLogObj.errors += myObjs[source].name;

    myLogObj.errors += "\n\t target_Id " + target + ' (' + targetTaskId + ') ';
    if (targetTaskId != undefined)
      myLogObj.errors += myObjs[target].name;

    countObjs.elementsWithError += 1;
    return;
  }

  // Edges
  let edgeId = '';
  let countOccurrences = '';
  let edge;

  if (maxD != Infinity) { // maxD = '∞';
    edgeId = sourceTaskId + "-" + targetTaskId + "-" + element.id;
    countOccurrences = '';
    if (myObjs['edges_ids'][edgeId] === undefined) {
      myObjs['edges_ids'][edgeId] = { elementIds: [element.id], occurrences: 1 };
    }
    else {
      countOccurrences = '_' + myObjs['edges_ids'][edgeId].occurrences;
      myObjs['edges_ids'][edgeId].occurrences++;
      myObjs['edges_ids'][edgeId].elementIds.push(element.id);
    }
    edgeId += countOccurrences;
    edge = graph.ele(
      "edge",
      {
        id: edgeId,
        source: sourceTaskId,
        target: targetTaskId,
        // Label: propositionalLabel
      },
      ""
    );

    edge.ele("data", { key: "Type" }, 'normal '); //edgeType
    // edge.ele("data", { key: "Value" }, maxD);
    edge.ele("data", { key: "LabeledValues" }, "{(" + maxD + ", " + propositionalLabel + ") }");

    countObjs.edges += 1;

  }

  edgeId = targetTaskId + "-" + sourceTaskId + "-" + element.id;
  countOccurrences = '';
  if (myObjs['edges_ids'][edgeId] === undefined) {
    myObjs['edges_ids'][edgeId] = { elementIds: [element.id], occurrences: 1 };
  }
  else {
    countOccurrences = '_' + myObjs['edges_ids'][edgeId].occurrences;
    myObjs['edges_ids'][edgeId].occurrences++;
    myObjs['edges_ids'][edgeId].elementIds.push(element.id);
  }
  edgeId += countOccurrences;

  edge = graph.ele(
    "edge",
    {
      id: edgeId,
      source: targetTaskId,
      target: sourceTaskId,
      // Label: propositionalLabel
    },
    ""
  );

  if (Number(minD) != 0) minD = -Number(minD);
  edge.ele("data", { key: "Type" }, 'normal'); //edgeType
  // edge.ele("data", { key: "Value" }, minD);
  edge.ele("data", { key: "LabeledValues" }, "{(" + minD + ", " + propositionalLabel + ") }");

  countObjs.edges += 1;
}

/**
 * Create root node and descriptive nodes of CSTN XML file
 * @returns {builder.XMLElement} XML root element 
 */
function getStart_xml() {
  // To create the CSTN xml
  let root = builder.create("graphml", { version: "1.0", encoding: "UTF-8" });
  root.att("xmlns", "http://graphml.graphdrawing.org/xmlns/graphml");
  root.att("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
  root.att(
    "xsi:schemaLocation",
    "http://graphml.graphdrawing.org/xmlns/graphml"
  );

  // Elements with description/configuration
  let ele = root.ele("key", { id: "nContingent", for: "graph" });
  ele.ele("desc", {}, "Number of contingents in the graph");
  ele.ele("default", {}, "0");

  ele = root.ele('key', { 'id': 'nObservedProposition', 'for': 'graph' });
  ele.ele('desc', {}, 'Number of observed propositions in the graph');
  ele.ele('default', {}, '0');

  ele = root.ele('key', { 'id': 'NetworkType', 'for': 'graph' });
  ele.ele('desc', {}, 'Network Type');
  ele.ele('default', {}, 'CSTNU');

  ele = root.ele('key', { 'id': 'nEdges', 'for': 'graph' });
  ele.ele('desc', {}, 'Number of edges in the graph');
  ele.ele('default', {}, '0');

  ele = root.ele('key', { 'id': 'nVertices', 'for': 'graph' });
  ele.ele('desc', {}, 'Number of vertices in the graph');
  ele.ele('default', {}, '0');

  ele = root.ele('key', { 'id': 'Name', 'for': 'graph' });
  ele.ele('desc', {}, 'Graph Name');
  ele.ele('default', {}, '');

  ele = root.ele('key', { 'id': 'Obs', 'for': 'node' });
  ele.ele('desc', {}, 'Proposition Observed. Value specification: [a-zA-F]');
  ele.ele('default', {}, '');

  ele = root.ele('key', { 'id': 'x', 'for': 'node' });
  ele.ele('desc', {}, 'The x coordinate for the visualitation. A positive value.');
  ele.ele('default', {}, '0');

  ele = root.ele('key', { 'id': 'Label', 'for': 'node' });
  ele.ele('desc', {}, 'Label. Format: [¬[a-zA-F]|[a-zA-F]]+|⊡');
  ele.ele('default', {}, '⊡');

  ele = root.ele('key', { 'id': 'y', 'for': 'node' });
  ele.ele('desc', {}, 'The y coordinate for the visualitation. A positive value.');
  ele.ele('default', {}, '0');

  ele = root.ele('key', { 'id': 'Potential', 'for': 'node' });
  ele.ele('desc', {}, "Labeled Potential Values. Format: {[('node name (no case modification)', 'integer', 'label') ]+}|{}");
  ele.ele('default', {}, '');

  ele = root.ele('key', { 'id': 'Type', 'for': 'edge' });
  ele.ele('desc', {}, 'Type: Possible values: normal|contingent|constraint|derived|internal.');
  ele.ele('default', {}, 'normal');

  ele = root.ele('key', { 'id': 'LowerCaseLabeledValues', 'for': 'edge' });
  ele.ele('desc', {}, "Labeled Lower-Case Values. Format: {[('node name (no case modification)', 'integer', 'label') ]+}|{}");
  ele.ele('default', {}, '');

  ele = root.ele('key', { 'id': 'UpperCaseLabeledValues', 'for': 'edge' });
  ele.ele('desc', {}, "Labeled Upper-Case Values. Format: {[('node name (no case modification)', 'integer', 'label') ]+}|{}");
  ele.ele('default', {}, '');

  ele = root.ele('key', { 'id': 'Value', 'for': 'edge' });
  ele.ele('desc', {}, "Value for STN edge. Format: 'integer'");
  ele.ele('default', {}, '');

  ele = root.ele('key', { 'id': 'LabeledValues', 'for': 'edge' });
  ele.ele('desc', {}, "Labeled Values. Format: {[('integer', 'label') ]+}|{}");
  ele.ele('default', {}, '');

  return root;
}

/**
 * Get the BPMNPlane from the BPMNDiagram with the elements' positions
 * @param {xmlObject} xmlDoc 
 * @returns bpmnPlane a XML node
 */
function get_bpmnPlane(xmlDoc) {
  let bpmnPlane;
  let i = 0, j = 0;
  for (i = 0; i < xmlDoc.children[0].children.length; i++) {
    let elementP = xmlDoc.children[0].children[i];
    if (elementP.nodeName.includes("BPMNDiagram")) {
      for (j = 0; j < elementP.children.length; j++) {
        let element = elementP.children[j];
        if (element.nodeName.includes("BPMNPlane")) {
          bpmnPlane = element.children;
        }
      }
    }
  }
  return bpmnPlane;
}
/**
 * Iterates all the BPMN elements of xmlDoc and 
 * creates the corresponding CSTNU elements
 * @param {xmlDocument} xmlDoc 
 * @param {xmlNode} bpmnPlane 
 * @param {xmlNode} graph 
 * @param {Object} myLogObj 
 * @param {Object} countObjs 
 * @param {Object} myObjs 
 */
function setElements(xmlDoc, bpmnPlane, graph, myLogObj, countObjs, myObjs, customElements) {
  let i = 0, j = 0, k = 0;

  for (i = 0; i < xmlDoc.children[0].children.length; i++) {
    let elementP = xmlDoc.children[0].children[i];
    if (elementP.nodeName.includes("process")) {
      for (j = 0; j < elementP.children.length; j++) {
        let element = elementP.children[j]; // TODO check the elementType TASK END START BOUNDARY ??
        let paramsContingent = { elementType: 'TASK', element, graph, bpmnPlane, "edgeType": "contingent", myLogObj, countObjs, myObjs };
        let paramsNormal = { elementType: 'TASK', element, graph, bpmnPlane, "edgeType": "normal", myLogObj, countObjs, myObjs };
        let elementName = element.nodeName; //.toLowerCase()     

        // ---------------- Tasks --------------- //    
        if (elementName.includes("userTask")) {
          setTwoNodesToEdges(paramsContingent);
        }
        else if (elementName.includes("serviceTask")) {
          setTwoNodesToEdges(paramsContingent);
        }
        else if (elementName.includes("scriptTask")) {
          setTwoNodesToEdges(paramsNormal);
        }
        else if (elementName.includes("sendTask")) {
          setTwoNodesToEdges(paramsContingent);
        }
        else if (elementName.includes("receiveTask")) {
          setTwoNodesToEdges(paramsContingent);
        }
        // else if (elementName.includes("subProcess")) { // TODO 
        //   setTwoNodesToEdges(paramsContingent);
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
              setTwoNodesToEdges(paramsContingent);
            }
            // else if(eventElement.nodeName.includes('timerEventDefinition')){ // TODO
            //     setTwoNodesToEdges(paramsNormal);
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
              setTwoNodesToEdges(paramsNormal);
              numberEventDefinitions++;
            }
            else if (eventElement.nodeName.includes('EventDefinition')) {
              myLogObj.errors += "\n " + elementName + "-" + eventElement.nodeName + " not allowed in this version of the CSTNU plug-in \n "; // +element.attributes.id 
              countObjs.elementsWithError++;
              numberEventDefinitions++;
            }
            else {
              // No subtype - none
              // setTwoNodesToEdges(paramsNormal);
            }
          }
          if (numberEventDefinitions == 0) {
            setTwoNodesToEdges(paramsNormal);
          }

        }
        else if (elementName.includes("boundaryEvent")) { // TODO
          // myLogObj.warnings += "\n" + elementName + " no processed";
          // countObjs.elementsWithWarning++;
          countObjs.boundaryEventsTotal += 1;
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
          // This will be processed later, in the next for                
        }
        // ----------- Gateways -------------------//
        else if (elementName.includes("parallelGateway")) {
          paramsNormal.elementType = 'AND';
          setTwoNodesToEdges(paramsNormal);
        }
        else if (elementName.includes("exclusiveGateway")) {
          paramsNormal.elementType = 'XOR';
          setTwoNodesToEdges(paramsNormal);
        }
        // else if (elementName.includes("eventBasedGateway")) {
        //   paramsNormal.elementType = 'GATEWAY';
        //   setTwoNodesToEdges(paramsNormal);
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
        let paramsNormal = { element, graph, bpmnPlane, "edgeType": "normal", myLogObj, countObjs, myObjs, elementType: 'BOUNDARY' };
        let elementName = element.nodeName;
        // ---------------------------- startEvent and endEvet -------------------------//
        if (elementName.includes("startEvent")) {
          createOneNode(paramsNormal);
        }
        else if (elementName.includes("endEvent")) {
          createOneNode(paramsNormal);
        }
        else if (elementName.includes("boundaryEvent")) {

          let numberEventDefinitions = 0;
          for (k = 0; k < element.children.length; k++) {
            let eventElement;
            eventElement = element.children[k];

            if (eventElement && eventElement.nodeName) {
              if (eventElement.nodeName.includes('messageEventDefinition')) {
                setTwoNodesToEdges(paramsNormal);
                // createBoundaryNode(paramsNormal);
                boundaryEventsToProcess.push(paramsNormal);
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
        let paramsNormal = { element, graph, bpmnPlane, "edgeType": "normal", myLogObj, countObjs, myObjs };
        let elementName = element.nodeName;
        // ---------------------------- SequenceFlow -------------------------//
        if (elementName.includes("sequenceFlow")) {
          setTwoEdges_sequenceFlow(paramsNormal);
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

  // RelativeConstraints 
  for (i = 0; i < customElements.length; i++) {
    let element = customElements[i];
    let paramsRelativeConstraint = { element, graph, bpmnPlane, "edgeType": "relative", myLogObj, countObjs, myObjs };
    setTwoEdges_relativeConstraint(paramsRelativeConstraint);
  }
  //Check edges 
  let keys = Object.keys(myObjs['edges_ids']);
  keys.forEach(edge => {

    if (myObjs['edges_ids'][edge].occurrences > 1) {
      myLogObj.errors += 'Edge ' + edge + ' duplicated. Elements: ' + myObjs['edges_ids'][edge].elementIds;
      countObjs.elementsWithError += 1;
    }
  });

  // Added at the end to extend/adapt the elements according to the rules for bounday events
  for (i = 0; i < boundaryEventsToProcess.length; i++) {
    createBoundaryNode(boundaryEventsToProcess[i], xmlDoc); // each i contains boundaryEvent element in the structure paramsNormal
  }
}



function getExtensionElementValue(element, typeName, property) {
  return window.bpmnjs.getExtensionElementValue(element, typeName, property);
}


