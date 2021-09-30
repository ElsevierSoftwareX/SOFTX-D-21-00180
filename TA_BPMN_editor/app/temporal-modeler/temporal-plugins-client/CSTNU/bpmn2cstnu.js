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
  myObjs['nodeObservation'] = ['P', 'Q', 'R', 'S', 'T', 'U', 'V',];  // pLabels 
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
    endEventsTotal: 0
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

  // let xmlString = root.end();
  let xmlString = root.end({
    pretty: true,
    indent: "  ",
    newline: "\n",
    width: 0,
    allowEmpty: false,
    spacebeforeslash: "",
  });

  myLogObj.errors = 'Elements with error: ' + countObjs.elementsWithError + '\n\n' + myLogObj.errors;
  myLogObj.warnings = 'Elements with warning: ' + countObjs.elementsWithWarning + '\n\n' + myLogObj.warnings;

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

  // if (element.attributes["tempcon:minDuration"] === undefined)
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

    // Check incoming and outgoing
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
    const elementRegistry = window.bpmnjs.get('elementRegistry');
    let tempElement = elementRegistry.get(element.attributes.id.value);
    // let gatewaySplitJoinTmp = getExtensionElementValue(tempElement, "TGatewaySplitJoin", "gatewaySplitJoin");
    let gatewaySplitJoinTmp = window.bpmnjs.checkSplitJoin(tempElement);

    if (gatewaySplitJoinTmp != undefined) { //Read it
      if (gatewaySplitJoinTmp.includes('split')) {
        // if split, it should have 1 input and 2 outputs
        if (nIncoming != 1 || nOutgoing != 2) {
          myLogObj.errors += '\n' + element.nodeName + ' (' + element.attributes.id.value + ')' + ' invalid number of incoming/outcoming arrows \n';
          countObjs.elementsWithError += 1;
          return false;
        }
        if (element.nodeName.includes("exclusiveGateway")) {
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
          myObjs[element.attributes.id.value].obs = 'split';
        }
      }
      else if (gatewaySplitJoinTmp.includes('join')) {
        // if join, it should have 2 inputs and 1 output
        if (nIncoming != 2 || nOutgoing != 1) {
          myLogObj.errors += '\n' + element.nodeName + ' (' + element.attributes.id.value + ')' + ' invalid number of incoming/outcoming arrows \n';
          countObjs.elementsWithError += 1;
          return false;
        }
        if (element.nodeName.includes("exclusiveGateway")) {
          myObjs[element.attributes.id.value].obs = 'join';
        }
      }
    }
    else {
      myLogObj.errors += '\n' + element.nodeName + ' (' + element.attributes.id.value + '): gatewaySplitJoin not defined \n';
      countObjs.elementsWithError += 1;
      return false;
    }
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

    myObjs[element.attributes.id.value] = { taskNumber: taskNumber, nodeName: '', name: '', id: '', elementType: elementType, elementTypeNumber: elementTypeNumber, cstnuNodeIds: [], cstnuEdgeIds: [], inputs: [], outputs: [], edgeType: edgeType };
    myObjs[element.attributes.id.value].id = element.attributes.id.value;
    myObjs[element.attributes.id.value].nodeName = element.nodeName;
    if (element.attributes.name != undefined) myObjs[element.attributes.id.value].name = element.attributes.name.value.replace(/(\r\n|\n|\r)/gm, "") + ' ';

    if (!checkIfIsGateway_isOK(element, myObjs, myLogObj, countObjs))
      return;

    let propositionalLabel = "⊡";
    let tmpElement = elementRegistry.get(element.attributes.id.value);
    let propositionalLabelTmp = getExtensionElementValue(tmpElement, "TDuration", "propositionalLabel");

    if (propositionalLabelTmp != undefined)
      if (propositionalLabelTmp != '')
        propositionalLabel = propositionalLabelTmp;

    // Nodes
    let id_s = "S_" + elementType + "_" + elementTypeNumber + "_" + element.attributes.id.value;
    let id_e = "E_" + elementType + "_" + elementTypeNumber + "_" + element.attributes.id.value;
    let node = graph.ele("node", { id: id_s }, "");
    node.ele("data", { key: "x" }, Number(x) + Number(elementTypeNumber) - 25);
    node.ele("data", { key: "y" }, Number(y) + Number(elementTypeNumber));
    node.ele("data", { key: "Label" }, propositionalLabel);

    node = graph.ele("node", { id: id_e }, "");
    node.ele("data", { key: "x" }, Number(x) - Number(elementTypeNumber) + 25);
    node.ele("data", { key: "y" }, Number(y) - Number(elementTypeNumber));
    node.ele("data", { key: "Label" }, propositionalLabel);

    if (myObjs[element.attributes.id.value].obs) {
      if (myObjs[element.attributes.id.value].obs === 'split') {
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
    myObjs[element.attributes.id.value] = { taskNumber: taskNumber, nodeName: '', name: '', id: '', elementType: elementType, elementTypeNumber: elementTypeNumber, idCSTNU: elementType + '_' + elementTypeNumber, cstnuNodeIds: [], inputs: [], outputs: [], edgeType: edgeType };
    myObjs[element.attributes.id.value].id = element.attributes.id.value;
    myObjs[element.attributes.id.value].nodeName = element.nodeName;
    if (element.attributes.name != undefined) myObjs[element.attributes.id.value].name = element.attributes.name.value.replace(/(\r\n|\n|\r)/gm, "") + ' ';

    // Nodes
    let id_node = elementType + "_" + elementTypeNumber + "_" + element.attributes.id.value;

    let node = graph.ele("node", { id: id_node }, "");
    node.ele("data", { key: "x" }, Number(x) + Number(elementTypeNumber));
    node.ele("data", { key: "y" }, Number(y) + Number(elementTypeNumber));
    node.ele("data", { key: "Label" }, nodeLabel);

    countObjs.tasks += 1;
    myObjs[element.attributes.id.value].cstnuNodeIds = [elementType + '_' + elementTypeNumber];

  }
  else {
    myLogObj.errors += element.nodeName + ' without id \n';
    countObjs.elementsWithError += 1;
  }
}

