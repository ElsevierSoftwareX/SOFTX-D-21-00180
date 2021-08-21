# TimeAwareBPMN-js - Client-side plug-in

The TimeAwareBPMN-js - Client-side plug-ins prepare the BPMN models for the verification, send the data to the corresponding server-side plug-in, and receive and show the results.

## Entry point


The plug-ins are connected by a JavaScript object called `moduleInfo` that contains descriptive information and the functions exposed by the plug-in. The object `moduleInfo` of CSTNU plug-in is presented as an example. 

```
const moduleInfo = {
    name: `CSTNU',
    buttonFunctions: [
        { label: `Set conditions', 
          function: setCSTNULabels },
        { label: `Temporal verification', 
          function: evaluateCSTNU },
        { label: `Download CSTNU', 
          function: downloadCSTNU },
        { label: `Reset colors', 
          function: removeNotesUpdatedError }
    ]
};
```
This object must contain the elements `name`, which contains the name of the plug-in, and `buttonFunctions` which is an array with the functionality exposed. Each element contains the `label` to be displayed in the buttons, and the `function` to be executed. 

In the actual version, all the functions receive as parameters 
1. the BPMN model mapped to an XML string according to the standard and 
2. the JSON string with the information of the inter-task objects. 

By using this signature it is possible the dynamic creation of a set of buttons in the interface that are linked to functions in the plug-in. This set of buttons will depend on the functions in the JavaScript object exported by the plug-in. 

The plug-ins have access to the object `window` and all the objects in the Document Object Model of the page, including the editor and elements, which can be updated directly from the plug-in. This separates the functionality associated with the verification and optimization of the temporal properties from the edition of the model process. 

The plug-ins should be added in the folder `TA_BPMN_editor/app/temporal-modeler/temporal-plugins-client/` and have as entry point a file that should be imported in the `index.js` file in the folder `temporal-plugins-client` and added to the object `evaluationModules` (as was it done for the `evalCSTNU` object). 

Once the files were added the TimeAwareBPMN-editor has to be updated with the command `npm run all` (in the folder `TA_BPMN_editor`) which compiles the editor using the tool `Browserify`. 


