var escena;

var Partition = { scale: 30, step: 30 };
/**
 *
 */
Partition.snapToStep = function(n) {
  return Math.round(n/this.step)*this.step;
}

/**
 *
 */
Partition.getRandomColor = function() {
  return "rgb(" + parseInt(Math.random()*256) + "," + parseInt(Math.random()*256) + "," + parseInt(Math.random()*256) + ")";
}

/**
 *
 */
Partition.reverse = function(a) {
  var b = [];

  for (var i=0,l=a.length; i<l; i++) {
    b.push(a[i])
  }
  return b.reverse();
}

/**
 *
 */
Partition.scaleAndTranslatePolygon = function(vertices) {
  var scale = 30;
  var traslateX = 60;
  var traslateY = 30;
  var newVertices = [];
  for(var i=0,l=vertices.length; i<l; i++) {
    newVertices[i] = {x: traslateX+vertices[i].x*scale, y: traslateY+vertices[i].y*scale}
  }
  return newVertices;
}

/**
 *
 */
Partition.Escena = function(w, h) {
  this.stage = new Kinetic.Stage({
    container: "container",
    width: w,
    height: h
  });

  // create label
  this.label = new Kinetic.Label({
    x: -100,
    y: -100, 
    draggable: true
  });

  // add a tag to the label
  this.label.add(new Kinetic.Tag({
      fill: "lightblue",
      stroke: "#333",
      pointerDirection: "down",
      pointerWidth: 10,
      pointerHeight: 10,
      lineJoin: "round",
      shadowColor: "black",
      shadowBlur: 5,
      shadowOffset: 5,
      shadowOpacity: 0.75
  }));

  // add text to the label
  this.tempText = new Kinetic.Text({
    text: "",
    fontSize: 22,
    lineHeight: 1.2,
    padding: 5,
    fill: "black"
   });
  this.label.add(this.tempText);
  this.tagLayer = new Kinetic.Layer();
  this.tagLayer.add(this.label);
  this.stage.add(this.tagLayer);

  // var vertexPolygon1 = [ {x: 100, y: 100}, {x: 100, y: 300}, {x: 150, y: 300}, {x: 150, y: 200}, {x: 250, y: 200}, {x: 250, y: 300}, {x: 300, y: 300}, {x: 300, y: 100}, {x: 100, y: 100} ];
  
  var vertexPolygon1 = [ {x: 5, y: 0},
                         {x: 0, y: 2},
                         {x: 0, y: 8},
                         {x: 5, y: 10},
                         {x: 17, y: 10},
                         {x: 17, y: 2},
                         {x: 5, y: 2},
                         {x: 5, y: 0}
                       ];

  vertexPolygon1 = Partition.scaleAndTranslatePolygon(vertexPolygon1);

  this.polygons = [new Partition.Polygon(vertexPolygon1, this, "A")];
}

/**
 *
 */
Partition.Escena.prototype.addInitialEvents = function(mode) {
  this.mode = mode;

  for(var i=0,l=this.polygons.length; i<l; i++) {
    this.polygons[i].removeInitialEvents();    
    this.polygons[i].addInitialEvents();
    this.polygons[i].changeDeselected();
  }

  this.label.setAttr("x", -100);
  this.label.setAttr("y", -100);
  this.tagLayer.draw();
}

/**
 *
 */
Partition.Escena.prototype.setPolygonSelected = function(poly) {
  for(var i=0,l=this.polygons.length; i<l; i++) {
    this.polygons[i].removeInitialEvents();

    //
    if (poly == this.polygons[i]) {
      this.polygonSelected = i;

      // move to the front
      this.polygons[i].layer.moveToTop();

      if (this.mode == "cutPolygonMode") {
        this.polygons[i].addCutEvent();
        window.parent.postMessage({ type: "set", name: "cualMensaje", value: 3 }, "*");
        window.parent.postMessage({ type: "update" }, "*");
      }
      else if (this.mode == "measurePolygonMode") {
        this.polygons[i].addMeasureEvent();
        window.parent.postMessage({ type: "set", name: "cualMensaje", value: 4 }, "*");
        window.parent.postMessage({ type: "update" }, "*");
      }
    }
  }

  this.tagLayer.moveToTop();
}

/**
 *
 */
