/**
 * This module controles the options showed in the tool 'replace' (screw wrench) in the context menu
 */


// Elements not mapped to the CSTNU are removed
export var START_EVENT = [
    {
        label: 'Start Event',
        actionName: 'replace-with-none-start',
        className: 'bpmn-icon-start-event-none',
        target: {
            type: 'bpmn:StartEvent'
        }
    }
];

export var START_EVENT_SUB_PROCESS = [
    {
        label: 'Start Event',
        actionName: 'replace-with-none-start',
        className: 'bpmn-icon-start-event-none',
        target: {
            type: 'bpmn:StartEvent'
        }
    },
    {
        label: 'Intermediate Throw Event',
        actionName: 'replace-with-none-intermediate-throwing',
        className: 'bpmn-icon-intermediate-event-none',
        target: {
            type: 'bpmn:IntermediateThrowEvent'
        }
    },
    {
        label: 'End Event',
        actionName: 'replace-with-none-end',
        className: 'bpmn-icon-end-event-none',
        target: {
            type: 'bpmn:EndEvent'
        }
    }
];

export var INTERMEDIATE_EVENT = [

    {
        label: 'Intermediate Throw Event',
        actionName: 'replace-with-none-intermediate-throw',
        className: 'bpmn-icon-intermediate-event-none',
        target: {
            type: 'bpmn:IntermediateThrowEvent'
        }
    },
    {
        label: 'Message Intermediate Catch Event',
        actionName: 'replace-with-message-intermediate-catch',
        className: 'bpmn-icon-intermediate-event-catch-message',
        target: {
            type: 'bpmn:IntermediateCatchEvent',
            eventDefinitionType: 'bpmn:MessageEventDefinition'
        }
    },
    // {
    //     label: 'Timer Intermediate Catch Event',
    //     actionName: 'replace-with-timer-intermediate-catch',
    //     className: 'bpmn-icon-intermediate-event-catch-timer',
    //     target: {
    //         type: 'bpmn:IntermediateCatchEvent',
    //         eventDefinitionType: 'bpmn:TimerEventDefinition'
    //     }
    // },
    {
        label: 'Signal Intermediate Catch Event',
        actionName: 'replace-with-signal-intermediate-catch',
        className: 'bpmn-icon-intermediate-event-catch-signal',
        target: {
            type: 'bpmn:IntermediateCatchEvent',
            eventDefinitionType: 'bpmn:SignalEventDefinition'
        }
    },
    {
        label: 'Message Intermediate Throw Event',
        actionName: 'replace-with-message-intermediate-throw',
        className: 'bpmn-icon-intermediate-event-throw-message',
        target: {
            type: 'bpmn:IntermediateThrowEvent',
            eventDefinitionType: 'bpmn:MessageEventDefinition'
        }
    },
    {
        label: 'Signal Intermediate Throw Event',
        actionName: 'replace-with-signal-intermediate-throw',
        className: 'bpmn-icon-intermediate-event-throw-signal',
        target: {
            type: 'bpmn:IntermediateThrowEvent',
            eventDefinitionType: 'bpmn:SignalEventDefinition'
        }
    }
];

export var END_EVENT = [
    {
        label: 'Message End Event',
        actionName: 'replace-with-message-end',
        className: 'bpmn-icon-end-event-message',
        target: {
            type: 'bpmn:EndEvent',
            eventDefinitionType: 'bpmn:MessageEventDefinition'
        }
    }
];

export var GATEWAY = [
    {
        label: 'Exclusive Gateway',
        actionName: 'replace-with-exclusive-gateway',
        className: 'bpmn-icon-gateway-xor',
        target: {
            type: 'bpmn:ExclusiveGateway'
        }
    },
    {
        label: 'Parallel Gateway',
        actionName: 'replace-with-parallel-gateway',
        className: 'bpmn-icon-gateway-parallel',
        target: {
            type: 'bpmn:ParallelGateway'
        }
    }
];

