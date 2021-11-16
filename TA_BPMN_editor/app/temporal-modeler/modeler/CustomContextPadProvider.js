/** temporal-modeler/modeler/CustomContextPadProvider
 * 
 * The contextPad is the set of icons that are shown when a element is selected.
 * This module modifies the contextPad to present the suported elements.
 * The main changes are:
 *     - Remove the task and event 
 *     - Add userTask and IntermediateCatchEvent with eventDefinitionType: 'bpmn:MessageEventDefinition'
 *     - Add relativeConstraint 
 * 
 */

import inherits from 'inherits';

import ContextPadProvider from 'bpmn-js/lib/features/context-pad/ContextPadProvider';

import {
  isAny
} from 'bpmn-js/lib/features/modeling/util/ModelingUtil';

import {
  assign,
  bind
} from 'min-dash';

export default function CustomContextPadProvider(injector, connect, translate, config, create, elementFactory) {

  injector.invoke(ContextPadProvider, this);

  this.create = create;
  this.elementFactory = elementFactory;
  this.translate = translate;
  if (config.autoPlace !== false) {
    this.autoPlace = injector.get('autoPlace', false);
  }

  var cached = bind(this.getContextPadEntries, this);

  this.getContextPadEntries = function (element) {
    const {
      autoPlace,
      create,
      elementFactory,
      translate
    } = this;

    var actions = cached(element);
    delete actions["append.append-task"];
    delete actions["append.intermediate-event"];

    var businessObject = element.businessObject;
    window.creatingRelativeConstraint = undefined;

    // To create a user task from the context menu
    function appendUserTask(event, element) {
      if (autoPlace) {
        const shape = elementFactory.createShape({ type: 'bpmn:UserTask' });

        autoPlace.append(element, shape);
      } else {
        appendUserTaskStart(event, element);
      }
    }

    function appendUserTaskStart(event) {
      const shape = elementFactory.createShape({ type: 'bpmn:UserTask' });

      create.start(event, shape, element);
    }
    // To create a intermediate event from the context menu
    function appendIntermediateEvent(event, element) {
      
      if (autoPlace){ 
        const shape = elementFactory.createShape(assign({ type: 'bpmn:IntermediateCatchEvent' }, { eventDefinitionType: 'bpmn:MessageEventDefinition' }));

        autoPlace.append(element, shape);
      } else {
        appendIntermediateEventStart(event, element);
      }
    }

    function appendIntermediateEventStart(event) {
      const shape = elementFactory.createShape(assign({ type: 'bpmn:IntermediateCatchEvent' }, { eventDefinitionType: 'bpmn:MessageEventDefinition' }));

      create.start(event, shape, element);
    }    

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
    if (isAny(businessObject, ['bpmn:Task', 'bpmn:Gateway', 'bpmn:IntermediateCatchEvent', 'bpmn:IntermediateThrowEvent', 'bpmn:StartEvent', 'bpmn:EndEvent']) && !element.labelTarget) {
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
    // To create a user task from the context menu of the specified objects
    if (isAny(businessObject, ['bpmn:Task', 'bpmn:Gateway', 'bpmn:IntermediateCatchEvent', 'bpmn:IntermediateThrowEvent', 'bpmn:StartEvent', 'bpmn:EndEvent']) && !element.labelTarget) {
      assign(actions, {
        'append.user-task': {
          group: 'model',
          className: 'bpmn-icon-user-task',
          title: translate('Append UserTask'),
          action: {
            click: appendUserTask,
            dragstart: appendUserTaskStart
          }
        }
      });
    }

    // To create a message intermediate cathc event from the context menu of the specified objects
    if (isAny(businessObject, ['bpmn:Task', 'bpmn:Gateway', 'bpmn:IntermediateCatchEvent', 'bpmn:IntermediateThrowEvent', 'bpmn:StartEvent', 'bpmn:EndEvent']) && !element.labelTarget) {
      assign(actions, {
        'append.intermediate-event': {
          group: 'model',
          className: 'bpmn-icon-intermediate-event-catch-message',
          title: translate('Append Intermediate/Boundary Event'),
          action: {
            click: appendIntermediateEvent,
            dragstart: appendIntermediateEventStart
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
  'translate',
  'config',
  'create',
  'elementFactory'
];