Partition.Escena.prototype.addNewPolygons = function(polygonVertices) {
  var label1 = this.polygons[this.polygonSelected].identifier;
  var label2 = String.fromCharCode(65+this.polygons.length)

  this.polygons[this.polygonSelected].layer.destroy();
  this.polygons.splice(this.polygonSelected, 1, new Partition.Polygon(polygonVertices[0], this, label1), 
                                                new Partition.Polygon(polygonVertices[1], this, label2));

  // send messages to descartes
  window.parent.postMessage({ type: "set", name: "cortarBtnSel", value: 0 }, "*");
  window.parent.postMessage({ type: "set", name: "numeroDePoligonos", value: this.polygons.length }, "*");
  window.parent.postMessage({ type: "set", name: "cualMensaje", value: 0 }, "*");  
  // window.parent.postMessage({ type: "exec", name: "iniciaTextoArea", value: "" }, "*");
  window.parent.postMessage({ type: "update" }, "*");

  // restore cursor
  document.body.style.cursor = "auto";
}

/**
 *
 */
Partition.Escena.prototype.getAreas = function() {
  var totalArea = 0;
  var tmpArea;
  for (var i=0,l=this.polygons.length; i<l; i++) {
    tmpArea = this.polygons[i].getArea();
    totalArea += tmpArea;
    window.parent.postMessage({ type: "set", name: "area_ext_"+this.polygons[i].identifier, value: tmpArea }, "*");
    console.log(this.polygons[i].identifier, tmpArea)
  }
console.log(totalArea)

  window.parent.postMessage({ type: "set", name: "total_ext_total", value: totalArea }, "*");
  window.parent.postMessage({ type: "exec", name: "verificar", value: "" }, "*");
  window.parent.postMessage({ type: "update" }, "*");
}

/**
 *
 */
Partition.Polygon = function(vertex, parent, identifier) {
  this.vertex = vertex;
  this.parent = parent;
  this.identifier = identifier;

  this.stage = parent.stage;

  this.layer = new Kinetic.Layer();
  this.measureGroup = new Kinetic.Group();

  this.drawingPolygon = new Kinetic.Polygon({
    points: vertex,
    stroke: "black",
    fill: Partition.getRandomColor(),
    strokeWidth: 2,
    lineCap: "round",
    lineJoin: "round"
  });

  this.selectionBorder = new Kinetic.Line({
    points: vertex,
    stroke: "rgba(0, 0, 0, 0)",
    strokeWidth: 10,
    lineCap: "round",
    lineJoin: "round"
  });

  this.cuttingPolygonLine = new Kinetic.Line({
    points: [{x: 0, y: 0}],
    stroke: "black",
    strokeWidth: 2,
    dashArray: [7, 3],
    lineCap: "round",
    lineJoin: "round"
  });

  this.label = new Kinetic.Text({
    x: 0,
    y: 0,
    text: "",
    fontSize: 20,
    fontFamily: "Arial",
    fill: "black",
    align: "center"
  });

  this.configMeasureGroup();

  this.layer.add(this.drawingPolygon);
  this.layer.add(this.cuttingPolygonLine);
  this.layer.add(this.label);

  this.stage.add(this.layer);

  var lastPoint = null;
  var mousePos;
  var endPoint;
  var newX;
  var newY;
  var self = this;
  var interPoint;
  var midPoint;

  /**
   *
   */
  this.mousemove = function(evt) {
    mousePos = self.stage.getMousePosition();

    newX = mousePos.x - lastPoint.x;
    newY = mousePos.y - lastPoint.y;

    endPoint = (Math.abs(newX) > Math.abs(newY)) ? 
               {x: Partition.snapToStep(lastPoint.x + newX), y: Partition.snapToStep(lastPoint.y)} : 
               {x: Partition.snapToStep(lastPoint.x), y: Partition.snapToStep(lastPoint.y + newY)};

    self.cuttingPolygonLine.getAttr("points")[self.cuttingPolygonLine.getAttr("points").length-1] = endPoint;

    self.layer.draw()
  }

  var _whereIs;
  /**
   *
   */
  this.addPoint = function(evt) {
    // dont have intersections with previous cutting edges
    if (!self.intersectsCuttingLine([lastPoint, endPoint])) {
      interPoint = self.intersects([lastPoint, endPoint]);

      // dont have intersecions with the polygon
      if (interPoint == null) {
        midPoint = { x: (lastPoint.x+endPoint.x)/2, y: (lastPoint.y+endPoint.y)/2 };

        if (self.whereIsThePoint(midPoint) != "out") {
          self.cuttingPolygonLine.getAttr("points").push(endPoint);
          lastPoint = endPoint;
        }
      }
      // posible intersection
      else {
        // is a valid intersection
        if (interPoint != "noneValid") {
          self.stage.off("mousemove", self.mousemove);
          self.stage.off("mousedown touchstart", self.addPoint);

          self.cuttingPolygonLine.getAttr("points")[self.cuttingPolygonLine.getAttr("points").length-1] = interPoint;
          self.layer.draw();

          self.parent.addNewPolygons(self.getNewPolygonVertices());
        }
      }
    }
  }

  /**
   *
   */
  this.mouseclickBorder = function(evt) {
    if (lastPoint == null) {
      mousePos = self.stage.getMousePosition();

      mousePos = { x: Partition.snapToStep(mousePos.x), 
                   y: Partition.snapToStep(mousePos.y)
                 };

      // the initial point is in the border
      if (self.whereIsThePoint(mousePos) == "over") {
        lastPoint = mousePos;

        self.cuttingPolygonLine.getAttr("points")[0] = lastPoint;
        self.cuttingPolygonLine.getAttr("points")[1] = lastPoint;

        self.stage.on("mousemove", self.mousemove);
        self.stage.on("mousedown touchstart", self.addPoint);
      }
    }
  }

  /**
   *
   */
  this.addCutEvent = function() {
    document.body.style.cursor = "url('cursor.png'), help";
    self.layer.add(self.selectionBorder);
    self.layer.draw();
    self.selectionBorder.on("click touchend", self.mouseclickBorder);
  }

  /**
   *
   */
  this.addMeasureEvent = function() {
    self.layer.add(self.measureGroup);
    self.layer.draw();
  }
  this.removeMeasureEvent = function() {
    self.measureGroup.remove();
  }

  /**
   *
   */
  this.selectPolygon = function(evt) {
    self.changeSelected();
    self.parent.setPolygonSelected(self);
  }

  /**
   *
   */
  this.changeSelected = function(evt) {
    document.body.style.cursor = "pointer";
    self.drawingPolygon.setAttr("strokeWidth", 4);
    self.layer.draw();
  }
  /**
   *
   */
  this.changeDeselected = function(evt) {
    document.body.style.cursor = "auto";
    self.drawingPolygon.setAttr("strokeWidth", 2)
    self.layer.draw();
  }

  this.setLabel();
}

