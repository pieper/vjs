'use strict';

var VJS = VJS || {};
VJS.helpers = VJS.helpers || {};

/*** Imports ***/

VJS.geometries = VJS.geometries || {};
VJS.geometries.slice = VJS.geometries.slice || require('../geometries/geometries.slice');

VJS.shaders = VJS.shaders || {};
VJS.shaders.data = VJS.shaders.data || require('../shaders/shaders.data');

VJS.extras = VJS.extras || {};
VJS.extras.lut = require('../../src/extras/extras.lut');

var glslify =  require('glslify');

//
// https://en.wikipedia.org/wiki/Immediately-invoked_function_expression
// input is a series
VJS.helpers.slice = function(series) {

  this._series = series;

  THREE.Object3D.call(this);

  // bounding box
  // -> show/hide
  // -> color
  // -> update()
  this._bBox = {
    visible: true,
    color: 0x61F2F3,
    material: null,
    geometry: null,
    mesh: null
  };

  // arrow
  // -> show/hide
  // -> color
  // -> update()
  this._arrow = {
    visible: true,
    color: 0xFFF336,
    length: 20,
    material: null,
    geometry: null,
    mesh: null
  };

  // border
  // -> show/hide
  // -> color
  // -> update()
  this._border = {
    visible: true,
    color: 0xff0000,
    material: null,
    geometry: null,
    mesh: null
  };
  
  // slice
  // -> show/hide
  // -> autoWindow/Level ? (might be for the frame helper)
  // -> index()
  // -> direction(arrow position, arrow direction)
  // -> lut(lutObj)
  // with composer? (maybe lut too...?)
  // -> labelmap(labelMap?)
  // -> dosemap(doseMap?)
  this._slice = {
    visible: true,
    position: null,
    direction: null,
    index: null,
    windowWidth: null,
    windowCenter: null,
    windowAuto: true,
    invert: false,
    lut: 'none',
    material: null,
    geometry: null,
    mesh: null
  };

  // ...
  this._uniforms = null;
  this._autoWindowLevel = false;

};

VJS.helpers.slice.prototype = Object.create(THREE.Object3D.prototype);

VJS.helpers.slice.prototype.constructor = VJS.helpers.slice;

VJS.helpers.slice.prototype.createBBox = function(stack, bbox) {
  // Convenience vars
  var dimensions = stack._dimensions;
  var halfDimensions = stack._halfDimensions;
  var offset = new THREE.Vector3(-0.5, -0.5, -0.5);

  // Geometry
  bbox.geometry = new THREE.BoxGeometry(
      dimensions.x, dimensions.y, dimensions.z);
  bbox.geometry .applyMatrix(new THREE.Matrix4().makeTranslation(
      halfDimensions.x + offset.x, halfDimensions.y + offset.y, halfDimensions.z + offset.z));
  bbox.geometry .applyMatrix(stack._ijk2LPS);

  // Material
  bbox.material = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: bbox.color
    });

  // mesh
  bbox.mesh = new THREE.Mesh(bbox.geometry, bbox.material);
  bbox.mesh.visible = bbox.visible;
};

VJS.helpers.slice.prototype.createSlice = function(stack, slice) {
  // Convenience vars
  var halfDimensions = stack._halfDimensions;
  var offset = new THREE.Vector3(-0.5, -0.5, -0.5);
  var center = new THREE.Vector3(0, 0, 0);
  var orientation = new THREE.Vector3(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1));

  // default position of the middle frame
  if (slice.index === null) {
    slice.index = Math.floor(halfDimensions.z);
  }

  this.updateSliceWindowLevel();

  // compute position based on index
  // should have a switch (indexed or freemode)
  slice.position = new THREE.Vector3(
    0,
    0,
    slice.index + 0.5 - stack._halfDimensions.z
  );

  // should be able to choose that too!
  slice.direction = new THREE.Vector3(0, 0, 1);

  slice.geometry = new VJS.geometries.slice(
      halfDimensions,
      center,
      orientation,
      slice.position,
      slice.direction);
  slice.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(
      halfDimensions.x + offset.x, halfDimensions.y + offset.y, halfDimensions.z + offset.z));
  slice.geometry.applyMatrix(stack._ijk2LPS);

  if (!slice.material) {
    // compute texture if material exist
    var textures = [];
    for (var m = 0; m < stack._nbTextures; m++) {
      var tex = new THREE.DataTexture(stack._rawData[m], stack._textureSize, stack._textureSize, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
      tex.needsUpdate = true;
      textures.push(tex);
    }

    var sliceMaterial = new THREE.ShaderMaterial({
      // 'wireframe': true,
      'side': THREE.DoubleSide,
      'transparency': true,
      'uniforms': VJS.shaders.data.parameters.uniforms,
      'vertexShader': glslify('../shaders/shaders.data.vert'),
      'fragmentShader': glslify('../shaders/shaders.data.frag')
    });

    // important so uniforms are not overwritten!
    // clone it!
    slice.material = sliceMaterial.clone();

    // update textures
    slice.material.uniforms.uTextureContainer.value = textures;
  }

  // stack related uniform
  slice.material.uniforms.uTextureSize.value = stack._textureSize;
  slice.material.uniforms.uDataDimensions.value = stack._dimensions;
  slice.material.uniforms.uWorldToData.value = stack._lps2IJK;
  slice.material.uniforms.uNumberOfChannels.value = stack._numberOfChannels;
  slice.material.uniforms.uBitsAllocated.value = stack._bitsAllocated;
  // other uniforms
  this.updateCosmeticUniforms();

  slice.mesh = new THREE.Mesh(slice.geometry, slice.material);
  slice.mesh.visible = slice.visible;
};