/**
 * Create two edges from one sequenceFlow
 * @param {Object} params 
 */
function setTwoEdges_sequenceFlow(params) {
  let { element, // element to transform
    graph,        // node to add the element transformed
    // bpmnPlane,    // xml node witht he x,y position
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
  let source = element.attributes.sourceRef.value;
  let target = element.attributes.targetRef.value;
  let sourceTaskId, targetTaskId;

  if (myObjs[source] != undefined) {
    if (myObjs[source].elementType === 'START' || myObjs[source].elementType === 'END') {
      sourceTaskId = myObjs[source].elementType + "_" + myObjs[source].elementTypeNumber + "_" + source;
    }
    else {
      sourceTaskId = 'E_' + myObjs[source].elementType + "_" + myObjs[source].elementTypeNumber + "_" + source;
    }

  }
  if (myObjs[target] != undefined) {
    if (myObjs[target].elementType === 'START' || myObjs[target].elementType === 'END') {
      targetTaskId = myObjs[target].elementType + '_' + myObjs[target].elementTypeNumber + "_" + target;
    }
    else {
      targetTaskId = 'S_' + myObjs[target].elementType + '_' + myObjs[target].elementTypeNumber + "_" + target;
    }

  }

  // If they are not there, do not create the edges
  if (targetTaskId === undefined || sourceTaskId === undefined) {

    myLogObj.errors += "\n Edges " + element.nodeName;

    myLogObj.errors += "\n\t source_Id " + source + ' (' + sourceTaskId + ') ';
    if (sourceTaskId != undefined)
      myLogObj.errors += myObjs[source].name;

    myLogObj.errors += "\n\t target_Id " + target + ' (' + targetTaskId + ') ';
    if (targetTaskId != undefined)
      myLogObj.errors += myObjs[target].name;


    countObjs.elementsWithError += 1;
    return;
  }


  let idArrow = element.attributes.id.value;

  myObjs['arrows'][idArrow] = { id: idArrow, source: source, target: target, cstnuEdgeIds: [], edgeType: edgeType };
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

  if (myObjs[source] != undefined) {
    if (myObjs[source].type === 'START' || myObjs[source].type === 'END') {
      // Check if this is valid 
    }
    else {
      if (connFrom == undefined || connFrom === 'end')
        sourceTaskId = "E_" + myObjs[source].elementType + "_" + myObjs[source].elementTypeNumber + "_" + source;
      else
        sourceTaskId = "S_" + myObjs[source].elementType + "_" + myObjs[source].elementTypeNumber + "_" + source;
    }

  }
  if (myObjs[target] != undefined) {
    if (myObjs[target].type === 'START' || myObjs[target].type === 'END') {
      // Check if this is valid 
    }
    else {
      if (connTo == undefined || connTo === 'start')
        targetTaskId = "S_" + myObjs[target].elementType + '_' + myObjs[target].elementTypeNumber + "_" + target;
      else
        targetTaskId = "E_" + myObjs[target].elementType + '_' + myObjs[target].elementTypeNumber + "_" + target;
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
        Label: propositionalLabel
      },
      ""
    );

    edge.ele("data", { key: "Type" }, 'normal '); //edgeType
    edge.ele("data", { key: "Value" }, maxD);
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
      Label: propositionalLabel
    },
    ""
  );

  if (Number(minD) != 0) minD = -Number(minD);
  edge.ele("data", { key: "Type" }, 'normal'); //edgeType
  edge.ele("data", { key: "Value" }, minD);

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
  let i = 0, j = 0;

  for (i = 0; i < xmlDoc.children[0].children.length; i++) {
    let elementP = xmlDoc.children[0].children[i];
    if (elementP.nodeName.includes("process")) {
      for (j = 0; j < elementP.children.length; j++) {
        let element = elementP.children[j];
        let paramsContingent = { elementType: 'TASK', element, graph, bpmnPlane, "edgeType": "contingent", myLogObj, countObjs, myObjs };
        let paramsNormal = { elementType: 'TASK', element, graph, bpmnPlane, "edgeType": "normal", myLogObj, countObjs, myObjs };
        let elementName = element.nodeName; //.toLowerCase()           
        // ---------------- Tasks --------------- //            
        if (elementName.includes("task")) {
          myLogObj.warnings += "\n " + elementName + " " + " not allowed \n "; // +element.attributes.id 
          countObjs.elementsWithWarning++;
        }
        else if (elementName.includes("userTask")) {
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
        else if (elementName.includes("subProcess")) {
          setTwoNodesToEdges(paramsContingent);
        }
        //  ---------------------- Events ---------------//
        else if (elementName.includes("intermediateCatchEvent")) {
          // Subtypes are
          //  bpmn:timerEventDefinition   // This is a bit different TODO
          //  bpmn:messageEventDefinition
          //  bpnm:singleEventDefinition
          setTwoNodesToEdges(paramsNormal);
        }
        else if (elementName.includes("boundaryEvent")) {
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
          paramsNormal.elementType = 'AND';
          setTwoNodesToEdges(paramsNormal);
        }
        else if (elementName.includes("exclusiveGateway")) {
          paramsNormal.elementType = 'XOR';
          setTwoNodesToEdges(paramsNormal);
        }
        else if (elementName.includes("eventBasedGateway")) {
          paramsNormal.elementType = 'GATEWAY';
          setTwoNodesToEdges(paramsNormal);
        }
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
        let paramsNormal = { element, graph, bpmnPlane, "edgeType": "normal", myLogObj, countObjs, myObjs };
        let elementName = element.nodeName;
        // ---------------------------- startEvent and endEvet -------------------------//
        if (elementName.includes("startEvent")) {
          createOneNode(paramsNormal);
        }
        else if (elementName.includes("endEvent")) {
          createOneNode(paramsNormal);
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

}


function getExtensionElementValue(element, typeName, property) {
  return window.bpmnjs.getExtensionElementValue(element, typeName, property);
}


