'use strict';

var VJS = VJS || {};

/**
 * stack namespace
 * @namespace stack
 * @memberOf VJS
 */
VJS.stack = VJS.stack || {};

/**
 * Define the model of a stack here
 *
 * @constructor
 * @class
 * @memberOf VJS.stack
 */
VJS.stack.model = function() {
    /**
     * @member
     * @type {string}
     */
    this._id = '-1';
    /**
     * @member
     * @type {string}
     */
    this._uid = null; // first stack ID -> (0020, 9056)
    /**
     * @member
     * @type {number}
     */
    this._stackID = -1;
    /**
     * @member
     * @type {Array.<VJS.frame.model>}
     */
    this._frame = [];
    /**
     * @member
     * @type {number}
     */
    this._rows = 0;
    /**
     * @member
     * @type {number}
     */
    this._columns = 0;
    /**
     * @member
     * @type {number}
     */
    this._nbFrames = 0;
    /**
     * @member
     * @type {Object}
     * @property {number} row
     * @property {number} column
     */
    this._pixelSpacing = {
        'row': 0,
        'column': 0
    };
    /**
     * @member
     * @type {number}
     */
    this._sliceThickness = 0;


    // origin of the first slice of the stack!
    this._origin = null;
    this._halfDimensions = null;
    this._orientation = null;

    this._textureSize = 2048;
    this._nbTextures = 16; // HIGH RES..
    this._rawData = [];

    this._ijk2LPS = null;
    this._lps2IJK = null;
};

/**
 * here me make sure eveything is ready for visualization.
 * might also have a switch to say what we can view and what we can not view with current stack
 *
 * @public
 */