export var SUBPROCESS_EXPANDED = [
    {
        label: 'Transaction',
        actionName: 'replace-with-transaction',
        className: 'bpmn-icon-transaction',
        target: {
            type: 'bpmn:Transaction',
            isExpanded: true
        }
    },
    {
        label: 'Event Sub Process',
        actionName: 'replace-with-event-subprocess',
        className: 'bpmn-icon-event-subprocess-expanded',
        target: {
            type: 'bpmn:SubProcess',
            triggeredByEvent: true,
            isExpanded: true
        }
    },
    {
        label: 'Sub Process (collapsed)',
        actionName: 'replace-with-collapsed-subprocess',
        className: 'bpmn-icon-subprocess-collapsed',
        target: {
            type: 'bpmn:SubProcess',
            isExpanded: false
        }
    }
];

export var TRANSACTION = [
    {
        label: 'Sub Process',
        actionName: 'replace-with-subprocess',
        className: 'bpmn-icon-subprocess-expanded',
        target: {
            type: 'bpmn:SubProcess',
            isExpanded: true
        }
    },
    {
        label: 'Event Sub Process',
        actionName: 'replace-with-event-subprocess',
        className: 'bpmn-icon-event-subprocess-expanded',
        target: {
            type: 'bpmn:SubProcess',
            triggeredByEvent: true,
            isExpanded: true
        }
    }
];

export var EVENT_SUB_PROCESS = [
    {
        label: 'Sub Process',
        actionName: 'replace-with-subprocess',
        className: 'bpmn-icon-subprocess-expanded',
        target: {
            type: 'bpmn:SubProcess',
            isExpanded: true
        }
    },
    {
        label: 'Transaction',
        actionName: 'replace-with-transaction',
        className: 'bpmn-icon-transaction',
        target: {
            type: 'bpmn:Transaction',
            isExpanded: true
        }
    }
];

export var TASK = [
    {
        label: 'Send Task',
        actionName: 'replace-with-send-task',
        className: 'bpmn-icon-send',
        target: {
            type: 'bpmn:SendTask'
        }
    },
    {
        label: 'Receive Task',
        actionName: 'replace-with-receive-task',
        className: 'bpmn-icon-receive',
        target: {
            type: 'bpmn:ReceiveTask'
        }
    },
    {
        label: 'User Task',
        actionName: 'replace-with-user-task',
        className: 'bpmn-icon-user',
        target: {
            type: 'bpmn:UserTask'
        }
    },
    {
        label: 'Service Task',
        actionName: 'replace-with-service-task',
        className: 'bpmn-icon-service',
        target: {
            type: 'bpmn:ServiceTask'
        }
    },
    {
        label: 'Script Task',
        actionName: 'replace-with-script-task',
        className: 'bpmn-icon-script',
        target: {
            type: 'bpmn:ScriptTask'
        }
    }
];

export var BOUNDARY_EVENT = [
    {
        label: 'Message Boundary Event',
        actionName: 'replace-with-message-boundary',
        className: 'bpmn-icon-intermediate-event-catch-message',
        target: {
            type: 'bpmn:BoundaryEvent',
            eventDefinitionType: 'bpmn:MessageEventDefinition'
        }
    }
];

export var EVENT_SUB_PROCESS_START_EVENT = [
    {
        label: 'Message Start Event',
        actionName: 'replace-with-message-start',
        className: 'bpmn-icon-start-event-message',
        target: {
            type: 'bpmn:StartEvent',
            eventDefinitionType: 'bpmn:MessageEventDefinition'
        }
    }
];

export var SEQUENCE_FLOW = [
    {
        label: 'Sequence Flow',
        actionName: 'replace-with-sequence-flow',
        className: 'bpmn-icon-connection'
    },
    {
        label: 'Default Flow',
        actionName: 'replace-with-default-flow',
        className: 'bpmn-icon-default-flow'
    },
    {
        label: 'Conditional Flow',
        actionName: 'replace-with-conditional-flow',
        className: 'bpmn-icon-conditional-flow'
    }
];

export var PARTICIPANT = [
    {
        label: 'Expanded Pool',
        actionName: 'replace-with-expanded-pool',
        className: 'bpmn-icon-participant',
        target: {
            type: 'bpmn:Participant',
            isExpanded: true
        }
    },
    {
        label: function (element) {
            var label = 'Empty Pool';

            if (element.children && element.children.length) {
                label += ' (removes content)';
            }

            return label;
        },
        actionName: 'replace-with-collapsed-pool',

        // TODO(@janstuemmel): maybe design new icon
        className: 'bpmn-icon-lane',
        target: {
            type: 'bpmn:Participant',
            isExpanded: false
        }
    }
];