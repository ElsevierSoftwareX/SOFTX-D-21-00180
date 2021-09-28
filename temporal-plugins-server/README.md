# TimeAwareBPMN-js - Server-side plug-in

This folder contains the implementation of TimeAwareBPMN-js - Server-side plug-ins to enable the verification of time-aware BPMN models based on temporal constraint networks using external libraries.


## Entry point

The tool TimeAwareBPMN-js searches for the plug-ins entry point files with the form `temporal-plugins-server/*/index.js` which exports a JavaScript object, called `moduleInfo`, with the information to communicate the plug-ins and the functions to be executed. This is the object `moduleInfo` of CSTNU plug-in. 

```
const moduleInfo = {
    name: `CSTNU',
    url: `/cstnu',
    postRequests: [{
        url: `/dcChecking',
        function: checkDynamicControllability,
    }]
};
```
The object `moduleInfo` has to specify the `name` of the plug-in, the `url` used to identify the plug-in in the `POST` request, and an array `postRequests` which contains the `url` used to identify the `function` to execute. 

The server expects `POST` requests with URLs that correspond to the ones from the plug-ins and functions with the format `plug-in/function`. The server splits the URLs to identify the function to execute. This is the key point from the server-side to performs the communication.  


