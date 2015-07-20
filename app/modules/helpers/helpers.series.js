'use strict';

var vjsSliceGeometries = require('../geometries/geometries.slice');
var vjsShadersData = require('../shaders/shaders.data');
var glslify = require('glslify');

var VJS = VJS || {};

/**
 * helpers namespace
 * @namespace helpers
 * @memberOf VJS
 * @public
 */
VJS.helpers = VJS.helpers || {};

//
// https://en.wikipedia.org/wiki/Immediately-invoked_function_expression
VJS.helpers.series = function() {

  THREE.Object3D.call(this);

  // ...
  this._series = null;
  this._uniforms = null;
  this._frameIndex = null;
  this._slice = null;
  this._border = null;

};

VJS.helpers.series.prototype = Object.create(THREE.Object3D.prototype);

VJS.helpers.series.prototype.constructor = VJS.helpers.series;

VJS.helpers.series.prototype.merge = function(seriesHelper) {
  return this._series.merge(seriesHelper._series);
};

VJS.helpers.series.prototype.addSeries = function(series) {
  this._series = series;
};

VJS.helpers.series.prototype.getStack = function(stackIndex) {
  return stackIndex;
};

VJS.helpers.series.prototype.prepare = function() {

  window.console.log('helpers Series Prepare!!!');
  if (this._series) {

    // get first stack!
    var stack = this._series._stack[0];
    stack.prepare();
    window.console.log(stack);

    // Convenience function
    var dimensions = stack._dimensions;
    var halfDimensions = stack._halfDimensions;

    // voxel offset
    var offset = new THREE.Vector3(-0.5, -0.5, -0.5);

    // Bounding Box
    var geometry = new THREE.BoxGeometry(
        dimensions.x, dimensions.y, dimensions.z);
    geometry.applyMatrix(new THREE.Matrix4().makeTranslation(
        halfDimensions.x + offset.x, halfDimensions.y + offset.y, halfDimensions.z + offset.z));
    geometry.applyMatrix(stack._ijk2LPS);
    var material = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 0x61F2F3
    });
    var cube = new THREE.Mesh(geometry, material);
    this.add(cube);

    // Slice
    // Geometry
    //

    // Define the bouding box used to generate the slice geometry
    // center
    // orientation
    // and half-dimensions
    var center = new THREE.Vector3(0, 0, 0);
    var orientation = new THREE.Vector3(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1));

    var position = new THREE.Vector3(
      Math.floor(stack._halfDimensions.x),
      Math.floor(stack._halfDimensions.y),
      Math.floor(stack._halfDimensions.z) + 0.5 - stack._halfDimensions.z
    );

    var direction = new THREE.Vector3(0, 0, 1);

    var sliceGeometry = new vjsSliceGeometries(
        halfDimensions, center, orientation,
        position, direction);
    sliceGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(
        halfDimensions.x + offset.x, halfDimensions.y + offset.y, halfDimensions.z + offset.z));
    sliceGeometry.applyMatrix(stack._ijk2LPS);

    // update _framIndex
    this._frameIndex = Math.round(halfDimensions.z);

    // Slice
    // Material
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
      'uniforms': vjsShadersData.parameters.uniforms,
      'vertexShader': glslify('../shaders/shaders.data.vert'),
      'fragmentShader': glslify('../shaders/shaders.data.frag')
    });

    // important so uniforms are not overwritten!
    // clone it!
    var mySliceMaterial = sliceMaterial.clone();
    this._uniforms = mySliceMaterial.uniforms;
    this._uniforms.uTextureSize.value = stack._textureSize;
    this._uniforms.uTextureContainer.value = textures;
    // texture dimensions
    this._uniforms.uDataDimensions.value = stack._dimensions;
    // world to model
    this._uniforms.uWorldToData.value = stack._lps2IJK;
    // window level
    this._uniforms.uWindowLevel.value = stack._windowLevel;
    this._uniforms.uNumberOfChannels.value = stack._numberOfChannels;
    this._uniforms.uBitsAllocated.value = stack._bitsAllocated;
    this._uniforms.uInvert.value = stack._invert;

    this._slice = new THREE.Mesh(sliceGeometry, mySliceMaterial);
    this.add(this._slice);

    // Border of the slice
    var borderMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
      polygonOffset: true,
      polygonOffsetFactor: -0.1
    });
    var borderGeometry = new THREE.Geometry();
    for (var i = 0; i < sliceGeometry.vertices.length; i++) {
      borderGeometry.vertices.push(sliceGeometry.vertices[i]);
    }
    borderGeometry.vertices.push(sliceGeometry.vertices[0]);

    // borderGeometry.vertices = sliceGeometry.vertices;
    this._border = new THREE.Line(borderGeometry, borderMaterial);
    this.add(this._border);

  } else {
    window.console.log('no series to be prepared...');
  }
};

VJS.helpers.series.prototype.updateSliceGeometry = function() {
  var stack = this._series._stack[0];
  var halfDimensions = stack._halfDimensions;
  // voxel offset
  var offset = new THREE.Vector3(-0.5, -0.5, -0.5);

  var center = new THREE.Vector3(0, 0, 0);
  var orientation = new THREE.Vector3(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1));

  var position = new THREE.Vector3(
    0,
    0,
    this._frameIndex + 0.5 - stack._halfDimensions.z
    );

  var direction = new THREE.Vector3(0, 0, 1);

  var sliceGeometry = new vjsSliceGeometries(
      halfDimensions, center, orientation,
      position, direction);
  sliceGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(
      halfDimensions.x + offset.x, halfDimensions.y + offset.y, halfDimensions.z + offset.z));
  sliceGeometry.applyMatrix(stack._ijk2LPS);

  // helper - update Geometry
  //is memory leaking???

  this._slice.geometry = sliceGeometry;
  this._slice.geometry.verticesNeedUpdate = true;
};

VJS.helpers.series.prototype.updateBorderGeometry = function() {

  var borderGeometry = new THREE.Geometry();
  for (var i = 0; i < this._slice.geometry.vertices.length; i++) {
    borderGeometry.vertices.push(this._slice.geometry.vertices[i]);
  }
  borderGeometry.vertices.push(this._slice.geometry.vertices[0]);

  this._border.geometry.vertices = borderGeometry.vertices;
  this._border.geometry.verticesNeedUpdate = true;
};

// export the slice geometry module
module.exports = VJS.helpers.series;
