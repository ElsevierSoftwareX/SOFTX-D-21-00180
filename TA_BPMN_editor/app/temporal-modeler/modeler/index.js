/**
 * This module contains a custom modeler that renders elements with temporal constraints,
 * handeling the rules to create the relative constraint
 */
import CustomContextPadProvider from './CustomContextPadProvider';
import CustomElementFactory from './CustomElementFactory';
import CustomOrderingProvider from './CustomOrderingProvider';
import CustomPalette from './CustomPalette';
import CustomRenderer from './CustomRenderer';
import CustomRules from './CustomRules';
import CustomUpdater from './CustomUpdater';
import CustomReplaceMenuProvider from './CustomReplaceMenuProvider';
import CustomEvents from './CustomEvents';
import CustomReplaceConnectionBehavior from './CustomReplaceConnectionBehavior';

export default {
  __init__: [
    'contextPadProvider',
    'customOrderingProvider',
    'customRenderer',
    'customRules',
    'customUpdater',
    'customEvents',
    'paletteProvider',
    'replaceMenuProvider',
    'replaceConnectionBehavior'
  ],
  contextPadProvider: ['type', CustomContextPadProvider],
  customOrderingProvider: ['type', CustomOrderingProvider],
  customRenderer: ['type', CustomRenderer],
  customRules: ['type', CustomRules],
  customUpdater: ['type', CustomUpdater],
  elementFactory: ['type', CustomElementFactory],
  customEvents: ['type', CustomEvents],
  paletteProvider: ['type', CustomPalette],
  replaceMenuProvider: ['type', CustomReplaceMenuProvider],
  replaceConnectionBehavior: ['type', CustomReplaceConnectionBehavior]
};
