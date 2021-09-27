# TimeAwareBPMN-js

It is a tool for editing and verifying time-aware BPMN models, BPMN models having temporal constraints.

It is a web-application and consists of a graphical editor where it is possible to create or edit time-aware BPMN models
and where it is possible to select and run a plug-in for verifying temporal constraints.

Plug-in architecture allows the execution of different programs for verifying different temporal properties.

As a proof-of-concept, the application contains a plug-in, CSTNU plug-in, that allows verifying if the model is *dynamically controllable*,
i.e., it is possible to execute it whatever the duration of some activities, called *contingent* activities.
Each contingent-activity duration is limited to stay in a temporal range, but the exact duration is decided at run-time by the external "agent" executing it.
CSTNU plug-in verifies the dynamic controllability property using an external Java library.


## Installation
To run the application, it is necessary to install some Node modules and dependency.

1. First, it is necessary to install **Java** module, necessary for the CSTNU plug-in.

**Installation in Mac OS X**

    1. Install JDK 11/17 (if you are using brew, `brew install openjdk@11`)
    2. Set the JAVA_HOME environment variable to JDK home.
       If you installed by brew, then the JAVA_HOME can be set for JDK 11 by        
        export JAVA_HOME=/Library/Java/JavaVirtualMachines/openjdk-11.jdk/Contents/Home
       or for JDK 17 by    
        export JAVA_HOME=/Library/Java/JavaVirtualMachines/openjdk.jdk/Contents/Home
    3. Install compiling tools: `npm install -g node-gyp`
    4. Install java: `npm i java`

**Installation in Ubuntu**

    1. Install JDK 11
    2. Install compiling tools: sudo apt install make g++
    3. Install java: npm i java

2. Then, install all other dependencies
```
npm install
```

3. Finally, build and run the project
```
npm start
```
A model can be loaded by dragging the file in the editor or using the option Load BPMN model. There are example models in the [models folder](exmples/models/).

## Demos
Check usage examples in [demos folder](./examples/demos/).


## Adding a plug-in
The application can be extended, adding other plug-ins for verifying other temporal properties (or other properties).
There is an application API to ease the development of plug-in as JavaScript module.
One a plug-in is developed, it can be used inside the application, just putting the JavaScript module in a specific directory.

A plug-in is divided into two parts:
* Client-side plug-in. It has to show the possible actions as buttons in a toolbar, prepare the data for the checking, send the data to the corresponding server-side plug-in, and receive and show the results.
More details are given at page [client-side plug-in](./TA_BPMN_editor/app/temporal-modeler/temporal-plugins-client/README.md).

* Server-side plug-in. It has to accept the verification requests, realize the verification executing some program/library, and return the results to the corresponding client-side plug-in.
More details are given at page [server-side plug-in](./temporal-plugins-server/README.md).

## License

MIT