/**
 *
 */
Partition.Polygon.prototype.configMeasureGroup = function() {
  this.measureLines = [];

  for (var i=0,l=this.vertex.length-1; i<l; i++) {
    this.measureLines[i] = new Kinetic.Line({
      points: [ this.vertex[i], this.vertex[i+1] ],
      stroke: "rgba(0, 0, 0, 0)",
      strokeWidth: 4,
      lineCap: "round",
      lineJoin: "round"
    });

    this.measureLines[i].segmentLength = this.dist(this.vertex[i], this.vertex[i+1]);
    this.measureLines[i].points = [this.vertex[i], this.vertex[i+1]];

    var self = this;
    this.measureLines[i].on("mousedown touchstart", function(evt) {
      self.parent.label.setAttr("x", (this.points[0].x+this.points[1].x)/2);
      self.parent.label.setAttr("y", (this.points[0].y+this.points[1].y)/2);
      self.parent.tempText.setAttr("text", this.segmentLength/Partition.scale + "cm");
      self.parent.tagLayer.draw();
    });
    this.measureLines[i].on("mouseover", function(evt) {
      this.setAttr("stroke", "red");
      this.setAttr("strokeWidth", 4);
      self.layer.draw()
    });
    this.measureLines[i].on("mouseout", function(evt) {
      this.setAttr("stroke", "rgba(0, 0, 0, 0)");
      this.setAttr("strokeWidth", 4);
      self.layer.draw()
    });

    this.measureGroup.add(this.measureLines[i]);
  }
}

/**
 *
 */
Partition.Polygon.prototype.setLabel = function() {
  var height = 400;
  this.label.setAttr("text", this.identifier);

  var cx = 0;
  var cy = 0;
  var minX = Infinity;
  var maxX = -Infinity;
  var midX;

  for (var i=0,l=this.vertex.length; i<l; i++) {
    if (this.vertex[i].x < minX) {
      minX = this.vertex[i].x;
    }
    if (this.vertex[i].x > maxX) {
      maxX = this.vertex[i].x;
    }
  }

  midX = (minX+maxX)/2;
  cy = this.intersects([{x: midX, y: 0}, {x: midX, y: height}], true).y;

  this.label.setAttr("x", midX-7);
  this.label.setAttr("y", cy+2);

  this.label.draw();
}

