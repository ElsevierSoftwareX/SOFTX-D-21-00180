# TimeAwareBPMN-editor

Implementation of a BPMN web editor extended to edit
time-aware BPMN processes. This is the client of the **TimeAwareBPMN-js** tool, a Node.JS application to perform temporal verifications of BPMN models.

## About

The **TimeAwareBPMN-editor** enables the editing of process models enriched with temporal constraints defined on BPMN elements. It contains a toolbar that allows the user to choose how to verify the process models with respect to their temporal constraints. 

This verification is done in the server-side of the tool TimeAwareBPMN-js. 
The tool was designed to be extended, by adding verification programs as plug-ins.
This version contains a plug-in that connects with the Java tool CSTNU to evaluate the dynamic controllability. 

The base code of this editor is [bpmn-io](https://github.com/bpmn-io/).<br>
We realized the exstension considering the following patterns:
 1. [properties-panel-extension with custom properties](https://github.com/bpmn-io/bpmn-js-examples/tree/master/properties-panel-extension), and 
 2. [custom-elements](https://github.com/bpmn-io/bpmn-js-examples/tree/master/custom-elements).

### Editing temporal constraints 

We extend the properties panel to allow editing `temporal constraints` of BPMN elements. 
The temporal constraints, like `tempcon:minDuration`, are then stored as an extension element in the BPMN 2.0 document representing the model:

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

We created a custom connection that sets relative temporal constraints between any pair of elements in the diagram.<br>
A relative constraint limits the temporal distance between two elements: A ---[1,10]---> B means that, during an execution, the activity B must start/end (according to the specification of the relative constraint) between 1 and 10 units time after the start/end of A.

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

The toolbar present in the low part of the editor allows a user to select the plug-in to use for *verifying* the temporal constraints.

## License

MIT
