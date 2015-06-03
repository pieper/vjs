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
VJS.widgets.imageProbe = function() {
  this.domElement = null;
  this.rasContainer = null;
  this.ijkContainer = null;
  this.valueContainer = null;

  this.imageHelper = null;
  this.image = null;

  this.volumeCore = null;

  this.createDomElement();
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


VJS.widgets.imageProbe.prototype.updateUI3 = function(world) {
  // convert point to IJK
  if (this.image) {
    var worldToData = this.image._stack[0]._lps2IJK;
    var ijk = new THREE.Vector3().copy(world).applyMatrix4(worldToData);
    ijk.x = Math.round(ijk.x);
    ijk.y = Math.round(ijk.y);
    ijk.z = Math.round(ijk.z);

    var textureSize = this.image._stack[0]._textureSize;
    var rows = this.image._stack[0]._rows;
    var columns = this.image._stack[0]._columns;

    var index = ijk.x + columns * ijk.y + rows * columns * ijk.z;

    var textureIndex = Math.floor(index / (textureSize * textureSize));
    var inTextureIndex = index % (textureSize * textureSize);

    var value = this.image._stack[0]._rawData[textureIndex][inTextureIndex];

    this.updateUI2(world, ijk, value);
  }
};

VJS.widgets.imageProbe.prototype.updateUI2 = function(ras, ijk, value) {
  var rasContent = ras.x.toFixed(2) + ' : ' + ras.y.toFixed(2) + ' : ' + ras.z.toFixed(2);
  this.rasContainer.innerHTML = 'LPS: ' + rasContent;

  var ijkContent = Math.floor(ijk.x) + ' : ' + Math.floor(ijk.y) + ' : ' + Math.floor(ijk.z);
  this.ijkContainer.innerHTML = 'IJK: ' + ijkContent;

  var valueContent = value;
  this.valueContainer.innerHTML = 'Value: ' + valueContent;
};

