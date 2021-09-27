import entryFactory from 'bpmn-js-properties-panel/lib/factory/EntryFactory';
import extHelper from "bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper";

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
        if (extensions.length > 0) {
          returnObject[property] = extensions[0][property];
        }
      }
      return returnObject;
    };
  };

  const setValue = function (businessObject, prefix, typeName, property) {
    return function (element, values) {
      const moddle = window.bpmnjs.get('moddle');
      const modeling = window.bpmnjs.get('modeling');

      let prefixTypeElement = "tempcon:" + typeName;

      const extensionElements = element.businessObject.extensionElements || moddle.create('bpmn:ExtensionElements');
      let analysisDetails = getExtensionElement(element.businessObject, prefixTypeElement);

      if (!analysisDetails) {
        analysisDetails = moddle.create(prefixTypeElement);

        extensionElements.get('values').push(analysisDetails);
      }

      analysisDetails[property] = values[property];
      modeling.updateProperties(element, {
        extensionElements
      });
    };
  };

  function getExtensionElement(element, type) {
    if (!element.extensionElements) {
      return;
    }

    return element.extensionElements.values.filter((extensionElement) => {
      return extensionElement.$instanceOf(type);
    })[0];
  }

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
      disabled: function () { return true; },
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
      disabled: function () { return true; }
    }));
  }
}