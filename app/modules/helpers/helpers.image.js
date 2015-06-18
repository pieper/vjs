'use strict';

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
VJS.helpers.image = function() {

  THREE.Object3D.call(this);

  // ...
  this._image = null;
  //this._stacks = [];

};

VJS.helpers.image.prototype = Object.create(THREE.Object3D.prototype);

VJS.helpers.image.prototype.constructor = VJS.helpers.image;

VJS.helpers.image.prototype.merge = function(imageHelper) {
  return this._image.merge(imageHelper._image);
};

VJS.helpers.image.prototype.addImage = function(image) {
  this._image = image;
};

VJS.helpers.image.prototype.getStack = function(stackIndex) {
  return stackIndex;
};

VJS.helpers.image.prototype.prepare = function() {
  // try to merge image to current image...
  // cleanup previous state...

  window.console.log('helpers Image Prepare!!!');
  if (this._image) {

    // get first stack!
    var stack = this._image._stack[0];
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

    var position = new THREE.Vector3(0, 0, 0);
    // we want to center the slice on a voxel (not at the limit between 2 voxels)
    // precision issue if at limit (pixels intensity flickers between voxels)
    if(dimensions.x%2 === 0 ){
      position.x = -0.5;
    }
    if(dimensions.y%2 === 0 ){
      position.y = -0.5;
    }
    if(dimensions.z%2 === 0 ){
      position.z = -0.5;
    }

    var direction = new THREE.Vector3(0, 0, 1);

    var sliceGeometry = new VJS.geometries.slice(
      halfDimensions, center, orientation,
      position, direction);
    sliceGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(
      halfDimensions.x  + offset.x, halfDimensions.y  + offset.y, halfDimensions.z  + offset.z));
    sliceGeometry.applyMatrix(stack._ijk2LPS);

    // Slice
    // Material
    var textures = [];
    for (var m = 0; m < stack._nbTextures; m++) {
      var tex = new THREE.DataTexture(stack._rawData[m], stack._textureSize, stack._textureSize, THREE.LuminanceFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
      tex.needsUpdate = true;
      textures.push(tex);
    }

    var sliceMaterial = new THREE.ShaderMaterial({
      // 'wireframe': true,
      'side': THREE.DoubleSide,
      'transparency': true,
      'uniforms': VJS.shaders.data.parameters.uniforms,
      'vertexShader': VJS.shaders.data.parameters.vertexShader,
      'fragmentShader': VJS.shaders.data.parameters.fragmentShader,
    });

    // important so uniforms are not overwritten!
    // clone it!
    var mySliceMaterial = sliceMaterial.clone();
    var uniforms = mySliceMaterial.uniforms;
    uniforms.uTextureSize.value = stack._textureSize;
    uniforms.uTextureContainer.value = textures;
    // texture dimensions
    uniforms.uDataDimensions.value = stack._dimensions;
    // world to model
    uniforms.uWorldToData.value = stack._lps2IJK;

    var slice = new THREE.Mesh(sliceGeometry, mySliceMaterial);
    this.add(slice);

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
    var borderLine = new THREE.Line(borderGeometry, borderMaterial);
    this.add(borderLine);

  } else {
    window.console.log('no image to be prepared...');
    //this._image.merge(image);
  }
};
