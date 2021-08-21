import $ from 'jquery';
import CustomModeler from './temporal-modeler';

import propertiesPanelModule from 'bpmn-js-properties-panel';
import bpmnPropertiesProviderModule from 'bpmn-js-properties-panel/lib/provider/bpmn';
import temporalPropertiesProviderModule from './temporal-modeler/extendedProperties';
import temporalPropertiesModdleDescriptor from './temporal-modeler/extendedProperties/temporalProperties';
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
    $('#js-download-diagram').removeClass('active');
    $('#js-download-svg').removeClass('active');
    $('#js-download-intertasks').removeClass('active');
  }
  else {
    window.alert("Format not valid: " + ext);
  }
});

const customSelector = document.getElementById('inputFile_intertasks');
customSelector.addEventListener('change', (event) => {
  const fileList = event.target.files;
  var file = fileList[0];
  var ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'json') {
    var reader = new FileReader();
    reader.onload = function (e) {
      var customElements = e.target.result;
      bpmnModeler.addCustomElements(JSON.parse(customElements));
    };
    reader.readAsText(file);
  }
  else {
    window.alert("Format not valid: " + ext);
  }
});



var container = $('#js-drop-zone');

var bpmnModeler = new CustomModeler({
  container: '#canvas',
  propertiesPanel: {
    parent: '#js-properties-panel'
  },
  additionalModules: [
    propertiesPanelModule,
    bpmnPropertiesProviderModule,
    temporalPropertiesProviderModule
  ],
  moddleExtensions: {
    temporalProperties: temporalPropertiesModdleDescriptor
  },
  keyboard: {
    bindTo: document
  }
});

function createNewDiagram() {
  openDiagram(diagramXML);
}

async function openDiagram(xml, cElements) {
  try {
    await bpmnModeler.importXML(xml);
    bpmnModeler.cleanCustomElements();

    if (cElements) {
      bpmnModeler.addCustomElements(cElements);
    }

    container
      .removeClass('with-error')
      .addClass('with-diagram');
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

  var downloadLink = $('#js-download-diagram');
  var downloadSvgLink = $('#js-download-svg');
  var downloadIntertasksLink = $('#js-download-intertasks');

  bpmnModeler.setTCEvaluationsModulesButtons();

  $('.buttons a').click(function (e) {
    if (!$(this).is('.active')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  function setEncoded(link, name, data) {
    var encodedData = encodeURIComponent(data);

    if (data) {
      link.addClass('active').attr({
        'href': 'data:application/bpmn20-xml;charset=UTF-8,' + encodedData,
        'download': name
      });
    } else {
      link.removeClass('active');
    }
  }

  var exportArtifacts = debounce(async function () {

    try {
      const { svg } = await bpmnModeler.saveSVG();
      setEncoded(downloadSvgLink, 'diagram.svg', svg);

    } catch (err) {
      console.error('Error happened saving SVG: ', err);
      setEncoded(downloadSvgLink, 'diagram.svg', null);
    }

    try {
      let customElements = bpmnModeler.getCustomElements();
      let myJson = JSON.stringify(customElements, null, '\t');
      setEncoded(downloadIntertasksLink, 'intertasks.json', myJson);

    } catch (err) {
      console.error('Error happened saving intertasks: ', err);
      setEncoded(downloadIntertasksLink, 'intertasks.json', null);
    }

    try {
      let definitions = bpmnModeler.getDefinitions();
      let { xml } = await bpmnModeler._moddle.toXML(definitions, { format: true });
      setEncoded(downloadLink, 'diagram.bpmn', xml);

    } catch (err) {
      console.error('Error happened saving diagram: ', err);
      setEncoded(downloadLink, 'diagram.bpmn', null);
    }

  }, 500);

  bpmnModeler.on('commandStack.changed', exportArtifacts);

});

//Used by the plug-ins
window.bpmnjs = bpmnModeler;
window.elementsUpdated = [];
window.elementsError = [];