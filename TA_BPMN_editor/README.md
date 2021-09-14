# TimeAwareBPMN-editor

Implementation of a BPMN web editor extended to edit
time-aware BPMN processes. This is the client of the **TimeAwareBPMN-js** tool, a Node.JS application to perform temporal verifications of BPMN models.

## About

The **TimeAwareBPMN-editor** enables the edition of process models enriched with temporal constraints defined on BPMN elements. It contains a toolbar that allows the user to choose how to verify the process models with respect to their temporal constraints. 

This verification is done in the server-side of the tool TimeAwareBPMN-js. 
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


## License

MIT
