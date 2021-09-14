import inherits from 'inherits';

import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider';

import {
  isAny
} from 'bpmn-js/lib/features/modeling/util/ModelingUtil';

import {
  assign,
  bind
} from 'min-dash';


export default function CustomContextPadProvider(injector, connect, translate) {

  injector.invoke(ContextPadProvider, this);

  var cached = bind(this.getContextPadEntries, this);

  this.getContextPadEntries = function (element) {
    var actions = cached(element);

    var businessObject = element.businessObject;
    window.creatingRelativeConstraint = undefined;

    function startConnect(event, element, autoActivate) {
      window.creatingRelativeConstraint = true;
      connect.start(event, element, autoActivate);
    }
    if (isAny(businessObject, ['custom:triangle', 'custom:circle'])) {
      assign(actions, {
        'connect': {
          group: 'connect',
          className: 'bpmn-icon-connection-multi',
          title: translate('Connect using custom connection'),
          action: {
            click: startConnect,
            dragstart: startConnect
          }
        },
        // },
        // {
        'other': {
          group: 'connect',
          className: 'bpmn-icon-screw-wrench',
          title: translate('Other'),
          action: {
            click: startConnect,
            dragstart: startConnect
          }
        }
      });
    }
    if (isAny(businessObject, ['bpmn:Task', 'bpmn:Gateway', 'bpmn:IntermediateCatchEvent', 'bpmn:StartEvent', 'bpmn:EndEvent']) && !element.labelTarget) {
      assign(actions, {
        'relativeConstraint': {
          group: 'relativeConstraint',
          className: 'bpmn-icon-connection',
          title: translate('Connect using relativeConstraint'),
          action: {
            click: startConnect,
            dragstart: startConnect
          }
        }
      });
    }
    return actions;
  };
}

inherits(CustomContextPadProvider, ContextPadProvider);

CustomContextPadProvider.$inject = [
  'injector',
  'connect',
  'translate'
];