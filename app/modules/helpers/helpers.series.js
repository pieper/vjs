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
    //this._stacks = [];

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

        var position = new THREE.Vector3(0, 0, 0);
        // we want to center the slice on a voxel (not at the limit between 2 voxels)
        // precision issue if at limit (pixels intensity flickers between voxels)
        if (dimensions.x % 2 === 0) {
            position.x = -0.5;
        }
        if (dimensions.y % 2 === 0) {
            position.y = -0.5;
        }
        if (dimensions.z % 2 === 0) {
            position.z = -0.5;
        }

        var direction = new THREE.Vector3(0, 0, 1);

        var sliceGeometry = new vjsSliceGeometries(
            halfDimensions, center, orientation,
            position, direction);
        sliceGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(
            halfDimensions.x + offset.x, halfDimensions.y + offset.y, halfDimensions.z + offset.z));
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
            'uniforms': vjsShadersData.parameters.uniforms,
            'vertexShader': glslify('../shaders/shaders.data.vert'),
            'fragmentShader': glslify('../shaders/shaders.data.frag')
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
        window.console.log('no series to be prepared...');
    }
};

// export the slice geometry module
module.exports = VJS.helpers.series;