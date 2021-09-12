import $ from 'jquery';
import CustomModeler from './temporal-modeler';

import propertiesPanelModule from 'bpmn-js-properties-panel';
import bpmnPropertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/bpmn';
import temporalConstraintsProviderModule from './temporal-modeler/extendedProperties';
import temporalConstraintsModdleDescriptor from './temporal-modeler/extendedProperties/temporalConstraints';
import { debounce } from 'min-dash';

import diagramXML from '../resources/newDiagram.bpmn';

const fileSelector = document.getElementById('inputFile_bpmn');
fileSelector.addEventListener('change', (event) => {
  const fileList = event.target.files;
  var file = fileList[0];
  var ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'bpmn') {

    var reader = new FileReader();
    reader.onload = function (e) {
      var xml = e.target.result;
      openDiagram(xml);
    };
    reader.readAsText(file);

    fileSelector.disabled = true;
  }
  else {
    window.alert("Format not valid: " + ext);
  }
});


let commandStack_changed = false;
let container = $('#js-drop-zone');
document.getElementById('button-download-diagram').disabled = true;
document.getElementById('button-download-svg').disabled = true;



let bpmnModeler = new CustomModeler({
  container: '#canvas',
  propertiesPanel: {
    parent: '#js-properties-panel'
  },
  additionalModules: [
    propertiesPanelModule,
    bpmnPropertiesProviderModule,
    temporalConstraintsProviderModule
  ],
  moddleExtensions: {
    tempcon: temporalConstraintsModdleDescriptor
  },
  keyboard: {
    bindTo: document
  }
});


function createNewDiagram() {
  openDiagram(diagramXML);
}

async function openDiagram(xml) {
  try {


    await bpmnModeler.importXML(xml);
    bpmnModeler.cleanCustomElements();
    bpmnModeler.loadCustomElementsFromXML();

    container
      .removeClass('with-error')
      .addClass('with-diagram');

    bpmnModeler.setTCEvaluationsModulesButtons();

    document.getElementById('button-download-diagram').disabled = false;
    document.getElementById('button-download-svg').disabled = false;



  } catch (err) {

    container
      .removeClass('with-diagram')
      .addClass('with-error');

    container.find('.error pre').text(err.message);

    console.error(err);
  }
}

function registerFileDrop(container, callback) {

  function handleFileSelect(e) {
    e.stopPropagation();
    e.preventDefault();

    var files = e.dataTransfer.files;
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      var xml = e.target.result;
      callback(xml);
    };

    reader.readAsText(file);
  }

  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();

    e.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  container.get(0).addEventListener('dragover', handleDragOver, false);
  container.get(0).addEventListener('drop', handleFileSelect, false);
}


////// file drag / drop ///////////////////////

// check file api availability
if (!window.FileList || !window.FileReader) {
  window.alert(
    'Looks like you use an older browser that does not support drag and drop. ' +
    'Try using Chrome, Firefox or the Internet Explorer > 10.');
} else {
  registerFileDrop(container, openDiagram);
}

// Binds a function to be executed when the DOM has finished loading.
$(function () {

  $('#js-create-diagram').click(function (e) {
    e.stopPropagation();
    e.preventDefault();

    createNewDiagram();
  });


  let buttonDownloadDiagram = $('#button-download-diagram');
  let buttonDownloadSVG = $('#button-download-svg');


  buttonDownloadDiagram.click(async function (e) {
    try {
      let definitions = bpmnModeler.getDefinitionsWithIntertaskAsExtensionElements();
      let { xml } = await bpmnModeler._moddle.toXML(definitions, { format: true });
      downloadBPMN('diagram.bpmn', xml);

    } catch (err) {
      console.error('Error happened saving diagram: ', err);
    }
  });

  buttonDownloadSVG.click(async function (e) {
    try {
      let { svg } = await bpmnModeler.saveSVG();
      downloadBPMN('diagram.svg', svg);

    } catch (err) {
      console.error('Error happened saving SVG: ', err);
    }
  });

  function downloadBPMN(filename, dataInput) {

    let element = document.createElement('a');
    // element.setAttribute('href','data:text/plain;charset=utf-8, ' + encodeURIComponent(dataInput));
    element.setAttribute('href', 'data:application/bpmn20-xml;charset=UTF-8, ' + encodeURIComponent(dataInput));
    element.setAttribute('download', filename);
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  $('.buttons a').click(function (e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  var exportArtifacts = debounce(async function () {

    commandStack_changed = true;

  }, 500);

  bpmnModeler.on('commandStack.changed', exportArtifacts);

});

//Used by the plug-ins
window.bpmnjs = bpmnModeler;
window.elementsUpdated = [];
window.elementsError = [];