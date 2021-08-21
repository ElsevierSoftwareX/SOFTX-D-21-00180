// Require your custom property entries.
import spellProps from './PanelTemporalProperties';

var LOW_PRIORITY = 500;


// Create the custom tab.
// The properties are organized in groups.
function createTemporalTabGroups(element, translate) {

  // Create a group called "Temporal Constraints".
  var temporalConstraintsGroup = {
    id: 'temporal-constraints',
    label: 'Temporal constraints',
    entries: []
  };

  // Add the spell props to the Temporal Constraints group.
  spellProps(temporalConstraintsGroup, element, translate);

  return [
    temporalConstraintsGroup
  ];
}

export default function TemporalPropertiesProvider(propertiesPanel, translate) {

  // Register our custom temporal properties provider.
  // Use a lower priority to ensure it is loaded after the basic BPMN properties.
  propertiesPanel.registerProvider(LOW_PRIORITY, this);

  this.getTabs = function (element) {

    return function (entries) {

      // Add the "temporalProperties" tab
      var temporalPropertiesTab = {
        id: 'temporalProperties',
        label: 'Temporal Properties',
        groups: createTemporalTabGroups(element, translate)
      };

      entries.push(temporalPropertiesTab);

      // Show general + "temporalProperties" tab
      return entries;
    };
  };
}

TemporalPropertiesProvider.$inject = ['propertiesPanel', 'translate'];