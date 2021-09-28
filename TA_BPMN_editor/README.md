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
<bpmn2:definitions ...  xmlns:tempcon="https://gitlab.com/univr.di/TimeAwareBPMN/-/tree/main/ TABPMN20.xsd" id="sample-diagram">
  <bpmn2:userTask id="T3" name="Accept Cash (T3)">
      <bpmn2:extensionElements>
        <tempcon:tTask>
          <tempcon:tDuration>
            <tempcon:minDuration>1</tempcon:minDuration>
            <tempcon:maxDuration>6</tempcon:maxDuration>
            <tempcon:propositionalLabel>¬R</tempcon:propositionalLabel>
          </tempcon:tDuration>
        </tempcon:tTask>
      </bpmn2:extensionElements>
      <bpmn2:incoming>Flow_1t58voa</bpmn2:incoming>
      <bpmn2:outgoing>Flow_1h69eb3</bpmn2:outgoing>
    </bpmn2:userTask>
  ...
</bpmn2:definitions>
```

### Relative constraint

We created a custom connection that sets relative temporal constraints between any pair of elements in the diagram.<br>
A relative constraint limits the temporal distance between two elements: A ---[1,10]---> B means that, during an execution, the activity B must start/end (according to the specification of the relative constraint) between 1 and 10 units time after the start/end of A.

The attributes and elements of relative constraint elements are: type ("custom:connection"), id_relativeCostraint, waypoints, target, From (default: end), To (default: start), and an element tDuration with elements minDuraion, maxDuration and propositionalLabel. 
We save the realtive constraints as extension element of the element where the connection starts. This is an example of a relative constraint. 

```xml
<bpmn2:extensionElements>
	<tempcon:relativeCostraint type="custom:connection" id_relativeConstraint="RelativeConstraint_2v93" waypoints="[{&#34;x&#34;:220,&#34;y&#34;:220},{&#34;x&#34;:220,&#34;y&#34;:420},{&#34;x&#34;:960,&#34;y&#34;:420},{&#34;x&#34;:960,&#34;y&#34;:220}]">
		<tempcon:target>T4</tempcon:target>
		<tempcon:tDuration>
			<tempcon:minDuration>2</tempcon:minDuration>
			<tempcon:maxDuration>31</tempcon:maxDuration>
			<tempcon:propositionalLabel>U</tempcon:propositionalLabel>
		</tempcon:tDuration>
		<tempcon:From>start</tempcon:From>
		<tempcon:To>end</tempcon:To>
	</tempcon:relativeCostraint>
</bpmn2:extensionElements>
```


### Toolbar to select the verification tool

The toolbar present in the low part of the editor allows a user to select the plug-in to use for *verifying* the temporal constraints.

## License

MIT
