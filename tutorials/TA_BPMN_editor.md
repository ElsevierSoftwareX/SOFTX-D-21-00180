<!-- # TimeAwareBPMN-editor -->

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
The temporal properties, like `cstnu:minDuration`, will be persisted as an extension as part of the BPMN 2.0 document:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions ... xmlns:cstnu="http://cstnu" id="sample-diagram">
  <bpmn2:process id="Process_1">
    <bpmn2:userTask id="StartEvent_1" cstnu:minDuration="2" />
  </bpmn2:process>
  ...
</bpmn2:definitions>
```

### Inter-task constraint

We created a custom connection called `inter-task` that sets temporal constraints between any pair of elements in the diagram. These relative constraints are a general concept in temporal verification methods, but they are not part of the BPMN standard. Because of this, we implemented it as a custom object independent of the BPMN model. It is kept in a different file and can be used to generate temporal constraints models.  
The editor loads and saves files with the information of the inter-tasks.

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
