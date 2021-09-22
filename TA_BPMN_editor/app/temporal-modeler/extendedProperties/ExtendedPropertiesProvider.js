import inherits from "inherits";

// import PropertiesActivator from "bpmn-js-properties-panel/lib/PropertiesActivator";

// Require your custom property entries.
import temporalConstraintsFields from './PanelTemporalConstraints';
import typeOfGatewayFields from './PanelTypeOfGateway';

var LOW_PRIORITY = 500;


// Create the custom tab.
// The properties are organized in groups.
function createTemporalTabGroups(element, bpmnFactory, translate) {

  // Create a group called "Temporal Constraints".
  var temporalConstraintsGroup = {
    id: 'temporal-constraints',
    label: '', //'Temporal constraints',
    entries: []
  };

  // Add the fields (textbox, labels, etc) to the Temporal Constraints group.
  temporalConstraintsFields(temporalConstraintsGroup, element, bpmnFactory, translate);

  return [
    temporalConstraintsGroup
  ];
}

export default function TemporalConstraintsProvider(propertiesPanel, eventBus, bpmnFactory, translate) {

  // Register our custom temporal properties provider.
  // Use a lower priority to ensure it is loaded after the basic BPMN properties.
  propertiesPanel.registerProvider(LOW_PRIORITY, this);

  // PropertiesActivator.call(this, eventBus);


  this.getTabs = function (element) {
    return function (entries) {

      const generalTab = entries.find((e) => e.id === "general");
      const groups = generalTab.groups;

      // Add the "type of gateway" group to the general tab
      const typeOfGatewayGroup = {
        id: "type-of-gateway",
        label: "Type of gateway",
        entries: []
      };

      typeOfGatewayFields(typeOfGatewayGroup, element, translate);
      groups.push(typeOfGatewayGroup);


      // Add the "temporalConstraints" tab
      var temporalConstraintsTab = {
        id: 'temporalConstraints',
        label: 'Temporal Constraints',
        groups: createTemporalTabGroups(element, bpmnFactory, translate)
      };

      entries.push(temporalConstraintsTab);

      // Show general + "temporalConstraints" tab
      return entries;
    };
  };
}

TemporalConstraintsProvider.$inject = ['propertiesPanel', 'eventBus', 'bpmnFactory', 'translate'];
// inherits(TemporalConstraintsProvider, PropertiesActivator);