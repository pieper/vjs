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
 * Demo: {@link https://fnndsc.github.io/vjs#widget_imageProbe}
 *
 * @constructor
 * @class
 * @memberOf VJS.widgets
 * @public
 *
 */
VJS.widgets.imageProbe = function(image, imageMeshes) {
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

VJS.widgets.imageProbe.prototype.createDomElement = function() {

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

VJS.widgets.imageProbe.prototype.computeValues = function() {
  // convert point to IJK
  if (this.image) {
    var worldToData = this.image._stack[0]._lps2IJK;

    var dataCoordinate = new THREE.Vector3().copy(this._worldCoordinate).applyMatrix4(worldToData);
    dataCoordinate.x = Math.round(dataCoordinate.x);
    dataCoordinate.y = Math.round(dataCoordinate.y);
    dataCoordinate.z = Math.round(dataCoordinate.z);
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

VJS.widgets.imageProbe.prototype.updateUI = function() {
  var rasContent = this._worldCoordinate.x.toFixed(2) + ' : ' + this._worldCoordinate.y.toFixed(2) + ' : ' + this._worldCoordinate.z.toFixed(2);
  this.rasContainer.innerHTML = 'World Coordinates (LPS): ' + rasContent;

  var ijkContent = Math.floor(this._dataCoordinate.x) + ' : ' + Math.floor(this._dataCoordinate.y) + ' : ' + Math.floor(this._dataCoordinate.z);
  this.ijkContainer.innerHTML = 'Data Coordinates (IJK): ' + ijkContent;

  var valueContent = this._dataValue;
  this.valueContainer.innerHTML = 'Data Value: ' + valueContent;
};

VJS.widgets.imageProbe.prototype.update = function(raycaster) {

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
      this.computeValues();
      this.updateUI();
      break;
    }
  }
};

