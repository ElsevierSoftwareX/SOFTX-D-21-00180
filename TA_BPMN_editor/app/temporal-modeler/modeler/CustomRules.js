import {
  reduce
} from 'min-dash';

import inherits from 'inherits';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';
import { isAny } from 'bpmn-js/lib/features/modeling/util/ModelingUtil';

var HIGH_PRIORITY = 1500;


function isCustom(element) {
  return element && /^custom:/.test(element.type);
}

/**
 * Specific rules for custom elements
 */
export default function CustomRules(eventBus) {
  RuleProvider.call(this, eventBus);
}

inherits(CustomRules, RuleProvider);

CustomRules.$inject = ['eventBus'];


CustomRules.prototype.init = function () {

  /**
   * Can shape be created on target container?
   */
  function canCreate(shape, target) {

    // only judge about custom elements
    if (!isCustom(shape)) {
      return;
    }

    // allow creation on processes
    return is(target, 'bpmn:Process') || is(target, 'bpmn:Participant') || is(target, 'bpmn:Collaboration');
  }

  /**
   * Can source and target be connected?
   */
  function canConnect(source, target) {

    // // only judge about custom elements
    // if (!isCustom(source) && !isCustom(target)) {
    //   return;
    // }

    if (window.creatingIntertask) {
      // debugger;
      // window.creatingIntertask = undefined;
      // console.log('Creating intertask ');
      // return { type: 'custom:connection' };
    
    
      // return { type: 'custom:connection' };



      // allow connection between tasks
      let allowedElements = ['bpmn:UserTask','bpmn:ServiceTask','bpmn:ScriptTask','bpmn:SendTask','bpmn:ReceiveTask','bpmn:ExclusiveGateway','bpmn:ParallelGateway','bpmn:IntermediateCatchEvent','bpmn:StartEvent','bpmn:EndEvent']
      if (isAny(source, allowedElements)) {
        if (isAny(target, allowedElements)) {
          return { type: 'custom:connection' };
        } else {
          return false;
        }
      } else if (isAny(target, allowedElements)) {
        if (isAny(source, allowedElements)) {
          return { type: 'custom:connection' };
        } else {
          return false;
        }
      }

    }
  }

  this.addRule('elements.move', HIGH_PRIORITY, function (context) {

    var target = context.target,
      shapes = context.shapes;

    var type;

    // do not allow mixed movements of custom / BPMN shapes
    // if any shape cannot be moved, the group cannot be moved, too
    var allowed = reduce(shapes, function (result, s) {
      if (type === undefined) {
        type = isCustom(s);
      }

      if (type !== isCustom(s) || result === false) {
        return false;
      }

      return canCreate(s, target);
    }, undefined);

    // reject, if we have at least one
    // custom element that cannot be moved
    return allowed;
  });

  this.addRule('shape.create', HIGH_PRIORITY, function (context) {
    var target = context.target,
      shape = context.shape;

    return canCreate(shape, target);
  });

  this.addRule('shape.resize', HIGH_PRIORITY, function (context) {
    var shape = context.shape;

    if (isCustom(shape)) {
      // cannot resize custom elements
      return false;
    }
  });

  this.addRule('connection.create', HIGH_PRIORITY, function (context) {
    var source = context.source,
      target = context.target;
    // debugger;
    return canConnect(source, target);
  });

  this.addRule('connection.reconnectStart', HIGH_PRIORITY, function (context) {
    var connection = context.connection,
      source = context.hover || context.source,
      target = connection.target;
    // debugger;

    return canConnect(source, target, connection);
  });

  this.addRule('connection.reconnectEnd', HIGH_PRIORITY, function (context) {
    var connection = context.connection,
      source = connection.source,
      target = context.hover || context.target;

    return canConnect(source, target, connection);
  });

};