VJS.stack.model.prototype.prepare = function() {
    // order the frames based on theirs dimension indices
    // first index is the most important.
    // 1,1,1,1 willl be first
    // 1,1,2,1 will be next
    // 1,1,2,3 will be next
    // 1,1,3,1 wil be next
    window.console.log(this);
    this._frame.sort(VJS.stack.model.prototype.orderFrameOnDimensionIndices);
    // get height of the stack (i.e. number of frames)
    this._nbFrames = this._frame.length;
    // can we calculate that? might have to parse all frames to make sure it is consistent...
    this._rows = this._frame[0]._rows;
    this._columns = this._frame[0]._columns;
    this._pixelSpacing.row = this._frame[0]._pixelSpacing.row;
    this._pixelSpacing.column = this._frame[0]._pixelSpacing.column;
    this._sliceThickness = this._frame[0]._sliceThickness;

    for (var i = 0; i < this._frame.length; i++) {

        // check rows consistency
        if (this._rows !== this._frame[i]._rows) {
            // send an error message...
            window.console.log('Numbers of rows in stack\'s frames is not consistent.');
            window.console.log(this);
            window.console.log('First frame had: ', this._rows, ' rows');
            window.console.log('Frame index: ', i, ' has: ', this._frame[i]._rows, ' rows.');
        }

        // check columns consitency
        if (this._columns !== this._frame[i]._columns) {
            // send an error message...
            window.console.log('Numbers of columns in stack\'s frames is not consistent.');
            window.console.log(this);
            window.console.log('First frame had: ', this._columns, ' columns.');
            window.console.log('Frame index: ', i, ' has: ', this.frame[i]._columns, ' columns.');
        }

        // check for spacing consistency
        if (this._pixelSpacing.row !== this._frame[i]._pixelSpacing.row || this._pixelSpacing.column !== this._frame[i]._pixelSpacing.column) {
            // send an error message...
            window.console.log('Spacing in stack\'s frames is not consistent.');
            window.console.log(this);
            window.console.log('First frame had : ', this._pixelSpacing.row, ' x ', this._pixelSpacing.column, ' spacing.');
            window.console.log('Frame index : ', i, ' has: ', this._frame[i]._pixelSpacing.row, ' x ', this._frame[i]._pixelSpacing.column, ' spacing.');
        }

        // check for slice thickness consistency
        if (this._sliceThickness !== this._frame[i]._sliceThickness) {
            window.console.log('Slice thickness in stack\'s frames is not consistent.');
            window.console.log(this);
            window.console.log('First frame had: ', this._sliceThickness, ' sliceThickness.');
            window.console.log('Frame index: ', i, ' has: ', this._frame[i]._sliceThickness, ' sliceThickness.');
        }
    }

    // half dimensions are useful for faster computations of intersection.
    this._halfDimensions = new THREE.Vector3(this._rows / 2, this._columns / 2, this._nbFrames / 2);

    // orientation needed to compute stack BBox interection against slice.
    var baseX = new THREE.Vector3(1, 0, 0);
    var baseY = new THREE.Vector3(0, 1, 0);
    var baseZ = new THREE.Vector3(0, 0, 1);
    this._orientation = new THREE.Vector3(baseX, baseY, baseZ);

    // IJK to LPS transform.
    // and inverse.
    this._origin = this._frame[0]._imagePositionPatient;

    var xCosine = new THREE.Vector3(
        this._frame[0]._imageOrientationPatient.row.x,
        this._frame[0]._imageOrientationPatient.row.y,
        this._frame[0]._imageOrientationPatient.row.z
    );
    var yCosine = new THREE.Vector3(
        this._frame[0]._imageOrientationPatient.column.x,
        this._frame[0]._imageOrientationPatient.column.y,
        this._frame[0]._imageOrientationPatient.column.z
    );
    var zCosine = new THREE.Vector3(0, 0, 0).crossVectors(xCosine, yCosine).normalize();

    this._ijk2LPS = new THREE.Matrix4();
    this._ijk2LPS.set(
        xCosine.x * this._pixelSpacing.row, yCosine.x * this._pixelSpacing.column, zCosine.x * this._sliceThickness, this._origin.x,
        xCosine.y * this._pixelSpacing.row, yCosine.y * this._pixelSpacing.column, zCosine.y * this._sliceThickness, this._origin.y,
        xCosine.z * this._pixelSpacing.row, yCosine.z * this._pixelSpacing.column, zCosine.z * this._sliceThickness, this._origin.z,
        0, 0, 0, 1);


    this._lps2IJK = new THREE.Matrix4();
    this._lps2IJK.getInverse(this._ijk2LPS);

    window.console.log(this._lps2IJK, this._ijk2LPS);

    // only works with 1 channel for now...
    var requiredPixels = this._rows * this._columns * this._nbFrames;

    var nbChannels = 1;
    for (var ii = 0; ii < this._nbTextures; ii++) {
        this._rawData.push(new Uint8Array(this._textureSize * this._textureSize * nbChannels));
    }

    // Can not just use subarray because we have to normalize the values (Uint* 0<x<255)
    for (var jj = 0; jj < requiredPixels; jj++) {

        var frameIndex = Math.floor(jj / (this._rows * this._columns));
        var inFrameIndex = jj % (this._rows * this._columns);
        var textureIndex = Math.floor(jj / (this._textureSize * this._textureSize));
        var inTextureIndex = jj % (this._textureSize * this._textureSize);

        // window.console.log(textureIndex, inTextureIndex);
        // different ways to itereate if 1 or N channels!!
        // just 1 for now!
        // NORMAALIZE IN THE SHADERS!
        // could track min/max here...?

        this._rawData[textureIndex][inTextureIndex] = this._frame[frameIndex]._pixelData[inFrameIndex]; //Math.floor( Math.random() * 255 );

        // // normalize value
        // var normalizedValue = 255 * ((this._data[j] - this._min) / (this._max - this._min));

        // // RGB
        // rawData[textureIndex][4 * inTextureIndex] = normalizedValue;

        // if (inTextureIndex >= requiredPixels) {
        //     break;
        // }
    }

    // LPS to World.
    // and inverse.

    // all IJK coords + transform for origin and normal to be in same space!

    //     var obb = {
    //     'halfDimensions': this._volumeCore._halfDimensions,
    //     'orientation': this._volumeCore._orientation,
    //     'center': this._volumeCore._halfDimensions, //this._volumeCore._RAS.center,
    //     'toOBBSpace': this._volumeCore._transforms.ras2ijk,
    //     'toOBBSpaceInvert': this._volumeCore._transforms.ijk2ras,
    // };

    // var plane = {
    //     'origin': this._origin,
    //     'normal': this._normal
    // };

    // SWITCH TO DECIDE WHAT WE CAN VIEW OR NOT FROM HERE!
};

/**
 * Order frames based on theirs dimensionIndexValues
 */
VJS.stack.model.prototype.orderFrameOnDimensionIndices = function(a, b) {

    if ('_dimensionIndexValues' in a && Object.prototype.toString.call(a._dimensionIndexValues) === '[object Array]' && '_dimensionIndexValues' in b && Object.prototype.toString.call(b._dimensionIndexValues) === '[object Array]') {
        for (var i = 0; i < a._dimensionIndexValues.length; i++) {
            if (a._dimensionIndexValues[i] > b._dimensionIndexValues[i]) {
                return false;
            }
        }
    } else {
        window.console.log('One of the frames doesn\'t have a _dimensionIndexValues array.');
        window.console.log(a);
        window.console.log(b);

        // return what?
        return true;
    }
};
