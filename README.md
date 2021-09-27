# TimeAwareBPMN-js

A tool that enables the editing and verification of time-aware BPMN models based on temporal constraint networks.


## About

This application loads the TimeAwareBPMN-editor and manages the communication with programs that perform verification of temporal constraints, which can be desktop applications. 
The tool was designed to be extended, by adding verification programs as plug-ins. 
This version contains a plug-in that connects with the Java tool CSTNU to evaluate the dynamic controllability of BPMN models. 

## Adding a plug-in

The plug-ins are divided into two parts:
* Client-side plug-in. It has to show the possible actions as buttons in a toolbar, to prepare the data for the checking, to send the data to the corresponding server-side plug-in, and receive and show the results. Description of [client-side plug-in](./TA_BPMN_editor/app/temporal-modeler/temporal-plugins-client/README.md) implementation.
* Server-side plug-in. It has to accept the verification requests, realize the verification executing the program of the associated library, and return the results to the corresponding client-side plug-in. Description of the [server-side plug-in](./temporal-plugins-server/README.md) implementation.

## Running the Example


TimeAwareBPMN-js requires the [Java module](https://www.npmjs.com/package/java). Java module works with JVM 11 or JVM 17.

Installation Mac OS X

1. Install JDK 11 (if you are using brew, `brew install penjdk@11`)
2. Set the JAVA_HOME environment variable to JDK 11 home
If you installed by brew, then `export JAVA_HOME=/Library/Java/JavaVirtualMachines/openjdk-11.jdk/Contents/Home`
3. Install compiling tools: `npm install -g node-gyp`
4. Install java: `npm i java`


Installation Ubuntu

1. Install JDK 11
2. Install compiling tools: `sudo apt install make g++`
3. Install java: `npm i java`


### Install all required dependencies:


```
npm install
```

Build and run the project

```
npm start
```
A model can be loaded by dragging the file in the editor or using the option Load BPMN model. There are example models in the folder `TA_BPMN_editor/resources/`.

## Demos 

Check usage examples in the [demos folder](./tutorials/demos/). 

## License

MIT
