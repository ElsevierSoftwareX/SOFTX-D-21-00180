import entryFactory from 'bpmn-js-properties-panel/lib/factory/EntryFactory';

import {
  is
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
var validateMinDuration_intertask = function (element, values, node) {
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
  let valMinDuration = element.businessObject.minDuration;

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
  let valMinDuration = element.businessObject.minDuration;

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

export default function (group, element, translate) {

  function set_group_minDuration(group, comparisonFunction, strComment = "") {
    group.entries.push(entryFactory.textField(translate, {
      id: 'minDuration',
      description: 'Min duration  (Integer value)',
      label: 'Min duration' + strComment,
      modelProperty: 'minDuration',
      validate: comparisonFunction
    }));
  }

  function set_group_maxDuration(group, comparisonFunction, strComment = "") {
    group.entries.push(entryFactory.textField(translate, {
      id: 'maxDuration',
      description: 'Max duration (Integer value)',
      label: 'Max duration' + strComment,
      modelProperty: 'maxDuration',
      validate: comparisonFunction
    }));
  }


  function set_group_propositionalLabel(group, disabled) {
    
    if(disabled===undefined)
      disabled = true;
    else 
      disabled = false;
    group.entries.push(entryFactory.textField(translate, {
      id: 'propositionalLabel',
      description: 'Label created with propositions of XORs',
      label: 'Propositional label',
      modelProperty: 'propositionalLabel', 
      disabled: function(){ return disabled;}
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
    //     group.entries.push(entryFactory.selectBox(translate, {
    //       id: 'isTrueBranch',
    //       description: 'Select the value true or false',
    //       label: 'Value',
    //       modelProperty: 'isTrueBranch',
    //       // Default configuration, the property is not created id it does not change/click
    //       // TODO force to create the property in the XML file
    //       selectOptions: [{ name: '', value: '' }, { name: 'True', value: 'true' }, { name: 'False', value: 'false' }]
    //     }));
    //   }
    // }
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

    if (element.businessObject.gatewaySplitJoin == 'split') {
      group.entries.push(entryFactory.textField(translate, {
        id: 'observedProposition',
        description: 'Type one letter to be used as proposition',
        label: 'Letter representing the boolean condition',
        modelProperty: 'observedProposition'
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



  // ---------- Intertask ------------
  if (is(element, 'custom:connection')) {

    group.entries.push(entryFactory.label({
      id: 'lblIntertaskFrom',
      labelText: 'From: ' + element.businessObject.source
    }));
    group.entries.push(entryFactory.selectBox(translate, {
      id: 'intertaskConnFrom',
      description: 'Select the start or end of the element',
      label: 'Connected from',
      modelProperty: 'intertaskConnFrom',
      // Default configuration, the property is not created id it does not change/click
      // TODO force to create the property in the XML file
      selectOptions: [{ name: 'End', value: 'end' }, { name: 'Start', value: 'start' }]
    }));


    group.entries.push(entryFactory.label({
      id: 'lblIntertaskTo',
      labelText: 'To: ' + element.businessObject.target
    }));
    group.entries.push(entryFactory.selectBox(translate, {
      id: 'intertaskConnTo',
      description: 'Select the start or end of the element',
      label: 'Connected to',
      modelProperty: 'intertaskConnTo',
      // Default configuration, the property is not created id it does not change/click
      // TODO force to create the property in the XML file
      selectOptions: [{ name: 'Start', value: 'start' }, { name: 'End', value: 'end' }]
    }));

    set_group_minDuration(group, validateMinDuration_intertask, " (default: 0)");
    set_group_maxDuration(group, validateMaxDuration_sequenceFlow, " (default: ∞)");

    set_group_propositionalLabel(group, false);

  }

}