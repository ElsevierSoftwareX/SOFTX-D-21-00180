import entryFactory from 'bpmn-js-properties-panel/lib/factory/EntryFactory';
import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import extHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";


import {
  is, getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';



/** Check minDuration > 0 */
var validateMinDuration_contingent = function (element, values, node) {
  let val = values.minDuration;

  if (node.childElementCount > 0) {
    if (node.childNodes[2].className.includes("bpp-field-description")) {
      node.childNodes[2].innerHTML = '&nbsp;';
      node.childNodes[1].style.border = '';
    }
  }
  if (val === undefined || (isNaN(val) || Number(val) <= 0) || !Number.isInteger(parseFloat(val))) {
    if (node.childElementCount > 0) {
      if (node.childNodes[2].className.includes("bpp-field-description")) {
        node.childNodes[2].innerText = 'Min duration should be an integer bigger than 0';
        node.childNodes[1].style.border = '2px solid red';
      }
    }
  }
  return !isNaN(val) && Number(val) >= 0;
};
/** Check minDuration >= 0 */
var validateMinDuration_noContingent = function (element, values, node) {
  let val = values.minDuration;

  if (node.childElementCount > 0) {
    if (node.childNodes[2].className.includes("bpp-field-description")) {
      node.childNodes[2].innerHTML = '&nbsp;';
      node.childNodes[1].style.border = '';
    }
  }
  if (val === undefined || (isNaN(val) || Number(val) < 0) || !Number.isInteger(parseFloat(val))) {
    if (node.childElementCount > 0) {
      if (node.childNodes[2].className.includes("bpp-field-description")) {
        node.childNodes[2].innerText = 'Min duration should be an integer bigger than 0';
        node.childNodes[1].style.border = '2px solid red';
      }
    }
  }
  return !isNaN(val) && Number(val) >= 0;
};
/** Check minDuration >= 0 */
var validateMinDuration_sequenceFlow = function (element, values, node) {
  let val = values.minDuration;

  if (node.childElementCount > 0) {
    if (node.childNodes[2].className.includes("bpp-field-description")) {
      node.childNodes[2].innerHTML = '&nbsp;';
      node.childNodes[1].style.border = '';
    }
  }

  if (val === undefined) {
    // Default valur is 0
  }
  else {
    // val = val.replace(/\s/g, '');
    if (val != '') {
      if ((isNaN(val) || Number(val) < 0) || !Number.isInteger(parseFloat(val))) {
        if (node.childElementCount > 0) {
          if (node.childNodes[2].className.includes("bpp-field-description")) {
            node.childNodes[2].innerText = 'Min duration should be an integer bigger than 0';
            node.childNodes[1].style.border = '2px solid red';
          }
        }
      }
    }
  }
  return !isNaN(val) && Number(val) >= 0;
};
var validateMinDuration_relativeConstraint = function (element, values, node) {
  let val = values.minDuration;

  if (node.childElementCount > 0) {
    if (node.childNodes[2].className.includes("bpp-field-description")) {
      node.childNodes[2].innerHTML = '&nbsp;';
      node.childNodes[1].style.border = '';
    }
  }

  if (val === undefined) {
    // Default valur is 0
  }
  else {
    // val = val.replace(/\s/g, '');
    if (val != '') {
      if (isNaN(val) || !Number.isInteger(parseFloat(val))) {
        if (node.childElementCount > 0) {
          if (node.childNodes[2].className.includes("bpp-field-description")) {
            node.childNodes[2].innerText = 'Min duration should be an integer bigger than 0';
            node.childNodes[1].style.border = '2px solid red';
          }
        }
      }
    }
  }
  return !isNaN(val) && Number(val) >= 0;
};
/** Check minDuration < maxDuration */
var validateMaxDuration_contingent = function (element, values, node) {
  let val = values.maxDuration;
  // let valMinDuration = element.businessObject.minDuration;
  let valMinDuration  = getExtensionElementValue(element, 'TDuration', 'minDuration');

  if (node.childElementCount > 0) {
    if (node.childNodes[2].className.includes("bpp-field-description")) {
      node.childNodes[2].innerHTML = '&nbsp;';
      node.childNodes[1].style.border = '';
    }
  }

  if (val === undefined || (isNaN(val) || Number(val) <= Number(valMinDuration)) || !Number.isInteger(parseFloat(val))) {
    if (node.childElementCount > 0) {
      if (node.childNodes[2].className.includes("bpp-field-description")) {
        node.childNodes[2].innerText = 'Max duration should be an integer bigger than min duration';
        node.childNodes[1].style.border = '2px solid red';
      }
    }
  }
  return !isNaN(val) && Number(val) > 0;
};
/** Check minDuration <= maxDuration */
var validateMaxDuration_noContingent = function (element, values, node) {
  let val = values.maxDuration;
  // let valMinDuration = element.businessObject.minDuration;
  let valMinDuration  = getExtensionElementValue(element, 'TDuration', 'minDuration');

  if (node.childElementCount > 0) {
    if (node.childNodes[2].className.includes("bpp-field-description")) {
      node.childNodes[2].innerHTML = '&nbsp;';
      node.childNodes[1].style.border = '';
    }
  }

  if (val === undefined || (isNaN(val) || Number(val) < Number(valMinDuration)) || !Number.isInteger(parseFloat(val))) {
    if (node.childElementCount > 0) {
      if (node.childNodes[2].className.includes("bpp-field-description")) {
        node.childNodes[2].innerText = 'Max duration should be a number bigger or equal than min duration';
        node.childNodes[1].style.border = '2px solid red';
      }
    }
  }
  return !isNaN(val) && Number(val) > 0;
};
/** Check minDuration <= maxDuration or inf */
var validateMaxDuration_sequenceFlow = function (element, values, node) {
  let val = values.maxDuration;
  // let valMinDuration = element.businessObject.minDuration;
  let valMinDuration  = getExtensionElementValue(element, 'TDuration', 'minDuration');
  if (valMinDuration === undefined) valMinDuration = 0;

  if (node.childElementCount > 0) {
    if (node.childNodes[2].className.includes("bpp-field-description")) {
      node.childNodes[2].innerHTML = '&nbsp;';
      node.childNodes[1].style.border = '';
    }
  }
  if (val === undefined) {
    // Default valur is Inf
  }
  else {
    // val = val.replace(/\s/g, '');
    if (val != '')
      if ((isNaN(val) || Number(val) < Number(valMinDuration)) || !Number.isInteger(parseFloat(val)))
        if (node.childElementCount > 0)
          if (node.childNodes[2].className.includes("bpp-field-description")) {
            node.childNodes[2].innerText = 'Max duration should be a number bigger or equal than min duration';
            node.childNodes[1].style.border = '2px solid red';
          }
  }

  return !isNaN(val) && Number(val) > 0;
};

var validateMaxDuration_relative = function (element, values, node) {
  let val = values.maxDuration;
  let valMinDuration = element.businessObject.minDuration;
  if (valMinDuration === undefined) valMinDuration = 0;

  if (node.childElementCount > 0) {
    if (node.childNodes[2].className.includes("bpp-field-description")) {
      node.childNodes[2].innerHTML = '&nbsp;';
      node.childNodes[1].style.border = '';
    }
  }
  if (val === undefined) {
    // Default valur is Inf
  }
  else {
    // val = val.replace(/\s/g, '');
    if (val != '')
      if ((isNaN(val) || Number(val) < Number(valMinDuration)) || !Number.isInteger(parseFloat(val)))
        if (node.childElementCount > 0)
          if (node.childNodes[2].className.includes("bpp-field-description")) {
            node.childNodes[2].innerText = 'Max duration should be a number bigger or equal than min duration';
            node.childNodes[1].style.border = '2px solid red';
          }
  }

  return !isNaN(val) && Number(val) > 0;
};




function getExtensionElementValue(element, typeName, property) {  
let bo = element.businessObject || element;

  let extensions = extHelper.getExtensionElements(
    bo,
    "tempcon:" + typeName
  );
  let returnValue;
  if (extensions) {
    if (extensions.length>0){
      returnValue = extensions[0][property];
    }  
  } 
  
  // console.log('Return ' + property + ' ' + returnValue );
  return returnValue;

}

export default function (group, element, bpmnFactory, translate) {

  const getValue = function (businessObject, prefix, typeName, property) {
    return function (element) {
      let extensions = extHelper.getExtensionElements(
        businessObject,
        prefix + ":" + typeName
      );
      let returnObject = {};
      returnObject[property] = "";

      if (extensions) {
        if(extensions.length > 0){
          returnObject[property] = extensions[0][property];
        }
      } 
      return returnObject;
    };
  };

  function setValue4(businessObject, prefix, typeName, property, element, values) {
    var b_obj = getBusinessObject(element);
    var selectedValues = {};
    selectedValues = values;
    prop[_id] = selectedValues[_id];
    var selectedName = dropdownOptions[parseInt(prop[_id])].name;
    var bo = cmdHelper.updateBusinessObject(element, b_obj, prop);

    var selectedInputParameter = bpmnFactory.create('camunda:InputParameter', {
      name: selectedName,
      value: prop[_id]
    });      

    var inputOutput = bpmnFactory.create('camunda:InputOutput', {
      inputParameters: [selectedInputParameter]
    });  
    b_obj.extensionElements = b_obj.extensionElements || bpmnFactory.create('bpmn:ExtensionElements');
    b_obj.extensionElements.get('values').push(inputOutput);
   
    return bo;
  }

  
  const setValue2 = function (businessObject, prefix, typeName, property, element, values) {
    let prefixTypeElement = prefix + ":" + typeName;
  
    var b_obj = getBusinessObject(element);
    var inputOutput = bpmnFactory.create(prefixTypeElement, {
      values
    }); 
    b_obj.extensionElements = b_obj.extensionElements || bpmnFactory.create('bpmn:ExtensionElements');
    b_obj.extensionElements.get('values').push(inputOutput);
   
    return bo;

  }

  const setValue3 = function (businessObject, prefix, typeName, property) {
    return function (element, values) {
      let prefixTypeElement = prefix + ":" + typeName;
    
      const moddle = window.bpmnjs.get('moddle');
      const modeling = window.bpmnjs.get('modeling');
      let newExtensionElements = businessObject.extensionElements || moddle.create('bpmn:ExtensionElements');

      let relativeConstraint = moddle.create(prefixTypeElement);
      newExtensionElements.get('values').push(relativeConstraint);
      newExtensionElements[property] = values[property];
      modeling.updateProperties(element, { extensionElements: newExtensionElements });
      return getBusinessObject(element);
    }
  }
  

  const setValue_isTrueBranch = function (businessObject, prefix, typeName, property) {
    return function (element, values) {
      const moddle = window.bpmnjs.get('moddle');
      const eventBus = window.bpmnjs.get('eventBus');
      const modeling = window.bpmnjs.get('modeling');


      let prefixTypeElement = "tempcon:" + typeName;


      const extensionElements = element.businessObject.extensionElements || moddle.create('bpmn:ExtensionElements');
      let analysisDetails = getExtensionElement(element.businessObject, prefixTypeElement);

      if (!analysisDetails) {
        analysisDetails = moddle.create(prefixTypeElement);
      
        extensionElements.get('values').push(analysisDetails);
      }

      analysisDetails[property] =  values[property];
      modeling.updateProperties(element, {
            extensionElements,
            name:values[property].charAt(0).toUpperCase() + values[property].slice(1)
          });
      
    }
  }
  
  const setValue = function (businessObject, prefix, typeName, property) {
    return function (element, values) {
      const moddle = window.bpmnjs.get('moddle');
      const eventBus = window.bpmnjs.get('eventBus');
      const modeling = window.bpmnjs.get('modeling');


      let prefixTypeElement = "tempcon:" + typeName;


      const extensionElements = element.businessObject.extensionElements || moddle.create('bpmn:ExtensionElements');
      let analysisDetails = getExtensionElement(element.businessObject, prefixTypeElement);

      if (!analysisDetails) {
        analysisDetails = moddle.create(prefixTypeElement);
      
        extensionElements.get('values').push(analysisDetails);
      }

      analysisDetails[property] =  values[property];
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




  const setValue6 = function (businessObject, prefix, typeName, property) {
    return function (element, values) {
      let newMailElement;
      let prefixTypeElement = prefix + ":" + typeName;

      const moddle = window.bpmnjs.get('moddle');
      const modeling = window.bpmnjs.get('modeling');
      const eventBus = window.bpmnjs.get('eventBus');

      if (
        !businessObject.get("extensionElements") &&
        !extHelper.getExtensionElements(businessObject, prefixTypeElement)
      ) {
        newMailElement = elementHelper.createElement(
          prefixTypeElement,
          values,
          businessObject,
          bpmnFactory
        );
        let extensionAddResult = extHelper.addEntry(
          businessObject,
          element,
          newMailElement,
          bpmnFactory
        );
        return cmdHelper.updateBusinessObject(
          element,
          getBusinessObject(element),
          extensionAddResult
        );
      } else {
        let extensionElements = extHelper.getExtensionElements(
          businessObject,
          prefixTypeElement
        );
        if (extensionElements && extensionElements.length > 0) {
          extensionElements[0][property] = values[property];
          // return cmdHelper.updateBusinessObject(
          //   element,
          //   getBusinessObject(element),
          //   extensionElements
          // );
          // modeling.updateProperties(element, { extensionElements:extensionElements });
          eventBus.fire('element.changed', { element: element });
        } else {
          newMailElement = elementHelper.createElement(
            prefixTypeElement,
            values,
            businessObject,
            bpmnFactory
          );
          // return extHelper.addEntry(
          //   businessObject,
          //   element,
          //   newMailElement,
          //   bpmnFactory
          // );
          //TODO first time the value is not saved
          
          let newExtensionElements = businessObject.extensionElements || moddle.create('bpmn:ExtensionElements');

          let relativeConstraint = moddle.create(prefixTypeElement);
          newExtensionElements.get('values').push(relativeConstraint);
          newExtensionElements[property] = values[property];
          modeling.updateProperties(element, { extensionElements: newExtensionElements });
          // eventBus.fire('element.changed', { element: element });
          
        }
      }
    };
  };



  function set_group_minDuration(group, comparisonFunction, strComment = "") {
    group.entries.push(entryFactory.textField(translate, {
      id: 'minDuration',
      description: 'Min duration  (Integer value)',
      label: 'Min duration' + strComment,
      modelProperty: 'minDuration',
      validate: comparisonFunction,
      get: getValue(getBusinessObject(element), "tempcon", "TDuration", "minDuration"),
      set: setValue(getBusinessObject(element), "tempcon", "TDuration", "minDuration")
      
    }));
  }

  function set_group_maxDuration(group, comparisonFunction, strComment = "") {
    group.entries.push(entryFactory.textField(translate, {
      id: 'maxDuration',
      description: 'Max duration (Integer value)',
      label: 'Max duration' + strComment,
      modelProperty: 'maxDuration',
      validate: comparisonFunction,
      get: getValue(getBusinessObject(element), "tempcon", "TDuration", "maxDuration"),
      set: setValue(getBusinessObject(element), "tempcon", "TDuration", "maxDuration")
    }));
  }


  function set_group_propositionalLabel(group, disabled) {

    if (disabled === undefined)
      disabled = true;
    else
      disabled = false;
    group.entries.push(entryFactory.textField(translate, {
      id: 'propositionalLabel',
      description: 'Label created with propositions of XORs',
      label: 'Propositional label',
      modelProperty: 'propositionalLabel',
      get: getValue(getBusinessObject(element),  "tempcon", "TDuration", "propositionalLabel"),
      set: setValue(getBusinessObject(element),  "tempcon", "TDuration", "propositionalLabel")
      // disabled: function () { return disabled; }
    }));
  }

  
  function set_group_minDuration_asProperty(group, comparisonFunction, strComment = "") {
    group.entries.push(entryFactory.textField(translate, {
      id: 'minDuration',
      description: 'Min duration  (Integer value)',
      label: 'Min duration' + strComment,
      modelProperty: 'minDuration',
      validate: comparisonFunction
      
    }));
  }

  function set_group_maxDuration_asProperty(group, comparisonFunction, strComment = "") {
    group.entries.push(entryFactory.textField(translate, {
      id: 'maxDuration',
      description: 'Max duration (Integer value)',
      label: 'Max duration' + strComment,
      modelProperty: 'maxDuration',
      validate: comparisonFunction
    }));
  }


  function set_group_propositionalLabel_asProperty(group, disabled) {

    if (disabled === undefined)
      disabled = true;
    else
      disabled = false;
    group.entries.push(entryFactory.textField(translate, {
      id: 'propositionalLabel',
      description: 'Label created with propositions of XORs',
      label: 'Propositional label',
      modelProperty: 'propositionalLabel'
      // disabled: function () { return disabled; }
    }));
  }



  if (is(element, 'bpmn:SequenceFlow')) {
    group.entries.push(entryFactory.label({
      id: 'fromLabel',
      description: 'From element',
      modelProperty: 'fromLabel',
      labelText: 'From: ' + element.businessObject.sourceRef.id
    }));
    group.entries.push(entryFactory.label({
      id: 'toLabel',
      description: 'To element',
      modelProperty: 'toLabel',
      labelText: 'To: ' + element.businessObject.targetRef.id
    }));
 
    set_group_minDuration(group, validateMinDuration_sequenceFlow, " (default: 0)");
    set_group_maxDuration(group, validateMaxDuration_sequenceFlow, " (default: ∞)");
    
    // if (element.businessObject.sourceRef.$type.includes('ExclusiveGateway')) {
    //   if (element.businessObject.sourceRef.gatewaySplitJoin === 'split') {
      // debugger
    if (element.businessObject.sourceRef.$type.includes('ExclusiveGateway')) {      
      if (getExtensionElementValue(element.businessObject.sourceRef, 'TGatewaySplitJoin', 'gatewaySplitJoin') === 'split') {
        group.entries.push(entryFactory.selectBox(translate, {
          id: 'isTrueBranch',
          description: 'Select the value true or false',
          label: 'Value',
          modelProperty: 'isTrueBranch',
          // Default configuration, the property is not created id it does not change/click
          // TODO force to create the property in the XML file
          get: getValue(getBusinessObject(element), "tempcon", "TPLiteralValue", "isTrueBranch"),
          set: setValue_isTrueBranch(getBusinessObject(element), "tempcon", "TPLiteralValue", "isTrueBranch"),
          selectOptions: [{ name: '', value: '' }, { name: 'True', value: 'true' }, { name: 'False', value: 'false' }]
          
        }));
      }
    }
  }


  // ---------------------------- Events -------------------------
  if (is(element, 'bpmn:IntermediateCatchEvent')) {
    if (element.businessObject.eventDefinitions.length > 0) {
      // For IntermediateCatchEvent
      let strOptions = ['bpmn:MessageEventDefinition', 'bpmn:SignalEventDefinition'];
      // TODO Check if eventDefinitions can have more than 1 element     
      if (strOptions.includes(element.businessObject.eventDefinitions[0].$type)) {
        set_group_minDuration(group, validateMinDuration_contingent);
        set_group_maxDuration(group, validateMaxDuration_contingent);
        set_group_propositionalLabel(group);
      }
      // bpmn:TimerEventDefinition  it is different, minDuration is the same as maxDuration
      strOptions = ['bpmn:TimerEventDefinition'];
      // TODO check bpmn:TimerEventDefinition  it is different                      
      if (strOptions.includes(element.businessObject.eventDefinitions[0].$type)) {
        // set_group_minDuration(group, validateMinDuration_contingent);
        set_group_maxDuration(group, validateMaxDuration_contingent);
        set_group_propositionalLabel(group);
      }
    }
  }

  if (is(element, 'bpmn:UserTask') ||
    is(element, 'bpmn:ServiceTask') ||
    is(element, 'bpmn:ScriptTask') ||
    is(element, 'bpmn:SendTask') ||
    is(element, 'bpmn:ReceiveTask')) {

    set_group_minDuration(group, validateMinDuration_contingent);
    set_group_maxDuration(group, validateMaxDuration_contingent);
    set_group_propositionalLabel(group);
  }

  if (is(element, 'bpmn:ExclusiveGateway')) {

    set_group_minDuration(group, validateMinDuration_noContingent);
    set_group_maxDuration(group, validateMaxDuration_noContingent);

    // Moved to tab General 
    // group.entries.push(entryFactory.selectBox(translate, {
    //   id: 'gatewaySplitJoin',
    //   description: 'Set the Gateway as XOR Split or XOR Join',
    //   label: 'Type of XOR',
    //   modelProperty: 'gatewaySplitJoin',
    //   // Default configuration, the property is not created id it does not change/click
    //   // TODO force to create the property in the XML file
    //   selectOptions: [{ name: '', value: '' }, { name: 'Split', value: 'split' }, { name: 'Join', value: 'join' }],
    // }));
    
    // if (element.businessObject.gatewaySplitJoin == 'split') {
      
    if (getValue(getBusinessObject(element),  "tempcon", "TGatewaySplitJoin", "gatewaySplitJoin")(element)['gatewaySplitJoin'] == 'split') {
      group.entries.push(entryFactory.textField(translate, {
        id: 'observedProposition',
        description: 'Type one letter to be used as proposition',
        label: 'Letter representing the boolean condition',
        modelProperty: 'observedProposition',
        get: getValue(getBusinessObject(element),  "tempcon", "TXorProposition", "observedProposition"),
        set: setValue(getBusinessObject(element),  "tempcon", "TXorProposition", "observedProposition")
      }));
    }

    set_group_propositionalLabel(group);
  }


  if (is(element, 'bpmn:ParallelGateway')) { //||

    set_group_minDuration(group, validateMinDuration_noContingent);
    set_group_maxDuration(group, validateMaxDuration_noContingent);

    // Moved to tab General 
    // group.entries.push(entryFactory.selectBox(translate, {
    //   id: 'gatewaySplitJoin',
    //   description: 'Set the Gateway as XOR Split or XOR Join',
    //   label: 'Type of AND',
    //   modelProperty: 'gatewaySplitJoin',
    //   // Default configuration, the property is not created id it does not change/click
    //   // TODO force to create the property in the XML file
    //   selectOptions: [{ name: '', value: '' }, { name: 'Split', value: 'split' }, { name: 'Join', value: 'join' }],

    // }));

    set_group_propositionalLabel(group);

  }



  // ---------- RelativeConstraint ------------
  if (is(element, 'custom:connection')) {

    group.entries.push(entryFactory.label({
      id: 'lblRelativeConstraintFrom',
      labelText: 'From: ' + element.businessObject.source
    }));
    group.entries.push(entryFactory.selectBox(translate, {
      id: 'From',
      description: 'Select the start or end of the element',
      label: 'Connected from',
      modelProperty: 'From',
      // Default configuration, the property is not created id it does not change/click
      // TODO force to create the property in the XML file
      selectOptions: [{ name: 'End', value: 'end' }, { name: 'Start', value: 'start' }]
    }));


    group.entries.push(entryFactory.label({
      id: 'lblRelativeConstraintTo',
      labelText: 'To: ' + element.businessObject.target
    }));
    group.entries.push(entryFactory.selectBox(translate, {
      id: 'To',
      description: 'Select the start or end of the element',
      label: 'Connected to',
      modelProperty: 'To',
      // Default configuration, the property is not created id it does not change/click
      // TODO force to create the property in the XML file
      selectOptions: [{ name: 'Start', value: 'start' }, { name: 'End', value: 'end' }]
    }));

    set_group_minDuration_asProperty(group, validateMinDuration_relativeConstraint, " (default: 0)");
    set_group_maxDuration_asProperty(group, validateMaxDuration_relative, " (default: ∞)");

    set_group_propositionalLabel_asProperty(group, false);

  }

}