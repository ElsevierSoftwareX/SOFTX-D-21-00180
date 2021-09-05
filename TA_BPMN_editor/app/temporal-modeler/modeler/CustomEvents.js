

import { is } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";


export default function CustomEvents(eventBus, commandStack, elementRegistry) {

  // catch change event on properties panel
  eventBus.on('propertiesPanel.changed', (event) => {
    var currentElement = event.current.element;

    if (is(currentElement, "bpmn:ExclusiveGateway")) {
      if (currentElement.businessObject.outgoing != undefined) {
        for (let i = 0; i < currentElement.businessObject.outgoing.length; i++) {
          let outgoingElemnet = currentElement.businessObject.outgoing[i];
          let targetElement = elementRegistry.get(outgoingElemnet.id);
          eventBus.fire('element.changed', { element: targetElement });
        }
      }
    }

    if (is(currentElement, 'bpmn:IntermediateCatchEvent')) {
      if (currentElement.businessObject.eventDefinitions.length > 0) {
        let strOptions = ['bpmn:TimerEventDefinition'];
        if (strOptions.includes(currentElement.businessObject.eventDefinitions[0].$type)) {
          //Update element in BPMN
          let tempElement = window.bpmnjs.get('elementRegistry').get(currentElement.businessObject.id);
          if (tempElement.businessObject.maxDuration) {
            tempElement.businessObject.minDuration = tempElement.businessObject.maxDuration;
            try {
              eventBus.fire('element.changed', { element: tempElement });

            } catch (error) {
              console.log('Error when fire element.changed ' + tempElement.businessObject.id);
            }

          }
        }
      }
    }


  });


  eventBus.on('tempcon.changed', (event) => {
    var currentElement = event.element;

    if (is(currentElement, "bpmn:ParallelGateway")) {
      if (currentElement.businessObject.incoming != undefined) {
        for (let i = 0; i < currentElement.businessObject.incoming.length; i++) {
          let incomingElement = currentElement.businessObject.incoming[i];
          let targetElement = elementRegistry.get(incomingElement.id);
          if (targetElement) {
            try {
              eventBus.fire('element.changed', { element: targetElement });

            } catch (error) {
              console.log('Error when fire element.changed ' + incomingElement.id);
            }
          }
        }
      }
    }

  });

}

CustomEvents.$inject = ['eventBus', 'commandStack', 'elementRegistry'];