/**
 *
 */
Partition.Polygon.prototype.addInitialEvents = function() {
  this.drawingPolygon.on("mouseover", this.changeSelected);
  this.drawingPolygon.on("mouseout",  this.changeDeselected);
  this.drawingPolygon.on("mousedown touchstart", this.selectPolygon);
}

/**
 *
 */
Partition.Polygon.prototype.removeInitialEvents = function() {
  document.body.style.cursor = "auto";

  this.drawingPolygon.off("mouseover", this.changeSelected);
  this.drawingPolygon.off("mouseout",  this.changeDeselected);
  this.drawingPolygon.off("mousedown touchstart", this.selectPolygon);

  this.removeMeasureEvent();
}  

/**
 *
 */
Partition.Polygon.prototype.dividedSegments = function() {
  var cutPoints = this.cuttingPolygonLine.getAttr("points");
  var initPoint = cutPoints[0];
  var endPoint = cutPoints[cutPoints.length-1];
  var segments = {init: -1, end: -1};

// console.log(initPoint, endPoint);

  for (var i=0,l=this.vertex.length-1; i<l; i++) {
    if (this.between(this.vertex[i].x, this.vertex[i+1].x, initPoint.x) && this.between(this.vertex[i].y, this.vertex[i+1].y, initPoint.y)) {
      segments.init = i;
    }

    if (this.between(this.vertex[i].x, this.vertex[i+1].x, endPoint.x) && this.between(this.vertex[i].y, this.vertex[i+1].y, endPoint.y)) {
      segments.end = i;
    }
  }

  return segments;
}

/**
 *
 */
Partition.Polygon.prototype.getNewPolygonVertices = function() {
  var cutPoints = this.cuttingPolygonLine.getAttr("points");
  var segments = this.dividedSegments();

  var vertex1 = [];
  var vertex2 = [];
  var inPoly1 = true;
  var lastVertex;
  var initDist;
  var endDist;

  if (segments.init === segments.end) {
    lastVertex = this.vertex[segments.init];

    initDist = this.dist(lastVertex, cutPoints[0]);
    endDist  = this.dist(lastVertex, cutPoints[cutPoints.length-1]);

    for (var i=0, l=this.vertex.length-1; i<l; i++) {
      vertex1.push(this.vertex[i]);

      if (i == segments.init) {
        if (initDist < endDist) {
          vertex1 = vertex1.concat(cutPoints);
        }
        else {
          vertex1 = vertex1.concat(Partition.reverse(cutPoints));
        }
      }
    }

    if (initDist < endDist) {
      vertex2 = Partition.reverse(cutPoints);
    }
    else {
      vertex2 = cutPoints;
    }

    vertex1.push(vertex1[0]);
    vertex2.push(vertex2[0]);

    return [vertex1, vertex2]
  }

  for (var i=0,l=this.vertex.length-1; i<l; i++) {
    if (i == segments.init) {
      if (inPoly1) {
        vertex1.push(this.vertex[i]);
        vertex1 = vertex1.concat(cutPoints);
        inPoly1 = false;
      }
      else {
        vertex2.push(this.vertex[i]);
        vertex2 = vertex2.concat(cutPoints);
        inPoly1 = true;
      }

      continue;
    }

    if (i == segments.end) {
      if (inPoly1) {
        vertex1.push(this.vertex[i]);
        vertex1 = vertex1.concat(Partition.reverse(cutPoints));
        inPoly1 = false;
      }
      else {
        vertex2.push(this.vertex[i]);
        vertex2 = vertex2.concat(Partition.reverse(cutPoints));
        inPoly1 = true;
      }

      continue;
    }

    if (inPoly1) {
      vertex1.push(this.vertex[i]);
    }
    else {
      vertex2.push(this.vertex[i]);
    }

  }
  vertex1.push(vertex1[0]);
  vertex2.push(vertex2[0]);

  return [vertex1, vertex2]
}

/**
 *
 */
