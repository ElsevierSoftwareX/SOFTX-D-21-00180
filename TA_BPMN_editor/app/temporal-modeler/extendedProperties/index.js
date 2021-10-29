/**
 * This module contains the functionality to add a custom tab to the panel with the properties of the elements.
 * The definitions of the new properties to display are in the file temporalConstraints.json
 * File ExtendedPropertiesProvider.js adds the tab, PanelTemporalConstraints. js adds the fields to 
 * edit the properties. PanelTypeOfGateway.js adds the field 'Type of XOR' to the tab General of elements Gateway. 
 */

import TemporalConstraintsProvider from './ExtendedPropertiesProvider';

export default {
  __init__: ['temporalConstraintsProvider'],
  temporalConstraintsProvider: ['type', TemporalConstraintsProvider]
};