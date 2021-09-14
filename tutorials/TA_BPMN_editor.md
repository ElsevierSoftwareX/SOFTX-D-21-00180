# TimeAwareBPMN-editor

Implementation of a BPMN web editor extended to edit
time-aware BPMN processes. This is the client of the **TimeAwareBPMN-js** tool, a Node.JS application to perform temporal verifications of BPMN models.

## About

The **TimeAwareBPMN-editor** enables the edition of process models enriched with temporal constraints defined on BPMN elements. It contains a toolbar that allows the user to choose how to verify the process models with respect to their temporal constraints. 

This verification is done on the server-side of the tool TimeAwareBPMN-js. 
The tool was designed to be extended, by adding verification programs as plug-ins.
This version contains a plug-in that connects with the Java tool CSTNU to evaluate the dynamic controllability. 

This implementation is based on the examples: [properties-panel-extension with custom properties](https://github.com/bpmn-io/bpmn-js-examples/tree/master/properties-panel-extension) and [custom-elements](https://github.com/bpmn-io/bpmn-js-examples/tree/master/custom-elements).

### Editing temporal properties 

We extend the properties panel to allow editing `temporal properties` on BPMN elements. 
The temporal properties, like `tempcon:minDuration`, will be persisted as an extension as part of the BPMN 2.0 document:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions ... xmlns:tempcon="https://gitlab.com/univr.di/TimeAwareBPMN" id="sample-diagram">
  <bpmn2:process id="Process_1">
    <bpmn2:userTask id="StartEvent_1" tempcon:minDuration="2" />
  </bpmn2:process>
  ...
</bpmn2:definitions>
```

See an [example](examples/diagram.bpmn).


Here we list the enhanced elements and the added attributes with examples. 

|**Activities**| (User Task, Service Task, Script Task, Send Task, and Receive Task)|
|---|---|
Added attributes | minDuration (default: 0), maxDuration (default: Inf), and propositionalLabel
Example | `tempcon:minDuration="1" tempcon:maxDuration="6" tempcon:propositionalLabel="R"`|

|**Intermediate catching events**| (Timer, Message, and Signal)|
|---|---|
Added attributes | minDuration, maxDuration, and propositionalLabel
Example | `tempcon:minDuration="1" tempcon:maxDuration="4" tempcon:propositionalLabel="¬R"`|

|**Parallel gateways**| |
|---|---|
Added attributes | minDuration, maxDuration, propositionalLabel, and gatewaySplitJoin
| Example | `tempcon:minDuration="2" tempcon:maxDuration="4" tempcon:propositionalLabel="" tempcon:gatewaySplitJoin="split" ` |

|**Exclusive gateways**| |
|---|---|
Added attributes | minDuration, maxDuration, propositionalLabel, gatewaySplitJoin, and observedProposition|
| Example | `tempcon:minDuration="2" tempcon:maxDuration="4" tempcon:propositionalLabel="" tempcon:gatewaySplitJoin="split" tempcon:observedProposition="R" ` |

|**Sequence flow**| |
|---|---|
Added attributes | minDuration (default: 0), maxDuration (default: Inf), and isTrueBranch
| Example | `tempcon:minDuration="1" tempcon:maxDuration="2" tempcon:isTrueBranch="true"` |

### Relative constraint

We created a custom connection that sets relative temporal constraints between any pair of elements in the diagram. These relative constraints are a general concept in temporal verification methods. We implemented them as a custom objects and save them as extension elements in the BPMN model. 
The editor loads and saves BPMN XML files with the information of the relative constraints. 

The attributes of relative constraint elements are: type ("custom:connection"), id_relative, waypoints, source, target, From (default: end), To (default: start), and propositionalLabel. 
We save the realtive constraints as extension element of the element where the connection starts. This is an example of a relative constraint. 

```xml
<bpmn2:extensionElements>
	<tempcon:relative type = "custom:connection"
	id_relative = "RelativeConstraint_01" 	
	source = "T1" 
	target = "T4" 
	minDuration = "1" 
	maxDuration = "2" 
	propositionalLabel = "R" 
	From = "start"
	To = "end"
	waypoints = "[{&#34;x&#34;:220,&#34;y&#34;:220},
		{&#34;x&#34;:220,&#34;y&#34;:370},
		{&#34;x&#34;:560,&#34;y&#34;:370},
		{&#34;x&#34;:560,&#34;y&#34;:220}]" />
</bpmn2:extensionElements>
```

### Toolbar to select the verification tool

We created a toolbar that loads and exposes the plug-ins, that communicate with the corresponding plug-in in the server, which can interact with desktop applications to perform the verifications of the models. 

## Running the Example

The TimeAwareBPMN-editor is loaded by the TimeAwareBPMN-js tool. It is possible to execute it alone to edit models, but without performing the verification of temporal constraints. 

Install all required dependencies:

```
npm install
```

Build and run the project

```
npm run dev
```

## Troubleshooting

To build and run the project it is required `grunt`. For Windows this is not installed globally, which can be done with the command: 
```
npm install -g grunt-cli
```

## License

MIT
