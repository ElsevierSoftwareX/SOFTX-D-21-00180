import Modeler from 'bpmn-js/lib/Modeler';

import {
  assign,
  isArray
} from 'min-dash';

import inherits from 'inherits';

import CustomModule from './modeler';
import TCEvaluations from './temporal-plugins-client';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import { getWaypointsMid } from 'bpmn-js/lib/util/LabelUtil';


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
  let definitions = window.bpmnjs.getDefinitionsWithIntertaskAsExtensionElements();
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
  // if (!isArray(customElements)) {
  //   throw new Error('argument must be an array');
  // }

  const elementRegistry = this.get('elementRegistry');
  const modeling = this.get('modeling');
  const moddle = this.get('moddle');

  elementRegistry.getAll().forEach(function(element) {
    let businessObject = getBusinessObject(element);
    let extensionElements = businessObject.extensionElements;

    if(extensionElements){
      console.log(businessObject);
      // let analysisDetails = getExtensionElement(businessObject, 'tempcon:intertask');
  debugger



    }

  });
  debugger
  // let shapes = [];
  let connections = [];

  // customElements.forEach(function (customElement) {
  //   if (isCustomConnection(customElement)) {
  //     connections.push(customElement);
  //   } else {
  //     shapes.push(customElement);
  //   }
  // });

  // // add shapes before connections so that connections
  // // can already rely on the shapes being part of the diagram
  // shapes.forEach(this._addCustomShape, this);



  connections.forEach(this._addCustomConnection, this);




};


CustomModeler.prototype.getDefinitionsWithIntertaskAsExtensionElements = function(){
  console.log('in function');
  
  const elementRegistry = this.get('elementRegistry');
  const modeling = this.get('modeling');
  const moddle = this.get('moddle');


  this._customElements.forEach(function(customConnection){
    let sourceElement = elementRegistry.get(customConnection.source);
    let businessObject = getBusinessObject(sourceElement);
    
    let extensionElements = businessObject.extensionElements || moddle.create('bpmn:ExtensionElements');
    let analysisDetails = getExtensionElement(businessObject, 'tempcon:intertask');
       
    // console.log(sourceElement)
    
    analysisDetails = moddle.create('tempcon:intertask');
    extensionElements.get('values').push(analysisDetails);
    // debugger

    
    analysisDetails.type=customConnection.type;
    analysisDetails.id_intertask=customConnection.id;
    analysisDetails.waypoints=JSON.stringify(customConnection.waypoints);
    analysisDetails.source=customConnection.source;
    analysisDetails.target=customConnection.target;
    analysisDetails.minDuration=customConnection.minDuration;
    analysisDetails.maxDuration=customConnection.maxDuration;
    analysisDetails.propositionalLabel=customConnection.propositionalLabel;
    analysisDetails.intertaskConnFrom=customConnection.intertaskConnFrom;
    analysisDetails.intentaskConnTo=customConnection.intertaskConnTo;

    modeling.updateProperties(sourceElement, {extensionElements});

  } );
     
  let definitions = this.getDefinitions();
  // debugger;


  return definitions;
}

function isCustomConnection(element) {
  return element.type === 'custom:connection';
}

function setIntertaskAsExtensionElement(){


}


function getExtensionElement(element, type) {
  if (!element.extensionElements) {
    return;
  }

  return element.extensionElements.values.filter((extensionElement) => {
    return extensionElement.$instanceOf(type);
  })[0];
}