VJS.helpers.slice.prototype.updateSliceWindowLevel = function() {
  var stack =  this._series._stack[0];
  if (this._slice.windowAuto) {
    if (stack._frame[this._slice.index]._windowCenter) {
      this._slice.windowCenter = stack._frame[this._slice.index]._windowCenter;
    } else {
      this._slice.windowCenter = stack._windowCenter;
    }
    if (stack._frame[this._slice.index]._windowWidth) {
      this._slice.windowWidth = stack._frame[this._slice.index]._windowWidth;
    } else {
      this._slice.windowWidth = stack._windowWidth;
    }
  } else if (this._slice.windowCenter === null || this._slice.windowWidth === null) {
    this._slice.windowCenter = stack._windowCenter;
    this._slice.windowWidth = stack._windowWidth;
  }
};

VJS.helpers.slice.prototype.updateCosmeticUniforms = function() {

  // set slice window center and width
  this._slice.material.uniforms.uWindowLevel.value = [this._slice.windowCenter, this._slice.windowWidth];

  // invert
  this._slice.material.uniforms.uInvert.value = this._slice.invert === true ? 1 : 0;

  // lut
  if (this._slice.lut === 'none') {
    this._slice.material.uniforms.uLut.value = 0;
  } else {
    // format LUT (max size 16)
    //
    var irgb = VJS.extras.lut.toIRGB(VJS.extras.lut[this._slice.lut]().data);

    this._slice.material.uniforms.uLutI.value = irgb[0];
    this._slice.material.uniforms.uLutR.value = irgb[1];
    this._slice.material.uniforms.uLutG.value = irgb[2];
    this._slice.material.uniforms.uLutB.value = irgb[3];
    this._slice.material.uniforms.uLut.value = 1;
  }
};

VJS.helpers.slice.prototype.createBorder = function(slice, border) {
  border.material = new THREE.LineBasicMaterial({
      color: border.color,
      polygonOffset: true,
      polygonOffsetFactor: -0.1
    });
    
  border.geometry = new THREE.Geometry();
  for (var i = 0; i < slice.geometry.vertices.length; i++) {
    border.geometry.vertices.push(slice.geometry.vertices[i]);
  }
  border.geometry.vertices.push(slice.geometry.vertices[0]);

  border.mesh = new THREE.Line(border.geometry, border.material);
  border.mesh.visible = border.visible;
};

VJS.helpers.slice.prototype.prepare = function() {

  if (this._series) {

    // get first stack and prepare it
    // make sure there is something, if not throw an error
    var stack = this._series._stack[0];
    stack.prepare();

    // Bounding Box
    this.createBBox(stack, this._bBox);
    this.add(this._bBox.mesh);
    
    // Slice
    this.createSlice(stack, this._slice);
    this.add(this._slice.mesh);

    // Border
    this.createBorder(this._slice, this._border);
    this.add(this._border.mesh);

    // todo: Arrow

  } else {
    window.console.log('no series to be prepared...');
  }
};

VJS.helpers.slice.prototype.updateSlice = function() {
  var stack = this._series._stack[0];

  // update slice
  this.remove(this._slice.mesh);
  this._slice.mesh.geometry.dispose();
  // we do not want to dispose the texture!
  // this._slice.mesh.material.dispose();
  this._slice.mesh = null;
  this.createSlice(stack, this._slice);
  this.add(this._slice.mesh);
};

VJS.helpers.slice.prototype.updateBorderGeometry = function() {

  var borderGeometry = new THREE.Geometry();
  for (var i = 0; i < this._slice.geometry.vertices.length; i++) {
    borderGeometry.vertices.push(this._slice.geometry.vertices[i]);
  }
  borderGeometry.vertices.push(this._slice.geometry.vertices[0]);

  this._border.geometry.vertices = borderGeometry.vertices;
  this._border.geometry.verticesNeedUpdate = true;
};

// a delete method too!

/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
  module.exports = VJS.helpers.slice;
}
