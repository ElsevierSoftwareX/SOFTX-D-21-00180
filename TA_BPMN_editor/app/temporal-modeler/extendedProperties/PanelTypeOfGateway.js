/** temporal-modeler/extendedProperties/PanelTypeOfGateway
 * 
 * Creates a field that is presented in the tab General of element Gateways with the information of Type of XOR,
 * The value presented is computed with the function window.bpmnjs.checkSplitJoin(element)  
 * 
 */
import entryFactory from 'bpmn-js-properties-panel/lib/factory/EntryFactory';

import {
  is, getBusinessObject
} from 'bpmn-js/lib/util/ModelUtil';

export default function (group, element, translate) {

  const getValue = function (businessObject, prefix, typeName, property) {
    return function (element) {
      let returnObject = {};
      returnObject[property] = window.bpmnjs.checkSplitJoin(element);
      return returnObject;
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
      disabled: function () { return true; },
    }));
  }

  if (is(element, 'bpmn:ParallelGateway')) { 

    group.entries.push(entryFactory.selectBox(translate, {
      id: 'gatewaySplitJoin',
      description: 'Set the Gateway as XOR Split or XOR Join',
      label: 'Type of AND',
      modelProperty: 'gatewaySplitJoin',
      // Default configuration, the property is not created id it does not change/click
      // TODO force to create the property in the XML file
      selectOptions: [{ name: '', value: '' }, { name: 'Split', value: 'split' }, { name: 'Join', value: 'join' }],
      get: getValue(getBusinessObject(element), "tempcon", "TGatewaySplitJoin", "gatewaySplitJoin"),
      disabled: function () { return true; }
    }));
  }
}