Partition.Polygon.prototype.intersectsCuttingLine = function(segment) {
  var vertex = this.cuttingPolygonLine.getAttr("points");

  if (vertex.length === 2) {
    return false;
  }

  var p1Side;
  var p2Side;
  var p3Side;
  var p4Side;
  var p1Inside;
  var p2Inside;
  var p3Inside;
  var p4Inside;
  var p1 = segment[0];
  var p2 = segment[1];
  var p3;
  var p4;

  for (var i=0, l = vertex.length-2; i<l; i++) {
    p3 = vertex[i];
    p4 = vertex[i+1];

    p1Side = this.pointSide(p1, p3, p4);
    p2Side = this.pointSide(p2, p3, p4);
    p3Side = this.pointSide(p3, p1, p2);
    p4Side = this.pointSide(p4, p1, p2);
    p1Inside = this.pointInsideSegment(p1, p3, p4);
    p2Inside = this.pointInsideSegment(p2, p3, p4);
    p3Inside = this.pointInsideSegment(p3, p1, p2);
    p4Inside = this.pointInsideSegment(p4, p1, p2);

    if ( 
         ((p1Side === 0) && (p2Side === 0) && (p1Inside === 0) && (p2Inside === 0) && (p3Inside === 0) && (p4Inside === 0)) ||
         ((p1Side*p2Side < 0) && (p3Side*p4Side < 0)) ||
         ((p2Inside && p4Inside) || (p3Inside && p4Inside))
       ) {

      return true;
    }
  }

  return false;    
}

/**
 *
 */
Partition.Polygon.prototype.intersects = function(segment, ignoreSnap) {
  var vertex = this.vertex;
  var interPoint = null;

  var intersections = [];

  var p1Side;
  var p2Side;
  var p3Side;
  var p4Side;
  var p1Inside;
  var p2Inside;
  var p3Inside;
  var p4Inside;
  var p1 = segment[0];
  var p2 = segment[1];
  var p3;
  var p4;

  for (var i=0, l = vertex.length-1; i<l; i++) {
    p3 = vertex[i];
    p4 = vertex[i+1];

    p1Side = this.pointSide(p1, p3, p4);
    p2Side = this.pointSide(p2, p3, p4);
    p3Side = this.pointSide(p3, p1, p2);
    p4Side = this.pointSide(p4, p1, p2);
    p1Inside = this.pointInsideSegment(p1, p3, p4);
    p2Inside = this.pointInsideSegment(p2, p3, p4);
    p3Inside = this.pointInsideSegment(p3, p1, p2);
    p4Inside = this.pointInsideSegment(p4, p1, p2);

// console.log(i, "|", p1Side, p2Side, p3Side, p4Side, "|", p1Inside, "(", p2Inside, ")", p3Inside, p4Inside, "|", (p1Side*p2Side < 0), (p3Side*p4Side < 0));

    if ( 
         (((p1Inside) || (p2Inside) || (p3Inside) || (p4Inside)) && !(p3Inside&&p4Inside)) ||
         ((p1Side*p2Side < 0) && (p3Side*p4Side < 0))
        ) {

        interPoint = this.getIntersectionPoint(p1, p2, p3, p4);
        intersections.push({segment: i, point: interPoint});
    }
  }

  // more than one intersection
  if (intersections.length > 1) {
    var minDist = Infinity;
    var tmpDist;

    for (var i=0,l=intersections.length; i<l; i++) {
      tmpDist = this.dist(p1, intersections[i].point);

      if ((tmpDist != 0) && (tmpDist < minDist)) {
        interPoint = intersections[i].point;
        minDist = tmpDist;
      }
    }
  }
  
  if (interPoint) {
    if (this.dist(p1, interPoint) == 0) {
      return null;
    }

    // the mid point is outside the polygon
    if ((!ignoreSnap) && (this.whereIsThePoint({ x: (p1.x + interPoint.x)/2, y: (p1.y + interPoint.y)/2 }) == "out")) {
      return "noneValid";
    }
  }

  // ensure the point is in the grid
  if ((interPoint) && (!ignoreSnap)) {
    if ((Partition.snapToStep(interPoint.x) != interPoint.x) || ((Partition.snapToStep(interPoint.y) != interPoint.y))) {
      return "noneValid";
    }
  }

  return interPoint;
}

/**
 *
 */
Partition.Polygon.prototype.between = function(x1, x2, x3) {
  return (x1-x3)*(x2-x3) <= 0;
}

/**
 *
 */
Partition.Polygon.prototype.pointSide = function(p, p1, p2) {
  return (p2.x - p1.x)*(p.y - p1.y) - (p2.y - p1.y)*(p.x - p1.x)
}

/**
 *
 */
Partition.Polygon.prototype.dist = function(p1, p2) {
  return Math.sqrt((p2.x-p1.x)*(p2.x-p1.x) + (p2.y-p1.y)*(p2.y-p1.y));
}

