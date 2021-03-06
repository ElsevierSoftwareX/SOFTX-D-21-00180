import Modeler from 'bpmn-js/lib/Modeler';
import extHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";

import {
  assign,
  isArray
} from 'min-dash';

import inherits from 'inherits';

import CustomModule from './modeler';
import TCEvaluations from './temporal-plugins-client';
import { is, getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';


export default function CustomModeler(options) {
  Modeler.call(this, options);

  this._customElements = [];
  this._evaluationModels = TCEvaluations.getEvaluationModules();
}

inherits(CustomModeler, Modeler);

CustomModeler.prototype._modules = [].concat(
  CustomModeler.prototype._modules,
  [
    CustomModule
  ]
);

CustomModeler.prototype.setTCEvaluationsModulesButtons = function () {

  let selectTCE = document.getElementById('selectTCEvaluation');

  if (this._evaluationModels.length === 0) {
    // Handled in selectTCEvaluationModule
  }
  else if (this._evaluationModels.length === 1) {
    let option = document.createElement("option");
    option.value = this._evaluationModels[0].moduleInfo.name;
    option.text = this._evaluationModels[0].moduleInfo.name;
    selectTCE.appendChild(option);
  } else {
    for (let i = 0; i < this._evaluationModels.length; i++) {
      let option = document.createElement("option");
      option.value = i;
      option.text = this._evaluationModels[i].moduleInfo.name;
      selectTCE.appendChild(option);
    }
  }

  selectTCE.onchange = function () { selectTCEvaluationModule(); };
  // To set the first configutarion // TODO chech if there is a first configuration 
  selectTCEvaluationModule();
};

function selectTCEvaluationModule() {
  let ulButtons = document.getElementById('ulButtonsTCEvaluation');
  let selectTCE = document.getElementById('selectTCEvaluation');

  // 1. Remove all the li in ul that do not contain select 
  let lis = ulButtons.children;
  let li = null;
  for (let i = 0; li = lis[i]; i++) {

    if (li.id === "") {
      li.parentNode.removeChild(li);
      i--;
    }
  }

  // 2. Create a new li for each function in the module with a button
  let selectedModule = window.bpmnjs._evaluationModels[Number(selectTCE.value)];
  if (selectedModule) {
    for (let i = 0; i < selectedModule.moduleInfo.buttonFunctions.length; i++) {
      let li = document.createElement("li");
      let button = document.createElement("button");
      button.innerHTML = selectedModule.moduleInfo.buttonFunctions[i].label;
      button.addEventListener("click", function () { callExternalFunction(i); });
      li.appendChild(button);
      ulButtons.appendChild(li);
    }
  }
  else {
    let li = document.createElement("li");
    li.innerHTML = "No module was loaded";
    ulButtons.appendChild(li);
  }
}

// async function because the function toXML is a promise
async function callExternalFunction(idxFunction) {
  // let definitions = window.bpmnjs.getDefinitions();
  let definitions = window.bpmnjs.getDefinitionsWithRelativeConstraintAsExtensionElements();
  let { xml } = await window.bpmnjs._moddle.toXML(definitions, { format: true });
  let customElements = window.bpmnjs.getCustomElements();

  // Detect the button and call the corresponding fuction 
  let selectTCE = document.getElementById('selectTCEvaluation');
  let selectedModule = window.bpmnjs._evaluationModels[Number(selectTCE.value)];

  selectedModule.moduleInfo.buttonFunctions[idxFunction].function(xml, customElements);
}

/**
 * Add a single custom element to the underlying diagram
 *
 * @param {Object} customElement
 */
CustomModeler.prototype._addCustomShape = function (customElement) {

  this._customElements.push(customElement);
  let canvas = this.get('canvas'),
    elementFactory = this.get('elementFactory');

  let customAttrs = assign({ businessObject: customElement }, customElement);
  let customShape = elementFactory.create('shape', customAttrs);

  return canvas.addShape(customShape);
};

CustomModeler.prototype._addCustomConnection = function (customElement) {

  this._customElements.push(customElement);

  let canvas = this.get('canvas'),
    elementFactory = this.get('elementFactory'),
    elementRegistry = this.get('elementRegistry');

  let customAttrs = assign({ businessObject: customElement }, customElement);

  let connection = elementFactory.create('connection', assign(customAttrs, {
    source: elementRegistry.get(customElement.source),
    target: elementRegistry.get(customElement.target)
  }),
    elementRegistry.get(customElement.source).parent);

  return canvas.addConnection(connection);
};

/**
 * Add a number of custom elements and connections to the underlying diagram.
 *
 * @param {Array<Object>} customElements
 */
CustomModeler.prototype.addCustomElements = function (customElements) {
  if (!isArray(customElements)) {
    throw new Error('argument must be an array');
  }

  let shapes = [],
    connections = [];

  customElements.forEach(function (customElement) {
    if (isCustomConnection(customElement)) {
      connections.push(customElement);
    } else {
      shapes.push(customElement);
    }
  });

  // add shapes before connections so that connections
  // can already rely on the shapes being part of the diagram
  shapes.forEach(this._addCustomShape, this);

  connections.forEach(this._addCustomConnection, this);
};

/**
 * Get custom elements with their current status.
 *
 * @return {Array<Object>} custom elements on the diagram
 */
CustomModeler.prototype.getCustomElements = function () {
  return this._customElements;
};

CustomModeler.prototype.cleanCustomElements = function () {
  this._customElements = [];
};

CustomModeler.prototype.loadCustomElementsFromXML = function () {

  const elementRegistry = this.get('elementRegistry');
  let connections = [];
  elementRegistry.getAll().forEach(function (element) {
    let businessObject = getBusinessObject(element);
    let extensionElements = businessObject.extensionElements;

    if (extensionElements) {
      let relativeConstraints = getExtensionElement(businessObject, 'tempcon:RelativeCostraint');
      if (relativeConstraints && relativeConstraints.length > 0) {

        relativeConstraints.forEach(function (relativeConstraint) {
          let customElement = {
            type: relativeConstraint.type,
            id: relativeConstraint.id_relativeConstraint,
            name: relativeConstraint.name,
            waypoints: JSON.parse(relativeConstraint.waypoints),
            source: element.id,
            target: relativeConstraint.target,
            minDuration: relativeConstraint.duration.minDuration,
            maxDuration: relativeConstraint.duration.maxDuration,
            propositionalLabel: relativeConstraint.duration.propositionalLabel,
            from: relativeConstraint.from,
            to: relativeConstraint.to
          };
          connections.push(customElement);
        });
      }
    }
  });
  connections.forEach(this._addCustomConnection, this);
};


CustomModeler.prototype.getDefinitionsWithRelativeConstraintAsExtensionElements = function () {
  // Update ectensionElements tempcon:Relative
  const elementRegistry = this.get('elementRegistry');
  const modeling = this.get('modeling');
  const moddle = this.get('moddle');

  // If there are inter-task elements remover them 
  elementRegistry.getAll().forEach(function (element) {
    let businessObject = getBusinessObject(element);
    let extensionElements = businessObject.extensionElements;

    if (extensionElements) {
      let relativeConstraints = getExtensionElement(businessObject, 'tempcon:RelativeCostraint');

      if (relativeConstraints) {
        relativeConstraints.forEach(function (relativeConstraint) {
          businessObject.extensionElements.values = businessObject.extensionElements.values.filter(function (item) {
            return item != relativeConstraint;
          });
        });
      }
    }
  });

  // for each customConnection, create an relativeConstraint extensionElement
  this._customElements.forEach(function (customConnection) {
    let sourceElement = elementRegistry.get(customConnection.source);
    let businessObject = getBusinessObject(sourceElement);

    let extensionElements = businessObject.extensionElements || moddle.create('bpmn:ExtensionElements');

    let relativeConstraint = moddle.create('tempcon:RelativeCostraint');
    extensionElements.get('values').push(relativeConstraint);
    let duration = moddle.create("tempcon:TDuration");
    relativeConstraint["duration"] = duration;

    relativeConstraint.type = customConnection.type;
    relativeConstraint.id_relativeConstraint = customConnection.id;
    relativeConstraint.name = customConnection.name;
    relativeConstraint.waypoints = JSON.stringify(customConnection.waypoints);
    // relativeConstraint.source = customConnection.source;
    relativeConstraint.target = customConnection.target;
    relativeConstraint.duration.minDuration = customConnection.minDuration;
    relativeConstraint.duration.maxDuration = customConnection.maxDuration;
    relativeConstraint.duration.propositionalLabel = customConnection.propositionalLabel;
    relativeConstraint.from = customConnection.from;
    relativeConstraint.to = customConnection.to;

    modeling.updateProperties(sourceElement, { extensionElements });

  });

  let definitions = this.getDefinitions();

  return definitions;
};


CustomModeler.prototype.checkSplitJoin = function (element) {
  let businessObject = element.businessObject || element;
  let incoming = businessObject.incoming;
  let outgoing = businessObject.outgoing;
  let type;

  if (incoming && outgoing) {
    if (is(element, 'bpmn:ExclusiveGateway')) {
      if (incoming.length == 2 && outgoing.length == 1) type = 'join';
      else if (incoming.length == 1 && outgoing.length == 2) type = 'split';
    }
    else if (is(element, 'bpmn:ParallelGateway')) {
      if (incoming.length >= 2 && outgoing.length == 1) type = 'join';
      else if (incoming.length == 1 && outgoing.length >= 2) type = 'split';
    }
  }
  return type;
};

// Funtion to get temporal constraint values from the extension elements 
CustomModeler.prototype.getExtensionElementValue = function (element, typeName, property) {
  let businessObject = element.businessObject || element;

  let tempConType;

  if (businessObject.$type.includes('Task')) {
    tempConType = "TTask";
  } else if (businessObject.$type.includes('Gateway')) {
    tempConType = "TGateway";
  } else if (businessObject.$type.includes('Event')) {
    tempConType = "TEvent";
  } else if (businessObject.$type.includes('Flow')) {
    tempConType = "TSequenceFlow";
  }

  let extensions = extHelper.getExtensionElements(
    businessObject,
    "tempcon:" + tempConType
  );
  let returnValue;
  if (extensions) {
    if (extensions.length > 0) {
      returnValue = extensions[0][property];
      if (property != 'observedProposition' && property != 'isTrueBranch')
        returnValue = extensions[0].duration[property];
      else
        returnValue = extensions[0][property];
    }
  }
  return returnValue;
};

function isCustomConnection(element) {
  return element.type === 'custom:connection';
}


function getExtensionElement(element, type) {
  if (!element.extensionElements) {
    return;
  }

  if (element.extensionElements.values) {
    return element.extensionElements.values.filter((extensionElement) => {
      return extensionElement.$instanceOf(type);
    });
  }
}

// Function to set temporal constraint values in the extension elements 
CustomModeler.prototype.setExtensionElementValue = function (element, typeName, property, value) {

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

    if (Array.isArray(tempConElement))
      tempConElement = tempConElement[0];
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
};


