/**
 * Module to render elements with temporal constraints and relative constraints connections
 */
import inherits from 'inherits';

import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer';

import {
  assign,
} from 'min-dash';
import {
  query as domQuery
} from 'min-dom';

import { is } from "bpmn-js/lib/util/ModelUtil";
import { isAny } from "bpmn-js/lib/features/modeling/util/ModelingUtil";

import {
  componentsToPath,
  createLine
} from 'diagram-js/lib/util/RenderUtil';

import {
  append as svgAppend,
  attr as svgAttr,
  create as svgCreate,
  classes as svgClasses
} from 'tiny-svg';

var COLOR_GREEN_TRIANG = '#52B415',
  COLOR_RED = '#cc0000',
  COLOR_GREEN = '#00cc00',
  COLOR_YELLOW = '#ffc800';

import Ids from 'ids';

var RENDERER_IDS = new Ids();

const HIGH_PRIORITY = 1500,
  TASK_BORDER_RADIUS = 2;

/**
 * A renderer that knows how to render custom elements.
 */
export default function CustomRenderer(eventBus, styles, bpmnRenderer, textRenderer) {

  BaseRenderer.call(this, eventBus, 2000);

  var computeStyle = styles.computeStyle;
  var rendererId = RENDERER_IDS.next();
  var markers = {};
  this.bpmnRenderer = bpmnRenderer;
  this.textRenderer = textRenderer;
  this.eventBus = eventBus;

  this.drawTriangle = function (p, side) {
    var halfSide = side / 2,
      points,
      attrs;

    points = [halfSide, 0, side, side, 0, side];

    attrs = computeStyle(attrs, {
      stroke: COLOR_GREEN_TRIANG,
      strokeWidth: 2,
      fill: COLOR_GREEN_TRIANG
    });

    var polygon = svgCreate('polygon');

    svgAttr(polygon, {
      points: points
    });

    svgAttr(polygon, attrs);

    svgAppend(p, polygon);

    return polygon;
  };

  this.getTrianglePath = function (element) {
    var x = element.x,
      y = element.y,
      width = element.width,
      height = element.height;

    var trianglePath = [
      ['M', x + width / 2, y],
      ['l', width / 2, height],
      ['l', -width, 0],
      ['z']
    ];

    return componentsToPath(trianglePath);
  };

  this.drawCircle = function (p, width, height) {
    var cx = width / 2,
      cy = height / 2;

    var attrs = computeStyle(attrs, {
      stroke: COLOR_YELLOW,
      strokeWidth: 4,
      fill: COLOR_YELLOW
    });

    var circle = svgCreate('circle');

    svgAttr(circle, {
      cx: cx,
      cy: cy,
      r: Math.round((width + height) / 4)
    });

    svgAttr(circle, attrs);

    svgAppend(p, circle);

    return circle;
  };

  this.getCirclePath = function (shape) {
    var cx = shape.x + shape.width / 2,
      cy = shape.y + shape.height / 2,
      radius = shape.width / 2;

    var circlePath = [
      ['M', cx, cy],
      ['m', 0, -radius],
      ['a', radius, radius, 0, 1, 1, 0, 2 * radius],
      ['a', radius, radius, 0, 1, 1, 0, -2 * radius],
      ['z']
    ];

    return componentsToPath(circlePath);
  };

  function addMarker(id, options) {
    var attrs = assign({
      fill: 'red',
      strokeWidth: 1,
      strokeLinecap: 'round',
      strokeDasharray: 'none'
    }, options.attrs);

    var ref = options.ref || { x: 0, y: 0 };

    var scale = options.scale || 1;

    // fix for safari / chrome / firefox bug not correctly
    // resetting stroke dash array
    if (attrs.strokeDasharray === 'none') {
      attrs.strokeDasharray = [10000, 1];
    }

    var marker = svgCreate('marker');

    svgAttr(options.element, attrs);

    svgAppend(marker, options.element);

    svgAttr(marker, {
      id: id,
      viewBox: '0 0 20 20',
      refX: ref.x,
      refY: ref.y,
      markerWidth: 20 * scale,
      markerHeight: 20 * scale,
      orient: 'auto'
    });

    var defs = domQuery('defs', canvas._svg);

    if (!defs) {
      defs = svgCreate('defs');

      svgAppend(canvas._svg, defs);
    }

    svgAppend(defs, marker);

    markers[id] = marker;
  }

  function colorEscape(str) {
    return str.replace(/[()\s,#]+/g, '_');
  }

  function marker(type, fill, stroke) {

    var id = type + '-' + colorEscape(fill) + '-' + colorEscape(stroke) + '-' + rendererId;

    if (!markers[id]) {
      createMarker(id, type, fill, stroke);
    }

    return 'url(#' + id + ')';
  }

  function createMarker(id, type, fill, stroke) {

    if (type === 'sequenceflow-end') {
      var sequenceflowEnd = svgCreate('path');
      svgAttr(sequenceflowEnd, { d: 'M 1 5 L 11 10 L 1 15 Z' });

      addMarker(id, {
        element: sequenceflowEnd,
        ref: { x: 11, y: 10 },
        scale: 0.5,
        attrs: {
          fill: stroke,
          stroke: stroke
        }
      });
    }
  }

  this.drawCustomConnection = function (p, element, textRenderer) {

    let minD = "";
    let maxD = "";

    if (element.businessObject.minDuration != undefined)
      minD = element.businessObject.minDuration;
    if (element.businessObject.maxDuration != undefined)
      maxD = element.businessObject.maxDuration;

    let colorFrame = COLOR_GREEN;

    // if (minD <= 0) colorFrame = COLOR_RED;
    if ((minD != '' && !Number.isInteger(parseFloat(minD))) ||
      (maxD != '' && !Number.isInteger(parseFloat(maxD))))
      colorFrame = COLOR_RED;

    minD = Number(minD);
    maxD = (maxD != "" ? maxD : Infinity);
    if (maxD <= minD) colorFrame = COLOR_RED;

    var attrs = computeStyle(attrs, {
      stroke: colorFrame,
      strokeWidth: 2,
      strokeDasharray: '20,10,5,5,5,10',
      strokeLinecap: 'square',
      // strokeLinecap: 'round',
      markerEnd: marker('sequenceflow-end', 'white', colorFrame),
    });

    let theElement = svgAppend(p, createLine(element.waypoints, attrs));

    // // TODO: Add a label with minD-maxD
    // // The next code adds the text, 
    // // but it is displayed only when the connection is being created
    // // once it is created it disappears
    // // it is also present in the SVG diagram

    // //https://forum.bpmn.io/t/how-to-put-label-in-a-custom-element/3287/2
    // //https://forum.bpmn.io/t/add-label-to-custom-elements/2236
    // //https://forum.bpmn.io/t/adjust-label-when-connection-has-modified/746

    // let refX = 0; // (element.waypoints[0].x - element.waypoints[1].x)/2;          
    // let refY = 0; // (element.waypoints[0].y - element.waypoints[1].y)/2;
    // let maxL = -1, maxI = -1;
    // for (let i = 0; i < element.waypoints.length - 1; i++) {
    //   let currentPoint = element.waypoints[i];
    //   let nextPoint = element.waypoints[i + 1];
    //   let segLen = (currentPoint.x - nextPoint.x) ** 2 + (currentPoint.y - nextPoint.y) ** 2
    //   if (segLen > maxL) {
    //     maxL = segLen;
    //     maxI = i;
    //   }
    // }

    // refX = (element.waypoints[maxI].x + element.waypoints[maxI + 1].x) / 2
    // refY = (element.waypoints[maxI].y + element.waypoints[maxI + 1].y) / 2

    // let text = this.textRenderer.createText(minD + "-" + maxD); // (label || '', options);
    // // svgClasses(text).add('djs-label');
    // svgAppend(theElement, text);
    // // prependTo(text, p);

    // svgAttr(text, {
    //   transform: "translate(" + refX + ", " + refY + ")"
    // });

    return theElement;
  };

  this.getCustomConnectionPath = function (connection) {
    var waypoints = connection.waypoints.map(function (p) {
      return p.original || p;
    });

    var connectionPath = [
      ['M', waypoints[0].x, waypoints[0].y]
    ];

    waypoints.forEach(function (waypoint, index) {
      if (index !== 0) {
        connectionPath.push(['L', waypoint.x, waypoint.y]);
      }
    });

    return componentsToPath(connectionPath);
  };

}

inherits(CustomRenderer, BaseRenderer);

CustomRenderer.$inject = ['eventBus', 'styles', "bpmnRenderer", "textRenderer"];

CustomRenderer.prototype.canRender = function (element) {
  // return /^custom:/.test(element.type);
  return (
    isAny(element, [
      "bpmn:Task",
      "bpmn:Event",
      "bpmn:SequenceFlow",
      "bpmn:Gateway",
      "bpmn:DataObjectReference"
    ]) && !element.labelTarget ||
    /^custom:/.test(element.type)
  );
};

CustomRenderer.prototype.drawShape = function (p, element) {
  var type = element.type;

  if (type === 'custom:triangle') {
    return this.drawTriangle(p, element.width);
  }

  if (type === 'custom:circle') {
    return this.drawCircle(p, element.width, element.height);
  }

  const shape = this.bpmnRenderer.drawShape(p, element);

  if (
    isAny(element, [
      "bpmn:UserTask",
      "bpmn:ServiceTask",
      "bpmn:ReceiveTask",
      "bpmn:SubProcess"
    ])
  ) {

    drawShape_contingent(p, element, this.textRenderer, true, this.eventBus);
  }
  if (isAny(element, ["bpmn:IntermediateCatchEvent"])) {
    let strOptions = ['bpmn:MessageEventDefinition', 'bpmn:SignalEventDefinition'];
    if (element.businessObject.eventDefinitions && element.businessObject.eventDefinitions.length > 0) {
      if (strOptions.includes(element.businessObject.eventDefinitions[0].$type)) {
        drawShape_contingent(p, element, this.textRenderer, true, this.eventBus);
      }
    }
  }

  // if (isAny(element, ["bpmn:IntermediateCatchEvent"])) {
  //   let strOptions = ['bpmn:TimerEventDefinition'];
  //   if (element.businessObject.eventDefinitions && element.businessObject.eventDefinitions.length > 0) {
  //     if (strOptions.includes(element.businessObject.eventDefinitions[0].$type)) {
  //       drawShape_contingent(p, element, this.textRenderer, false, this.eventBus);
  //     }
  //   }
  // }

  if (
    isAny(element, [
      "bpmn:ScriptTask",
      'bpmn:SendTask',
      "bpmn:ParallelGateway",
      "bpmn:ExclusiveGateway",
      "bpmn:EventBasedGateway"
    ])
  ) {
    drawShape_contingent(p, element, this.textRenderer, false, this.eventBus);
  }

  if (isAny(element, ["bpmn:IntermediateThrowEvent"])) {
    let strOptions = ['bpmn:MessageEventDefinition', 'bpmn:SignalEventDefinition'];
    if (element.businessObject.eventDefinitions && element.businessObject.eventDefinitions.length > 0) {
      if (strOptions.includes(element.businessObject.eventDefinitions[0].$type)) {
        drawShape_contingent(p, element, this.textRenderer, false, this.eventBus);
      }
    }
    if (element.businessObject.eventDefinitions === undefined) {
      drawShape_contingent(p, element, this.textRenderer, false, this.eventBus);
    }

  }

  if (isAny(element, ["bpmn:BoundaryEvent"])) {
    let strOptions = ['bpmn:MessageEventDefinition'];
    if (element.businessObject.eventDefinitions && element.businessObject.eventDefinitions.length > 0) {
      if (strOptions.includes(element.businessObject.eventDefinitions[0].$type)) {
        drawShape_contingent(p, element, this.textRenderer, false, this.eventBus);
      }
    }
  }

  return shape;
};

CustomRenderer.prototype.getShapePath = function (shape) {
  var type = shape.type;

  if (type === 'custom:triangle') {
    return this.getTrianglePath(shape);
  }

  if (type === 'custom:circle') {
    return this.getCirclePath(shape);
  }
};

CustomRenderer.prototype.drawConnection = function (p, element) {

  var type = element.type;

  if (type === 'custom:connection') {
    return this.drawCustomConnection(p, element, this.textRenderer);
  }

  const shape = this.bpmnRenderer.drawConnection(p, element);

  if (is(element, "bpmn:SequenceFlow")) {
    // Information about min max duration
    let minD = "";
    let maxD = "";
    if (getExtensionElementValue(element, 'TDuration', 'minDuration') != undefined)
      minD = getExtensionElementValue(element, 'TDuration', 'minDuration');
    if (getExtensionElementValue(element, 'TDuration', 'maxDuration') != undefined)
      maxD = getExtensionElementValue(element, 'TDuration', 'maxDuration');

    // Default values for a normal connection 
    if (minD === "") minD = 0;
    if (maxD === "") maxD = Infinity;

    let colorFrame;
    if (minD < 0) colorFrame = COLOR_RED;
    if (maxD < minD) colorFrame = COLOR_RED;
    if ((minD != 0 && !Number.isInteger(parseFloat(minD))) ||
      (maxD != Infinity && !Number.isInteger(parseFloat(maxD)))) colorFrame = COLOR_RED;

    if (colorFrame != undefined) {
      shape.style.stroke = colorFrame;
      // shape.style.strokeWidth = "4px";
    }

    // TODO check connected elements to update them, like Gateways

    return shape;
  }
};

CustomRenderer.prototype.getConnectionPath = function (connection) {

  var type = connection.type;

  if (type === 'custom:connection') {
    return this.getCustomConnectionPath(connection);
  }
};

// from https://github.com/bpmn-io/bpmn-js/blob/master/lib/draw/BpmnRenderer.js
function drawRect(parentNode, width, height, borderRadius, strokeColor) {
  const rect = svgCreate("rect");

  svgAttr(rect, {
    width: width,
    height: height,
    rx: borderRadius,
    ry: borderRadius,
    stroke: strokeColor || "#000",
    strokeWidth: 2,
    fill: "#fff",
  });
  let rectElement = svgAppend(parentNode, rect);

  return { rect, rectElement };
}

function drawShape_contingent(
  parentNode,
  element,
  textRenderer,
  isContingent,
  eventBus
) {
  // Overlay a shape
  // const rect = drawRect(parentNode, 100, 80, TASK_BORDER_RADIUS, '#52B415');
  // prependTo(rect, parentNode);
  // rect.style.fill='#2ac99a'
  // svgRemove(shape);

  // Information about min max duration and isContingent
  let minD = "", maxD = "";
  if (getExtensionElementValue(element, 'TDuration', 'minDuration') != undefined)
    minD = getExtensionElementValue(element, 'TDuration', 'minDuration');
  if (getExtensionElementValue(element, 'TDuration', 'maxDuration') != undefined)
    maxD = getExtensionElementValue(element, 'TDuration', 'maxDuration');

  let colorFrame = COLOR_GREEN;
  if (isContingent) colorFrame = "#0000cc";

  if (window.elementsUpdated.indexOf(element.businessObject.id) >= 0)
    colorFrame = "#FFFF00";

  if (window.elementsError.indexOf(element.businessObject.id) >= 0) colorFrame = "#cc00cc";

  // if (isAny(element, ["bpmn:IntermediateCatchEvent"])) {
  //   let strOptions = ['bpmn:TimerEventDefinition']; // TimerEventDefinition does not have 
  //   if (strOptions.includes(element.businessObject.eventDefinitions[0].$type)) {
  //     drawShape_contingent(p, element, this.textRenderer, true, this.eventBus);
  //   }
  // }

  if (minD === "" || maxD === "") colorFrame = COLOR_RED;
  if (minD < 0) colorFrame = COLOR_RED;
  if (!Number.isInteger(parseFloat(minD)) || !Number.isInteger(parseFloat(maxD))) colorFrame = COLOR_RED;

  let minD_num = Number(minD);
  let maxD_num = Number(maxD);

  if (isContingent) {
    if (minD_num <= 0) colorFrame = COLOR_RED;
    if (maxD_num <= minD_num) colorFrame = COLOR_RED;
  }
  else
    if (maxD_num < minD_num) colorFrame = COLOR_RED;

  if (isAny(element, ["bpmn:ExclusiveGateway", "bpmn:ParallelGateway"])) {
    // Check it has a type: split or join 
    // let gatewaySplitJoin = getExtensionElementValue(element, "TGatewaySplitJoin", "gatewaySplitJoin");
    let gatewaySplitJoin = window.bpmnjs.checkSplitJoin(element);

    if (gatewaySplitJoin === undefined) {
      colorFrame = COLOR_RED;
    }
    else if (gatewaySplitJoin === '') {
      colorFrame = COLOR_RED;
    }
    // if split, it should have 1 input and 2 outputs
    else if (gatewaySplitJoin === 'split') {
      if (isAny(element, ["bpmn:ExclusiveGateway"])) {
        let observedPropositionTmp = getExtensionElementValue(element, "TXorProposition", "observedProposition");

        if (observedPropositionTmp)
          if (observedPropositionTmp.length > 1) colorFrame = COLOR_RED;
      }
    }
    eventBus.fire("tempcon.changed", { element: element });
  }

  if (isAny(element, ["bpmn:BoundaryEvent"])) {
    if (element.businessObject.eventDefinitions && element.businessObject.eventDefinitions.length > 0) {
      let strOptions = ['bpmn:MessageEventDefinition'];
      if (strOptions.includes(element.businessObject.eventDefinitions[0].$type)) {
        let attachedTo = element.businessObject.attachedToRef;
        if (attachedTo) {
          let valMaxDuration_attached = getExtensionElementValue(attachedTo, 'TDuration', 'maxDuration');
          if (Number(maxD) >= Number(valMaxDuration_attached) ) {
            colorFrame = COLOR_RED;
          }
        }
      }
    }
  }

  let temWidth = element.width - 20;

  let tmpObj = drawRect(parentNode, 40, 20, TASK_BORDER_RADIUS, colorFrame);
  const rectSmall = tmpObj.rect;

  svgAttr(rectSmall, {
    transform: "translate(" + temWidth + ", -10)",
  });

  let strText = minD + "-" + maxD;

  let text = textRenderer.createText(strText); // (label || '', options);
  // svgClasses(text).add('djs-label');
  svgAppend(tmpObj.rectElement, text);
  // prependTo(text, parentNode);
  temWidth = 25;
  if (is(element, "bpmn:Gateway")) {
    temWidth = -25;
  }
  if (is(element, "bpmn:IntermediateCatchEvent") || is(element, "bpmn:IntermediateThrowEvent") || is(element, "bpmn:BoundaryEvent")) {
    temWidth = -40;
  }

  svgAttr(text, {
    transform: "translate(" + temWidth + ", -7)",
  });
}

function getExtensionElementValue(element, typeName, property) {
  return window.bpmnjs.getExtensionElementValue(element, typeName, property);
}