/**
 *
 */
Partition.Polygon.prototype.equal = function(a, b) {
  return Math.abs(a-b) < 1e-8;
}

/**
 *
 */
Partition.Polygon.prototype.getIntersectionPoint = function(p1, p2, p3, p4) {
  var ma;
  var mb;
  var p = {};

  ma = (this.equal(p1.x-p2.x)) ? Infinity : (p2.y - p1.y) / (p2.x - p1.x);
  mb = (this.equal(p3.x-p4.x)) ? Infinity : (p3.y - p4.y) / (p3.x - p4.x);

  if (this.equal(ma-mb)) {
    // line intersection
    if (this.equal(p1.y -ma*p1.x, p3.y -mb*p3.x)) {
      console.log("line", p1, p2, p3, p4);
    }
    // none intersection
    else {
      console.log("none", p1, p2, p3, p4);
    }
    return null;
  }

  p.x = (ma*p1.x - p1.y - mb*p3.x + p3.y) / (ma - mb);
  if (this.equal(p1.x, p2.x)) {
    p.x = p1.x;
  }
  if (this.equal(p3.x, p4.x)) {
    p.x = p3.x;
  }

  p.y = ma*(p.x - p1.x) + p1.y;
  if (this.equal(p1.x, p2.x)) {
    p.y = mb*(p.x - p3.x) + p3.y;
  }

  return p;
}

/**
 *
 */
Partition.Polygon.prototype.getArea = function() {
  if (this.area) {
    return this.area;
  }

  var bb = this.getBoundingBox();
  var pointsInside = 0;
  var pointsBorder = 0;
  var whereIs;

  for(var i=bb.xMin; i<=bb.xMax; i+=30) {
    for (var j=bb.yMin; j<=bb.yMax; j+=30) {

      whereIs = this.whereIsThePoint({x: i, y: j});

      if (whereIs == "over") {
        pointsBorder++;
      }
      else if (whereIs == "in") {
        pointsInside++;
      }
    }
  }

  this.area = (pointsInside + pointsBorder/2 -1);
  return this.area;
}

/**
 *
 */
Partition.Polygon.prototype.getBoundingBox = function() {
  var bb = { xMin: Infinity, 
             xMax: -Infinity, 
             yMin: Infinity, 
             yMax: -Infinity
           };

  var vertex_i;

  for (var i=0,l=this.vertex.length; i<l; i++) {
    vertex_i = this.vertex[i];

    if (vertex_i.x < bb.xMin) {
      bb.xMin = vertex_i.x;
    }
    if (vertex_i.x > bb.xMax) {
      bb.xMax = vertex_i.x;
    }

    if (vertex_i.y < bb.yMin) {
      bb.yMin = vertex_i.y;
    }
    if (vertex_i.y > bb.yMax) {
      bb.yMax = vertex_i.y;
    }
  }

  return bb;
}

/**
 *
 */
Partition.Polygon.prototype.whereIsThePoint = function(point) {
  var vertex = this.vertex;

  var p1;
  var p2;

  for (var i=0,l = vertex.length-1; i<l; i++) {
    p1 = vertex[i];
    p2 = vertex[i+1];

    if (this.pointInsideSegment(point, p1, p2)) {
      return "over";
    }
  }

  // return this.parent.stage.getIntersection(point) ? "in" : "out";

  return this.drawingPolygon.intersects(point) ? "in" : "out";
}

Partition.Polygon.prototype.pointInsideSegment = function(point, p1, p2) {
  return this.between(p1.x, p2.x, point.x) && this.between(p1.y, p2.y, point.y) && (((point.y - p1.y)*(p2.x - p1.x) - (point.x - p1.x)*(p2.y - p1.y)) == 0)
}

/**
 *
 */
function receiveMessage(evt) {
  var data = evt.data;

  if (data.type === "exec") {
    console.log(data.name, data.value)

    if (data.name == "cutPolygonMode") {
      escena.addInitialEvents("cutPolygonMode");
    }
    else if (data.name == "measurePolygonMode") {
      escena.addInitialEvents("measurePolygonMode");
    }
    else if (data.name == "verifyPolygonMode") {
      escena.getAreas();
    }
  }
}

/**
 *
 */
function onLoad() {
  escena = new Partition.Escena(660, 390);
}

window.addEventListener("load", onLoad);
window.addEventListener("message", receiveMessage);