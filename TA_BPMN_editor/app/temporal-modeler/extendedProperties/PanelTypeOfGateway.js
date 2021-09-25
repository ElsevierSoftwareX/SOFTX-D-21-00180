import entryFactory from 'bpmn-js-properties-panel/lib/factory/EntryFactory';
import cmdHelper from "bpmn-js-properties-panel/lib/helper/CmdHelper";
import extHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";
import elementHelper from "bpmn-js-properties-panel/lib/helper/ElementHelper";


import {
  is, getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

export default function (group, element, translate) {

  
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

  
  const setValue = function (businessObject, prefix, typeName, property) {
    return function (element, values) {
      let newMailElement;
      let prefixTypeElement = prefix + ":" + typeName;
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
        if (extensionElements) {
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
          const moddle = window.bpmnjs.get('moddle');
          const modeling = window.bpmnjs.get('modeling');
          const eventBus = window.bpmnjs.get('eventBus');
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



  if (is(element, 'bpmn:ExclusiveGateway')) {

    group.entries.push(entryFactory.selectBox(translate, {
      id: 'gatewaySplitJoin',
      description: 'Set the Gateway as XOR Split or XOR Join',
      label: 'Type of XOR',
      modelProperty: 'gatewaySplitJoin',
      // Default configuration, the property is not created if it does not change/click
      // TODO force to create the property in the XML file
      selectOptions: [{ name: '', value: '' }, { name: 'Split', value: 'split' }, { name: 'Join', value: 'join' }],
      get: getValue(getBusinessObject(element), "tempcon", "TGatewaySplitJoin", "gatewaySplitJoin"),
      set: setValue(getBusinessObject(element), "tempcon", "TGatewaySplitJoin", "gatewaySplitJoin"),
      disabled: function(){ return true;},
    }));
  }


  if (is(element, 'bpmn:ParallelGateway')) { //||

    group.entries.push(entryFactory.selectBox(translate, {
      id: 'gatewaySplitJoin',
      description: 'Set the Gateway as XOR Split or XOR Join',
      label: 'Type of AND',
      modelProperty: 'gatewaySplitJoin',
      // Default configuration, the property is not created id it does not change/click
      // TODO force to create the property in the XML file
      selectOptions: [{ name: '', value: '' }, { name: 'Split', value: 'split' }, { name: 'Join', value: 'join' }],
      get: getValue(getBusinessObject(element), "tempcon", "TGatewaySplitJoin", "gatewaySplitJoin"),
      set: setValue(getBusinessObject(element), "tempcon", "TGatewaySplitJoin", "gatewaySplitJoin"),
      disabled: function(){ return true;}
    }));
  }

 

}