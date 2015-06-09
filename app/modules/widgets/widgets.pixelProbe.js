'use strict';

var VJS = VJS || {};

/**
 * widgets namespace
 * @namespace widgets
 * @memberOf VJS
 * @public
 */
VJS.widgets = VJS.widgets || {};

/**
 *
 * It is typically used to get information about an image from the mouse cursor.
 *
 * Demo: {@link https://fnndsc.github.io/vjs#widget_pixelProbe}
 *
 * @constructor
 * @class
 * @memberOf VJS.widgets
 * @public
 *
 */
VJS.widgets.pixelProbe = function(image, imageMeshes) {
  this.domElement = null;
  this.rasContainer = null;
  this.ijkContainer = null;
  this.valueContainer = null;

  this.imageMeshes = imageMeshes;
  this.image = image;

  this.volumeCore = null;

  this.createDomElement();

  this._worldCoordinate = null;  //LPS
  this._dataCoordinate = null; //IJK
  this._dataValue = null;        //
  this._labelValue = null;       //
};

VJS.widgets.pixelProbe.prototype.createDomElement = function() {

  // RAS
  this.rasContainer = document.createElement('div');
  this.rasContainer.setAttribute('id', 'VJSProbeRAS');

  // IJK
  this.ijkContainer = document.createElement('div');
  this.ijkContainer.setAttribute('id', 'VJSProbeIJK');

  // Value
  this.valueContainer = document.createElement('div');
  this.valueContainer.setAttribute('id', 'VJSProbeValue');

  this.domElement = document.createElement('div');
  this.domElement.setAttribute('id', 'VJSProbe');
  this.domElement.appendChild(this.rasContainer);
  this.domElement.appendChild(this.ijkContainer);
  this.domElement.appendChild(this.valueContainer);
};

VJS.widgets.pixelProbe.prototype.computeValues = function() {
  // convert point to IJK
  if (this.image) {
    var worldToData = this.image._stack[0]._lps2IJK;

    var dataCoordinate = new THREE.Vector3().copy(this._worldCoordinate).applyMatrix4(worldToData);
    
    // same rounding in the shaders
    // window.console.log(dataCoordinate);
    dataCoordinate.x = Math.floor(dataCoordinate.x + 0.5);
    dataCoordinate.y = Math.floor(dataCoordinate.y + 0.5);
    dataCoordinate.z = Math.floor(dataCoordinate.z + 0.5);
    this._dataCoordinate = dataCoordinate;

    var textureSize = this.image._stack[0]._textureSize;
    var rows = this.image._stack[0]._rows;
    var columns = this.image._stack[0]._columns;

    var index = this._dataCoordinate.x + columns * this._dataCoordinate.y + rows * columns * this._dataCoordinate.z;

    var textureIndex = Math.floor(index / (textureSize * textureSize));
    var inTextureIndex = index % (textureSize * textureSize);

    this._dataValue = this.image._stack[0]._rawData[textureIndex][inTextureIndex];
  }
};

VJS.widgets.pixelProbe.prototype.updateUI = function(mouse) {
  var rasContent = this._worldCoordinate.x.toFixed(2) + ' : ' + this._worldCoordinate.y.toFixed(2) + ' : ' + this._worldCoordinate.z.toFixed(2);
  this.rasContainer.innerHTML = 'LPS: ' + rasContent;

  var ijkContent = this._dataCoordinate.x + ' : ' + this._dataCoordinate.y + ' : ' + this._dataCoordinate.z;
  this.ijkContainer.innerHTML = 'IJK: ' + ijkContent;

  var valueContent = this._dataValue;
  this.valueContainer.innerHTML = 'Value: ' + valueContent;

  // position of the div...
  // need a mode to track the mouse
  document.getElementById('VJSProbe').style.display = 'block';
  document.getElementById('VJSProbe').style.top = mouse.clientY + 20;
  document.getElementById('VJSProbe').style.left = mouse.clientX + 20;
  
};

VJS.widgets.pixelProbe.prototype.update = function(raycaster, mouse) {

  if(!this.imageMeshes){
    return;
  }

  // calculate image intersecting the picking ray
  var intersects = raycaster.intersectObjects(this.imageMeshes);

  for (var intersect in intersects) {
    var worldCoordinates = new THREE.Vector3().copy(intersects[intersect].point);
    
    // if we intersect an image with a ShaderMaterial
    // TODO: review that
    if (intersects[intersect].object.material.type === 'ShaderMaterial') {
      this._worldCoordinate = worldCoordinates;
      // window.console.log(this._worldCoordinate);
      this.computeValues();
      this.updateUI(mouse);
      return;
    }
  }

  // hide UI if not intersecting the planne
  this.hideUI();
};

VJS.widgets.pixelProbe.prototype.hideUI = function(){
  document.getElementById('VJSProbe').style.display = 'none';
};