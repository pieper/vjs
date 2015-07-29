'use strict';

var VJS = VJS || {};
VJS.models = VJS.models || {};

/**
 * Define the stack object here
 *
 * @constructor
 * @class
 * @memberOf VJS.models
 * @public
 */
VJS.models.stack = function() {
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
  this._numberOfFrames = 0;
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
  this._spacingBetweenSlices = 0;
  /**
   * @member
   * @type {number}
   */
  this._sliceThickness = 0;

  // origin of the first slice of the stack!
  this._origin = null;
  this._halfDimensions = null;
  this._orientation = null;

  this._textureSize = 4096;
  this._nbTextures = 7; // HIGH RES..
  this._rawData = [];
  // this._windowCenter = 0;
  // this._windowWidth = 0;
  this._windowLevel = [0, 0];
  this._windowCenter = 0;
  this._windowWidth = 0;
  this._minMax = [65535, -32768];
  this._invert = false;

  this._ijk2LPS = null;
  this._lps2IJK = null;

  // Slicer values
  this._dimensions = null;
  this._spacing = null;
  this._origin = null;
  this._direction = null;
};

/**
 * here me make sure eveything is ready for visualization.
 * might also have a switch to say what we can view and what we can not view with current stack
 *
 * @public
 */
VJS.models.stack.prototype.prepare = function() {

  // dimensions of the stack
  this._numberOfFrames = this._frame.length;

  window.console.log(this);
  this.orderFrames();
  var zSpacing = this.zSpacing();

  // prepare the frame
  if (this._frame[0]._pixelSpacing) {
    this._pixelSpacing.row = this._frame[0]._pixelSpacing[0];
    this._pixelSpacing.column = this._frame[0]._pixelSpacing[1];
  } else if (this._frame[0]._pixelAspectRatio) {
    this._pixelSpacing.row = 1.0;
    this._pixelSpacing.column = 1.0 * this._frame[0]._pixelAspectRatio[1] / this._frame[0]._pixelAspectRatio[0];
  } else {
    this._pixelSpacing.row = 1.0;
    this._pixelSpacing.column = 1.0;
  }

  if (!this._frame[0]._imagePosition) {
    this._frame[0]._imagePosition = [0, 0, 0];
  }

  if (!this._frame[0]._imageOrientation) {
    this._frame[0]._imageOrientation = [1, 0, 0, 0, 1, 0];
  }

  this._rows = this._frame[0]._rows;
  this._columns = this._frame[0]._columns;
  this._dimensions = new THREE.Vector3(this._columns, this._rows, this._numberOfFrames);

  this._spacingBetweenSlices = this._frame[0]._spacingBetweenSlices;
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

    // // check for spacing consistency
    // if (this._pixelSpacing.row !== this._frame[i]._pixelSpacing[0] || this._pixelSpacing.column !== this._frame[i]._pixelSpacing[1]) {
    //   // send an error message...
    //   window.console.log('Spacing in stack\'s frames is not consistent.');
    //   window.console.log(this);
    //   window.console.log('First frame had : ', this._pixelSpacing.row, ' x ', this._pixelSpacing.column, ' spacing.');
    //   window.console.log('Frame index : ', i, ' has: ', this._frame[i]._pixelSpacing[0], ' x ', this._frame[i]._pixelSpacing[1], ' spacing.');
    // }

    // // check slice spacing consitency
    // if (this._spacingBetweenSlices !== this._frame[i]._spacingBetweenSlices) {
    //   // send an error message...
    //   window.console.log('Spacing betwen slices in stack\'s frames is not consistent.');
    //   window.console.log(this);
    //   window.console.log('First frame had: ', this._spacingBetweenSlices, ' spacing betwen slices.');
    //   window.console.log('Frame index: ', i, ' has: ', this.frame[i]._spacingBetweenSlices, ' spacing betwen slices.');
    // }

    // // check for slice thickness consistency
    // if (this._sliceThickness !== this._frame[i]._sliceThickness) {
    //   window.console.log('Slice thickness in stack\'s frames is not consistent.');
    //   window.console.log(this);
    //   window.console.log('First frame had: ', this._sliceThickness, ' sliceThickness.');
    //   window.console.log('Frame index: ', i, ' has: ', this._frame[i]._sliceThickness, ' sliceThickness.');
    // }

    // get min/max
    this._minMax[0] = Math.min(this._minMax[0], this._frame[i]._minMax[0]);
    this._minMax[1] = Math.max(this._minMax[1], this._frame[i]._minMax[1]);
  }

  // Origin
  this._origin = new THREE.Vector3(
      this._frame[0]._imagePosition[0],
      this._frame[0]._imagePosition[1],
      this._frame[0]._imagePosition[2]
      );

  // Direction
  window.console.log('first frame value!');
  window.console.log(this._frame[0]._imageOrientation[0]);
  var xCosine = new THREE.Vector3(
      this._frame[0]._imageOrientation[0],
      this._frame[0]._imageOrientation[1],
      this._frame[0]._imageOrientation[2]
  );
  window.console.log(xCosine);

  var yCosine = new THREE.Vector3(
      this._frame[0]._imageOrientation[3],
      this._frame[0]._imageOrientation[4],
      this._frame[0]._imageOrientation[5]
  );
  var zCosine = new THREE.Vector3(0, 0, 0).crossVectors(xCosine, yCosine).normalize();
  this._direction = new THREE.Matrix4();
  this._direction.set(
      xCosine.x, yCosine.x, zCosine.x, 0,
      xCosine.y, yCosine.y, zCosine.y, 0,
      xCosine.z, yCosine.z, zCosine.z, 0,
      0, 0, 0, 1);

  window.console.log(this._direction);

  this._spacing = new THREE.Vector3(
      this._pixelSpacing.row,
      this._pixelSpacing.column,
      zSpacing);

  window.console.log(this._spacing);

  // half dimensions are useful for faster computations of intersection.
  this._halfDimensions = new THREE.Vector3(
      this._dimensions.x / 2, this._dimensions.y / 2, this._dimensions.z / 2);

  // orientation needed to compute stack BBox interection against slice.
  // always same, might want to remove it.
  var baseX = new THREE.Vector3(1, 0, 0);
  var baseY = new THREE.Vector3(0, 1, 0);
  var baseZ = new THREE.Vector3(0, 0, 1);
  this._orientation = new THREE.Vector3(baseX, baseY, baseZ);

  // IJK to LPS transform.
  // and inverse.
  this._ijk2LPS = new THREE.Matrix4();
  this._ijk2LPS.set(
      xCosine.x * this._spacing.x, yCosine.x * this._spacing.y, zCosine.x * this._spacing.z, this._origin.x,
      xCosine.y * this._spacing.x, yCosine.y * this._spacing.y, zCosine.y * this._spacing.z, this._origin.y,
      xCosine.z * this._spacing.x, yCosine.z * this._spacing.y, zCosine.z * this._spacing.z, this._origin.z,
      0, 0, 0, 1);

  this._lps2IJK = new THREE.Matrix4();
  this._lps2IJK.getInverse(this._ijk2LPS);

  window.console.log(this._lps2IJK, this._ijk2LPS, this._direction);

  // only works with 1 channel for now...
  var nbVoxels = this._dimensions.x * this._dimensions.y * this._dimensions.z;
  window.console.log(this._dimensions);

  // create 16 rgba textures
  var requiredTextures = Math.ceil(nbVoxels / (this._textureSize * this._textureSize));
  for (var ii = 0; ii < requiredTextures; ii++) {
    // *3 because always create RGB
    this._rawData.push(new Uint8Array(this._textureSize * this._textureSize * 4));
  }

  // http://stackoverflow.com/questions/6413744/looking-to-access-16-bit-image-data-in-javascript-webgl

  // Can not just use subarray because we have to normalize the values (Uint* 0<x<255)
  //var prevFrame = -1;
  //var prevTexture = -1;

  // ADD WARNING IF DATA TO BIG TO FIT IN MEMORY...!

  var frameDimension = this._dimensions.x * this._dimensions.y;
  var textureDimension = this._textureSize * this._textureSize;

  console.time('arrangeDataForWebgl');

  for (var jj = 0; jj < nbVoxels; jj++) {

    var frameIndex = Math.floor(jj / frameDimension);
    var inFrameIndex = jj % (frameDimension);

    var textureIndex = Math.floor(jj / textureDimension);
    var inTextureIndex = jj % (textureDimension);
    if (this._numberOfChannels === 3) {

      this._rawData[textureIndex][4 * inTextureIndex] = this._frame[frameIndex]._pixelData[4 * inFrameIndex];
      this._rawData[textureIndex][4 * inTextureIndex + 1] = this._frame[frameIndex]._pixelData[4 * inFrameIndex + 1];
      this._rawData[textureIndex][4 * inTextureIndex + 2] = this._frame[frameIndex]._pixelData[4 * inFrameIndex + 2];
      this._rawData[textureIndex][4 * inTextureIndex + 3] = this._frame[frameIndex]._pixelData[4 * inFrameIndex + 3];

    } else {
      //

      var rawValue = this._frame[frameIndex]._pixelData[inFrameIndex];

      // get most significant (msb) and less significant (lsb) bytes
      // deal with sign?
      // deal with number of channels
      // deal with image type (single/multi channel)
      // >> or >>> ?
      // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators#Unsigned_right_shift

      /*jshint bitwise: false*/
      var lsb = rawValue & 0xFF;
      var msb = (rawValue >> 8) & 0xFF;

      // add 
      this._rawData[textureIndex][4 * inTextureIndex] = msb;
      this._rawData[textureIndex][4 * inTextureIndex + 1] = lsb;

      // can we add next msb/lsb to b/a - yes!
      // or just forbid it?

      this._rawData[textureIndex][4 * inTextureIndex + 2] = frameIndex;
      this._rawData[textureIndex][4 * inTextureIndex + 3] = frameIndex;

    }

  }

  // default window level based on min/max for now...
  // could use the frame's windowWidth and center...
  var width = this._minMax[1] - this._minMax[0];
  var center = this._minMax[0] + width / 2;

  this._windowWidth = width;
  this._windowCenter = center;
  this._windowLevel = [center, width];

  // need to pass min/max
  this._bitsAllocated = this._frame[0]._bitsAllocated;

  window.console.log('window level: ', this._windowLevel);
};

/**
 * Order frames based on theirs dimensionIndexValues
 */
VJS.models.stack.prototype.orderFrameOnDimensionIndices = function(a, b) {

  if ('_dimensionIndexValues' in a && Object.prototype.toString.call(a._dimensionIndexValues) === '[object Array]' && '_dimensionIndexValues' in b && Object.prototype.toString.call(b._dimensionIndexValues) === '[object Array]') {
    for (var i = 0; i < a._dimensionIndexValues.length; i++) {
      if (parseInt(a._dimensionIndexValues[i]) > parseInt(b._dimensionIndexValues[i])) {
        //window.console.log(a._dimensionIndexValues[i] + ' > ' + b._dimensionIndexValues[i]);
        //window.console.log(typeof a._dimensionIndexValues[i] + ' > ' + typeof b._dimensionIndexValues[i]);
        return 1;
      }
      if (parseInt(a._dimensionIndexValues[i]) < parseInt(b._dimensionIndexValues[i])) {
        //window.console.log(a._dimensionIndexValues[i] + ' < ' + b._dimensionIndexValues[i]);
        //window.console.log(typeof a._dimensionIndexValues[i] + ' < ' + typeof b._dimensionIndexValues[i]);
        return -1;
      }
    }
  } else {
    window.console.log('One of the frames doesn\'t have a _dimensionIndexValues array.');
    window.console.log(a);
    window.console.log(b);
  }

  return 0;
};

VJS.models.stack.prototype.orderFrames = function() {
  // order the frames based on theirs dimension indices
  // first index is the most important.
  // 1,1,1,1 willl be first
  // 1,1,2,1 will be next
  // 1,1,2,3 will be next
  // 1,1,3,1 wil be next
  window.console.log(this);
  if (this._frame[0]._dimensionIndexValues) {
    this._frame.sort(VJS.models.stack.prototype.orderFrameOnDimensionIndices);
  } else if (this._frame[0]._imagePosition && this._frame[0]._imageOrientation) {
    // ORDERING BASED ON IMAGE POSITION
    var xCosine = new THREE.Vector3(
      this._frame[0]._imageOrientation[0],
      this._frame[0]._imageOrientation[1],
      this._frame[0]._imageOrientation[2]
      );

    var yCosine = new THREE.Vector3(
      this._frame[0]._imageOrientation[3],
      this._frame[0]._imageOrientation[4],
      this._frame[0]._imageOrientation[5]
    );

    var zCosine = new THREE.Vector3(0, 0, 0).crossVectors(xCosine, yCosine).normalize();

    // compute and sort by dist in this series
    this._frame.map(this._computeDistance.bind(null, zCosine));
    this._frame.sort(this._sortDistance);

  } else {
    // else slice location
    // image number
    // ORDERING BASED ON instance number
    // _ordering = 'instance_number';
    // first_image.sort(function(a,b){return a["instance_number"]-b["instance_number"]});
  }
};

VJS.models.stack.prototype._computeDistance = function(normal, frame) {
  frame._dist = frame._imagePosition[0] * normal.x +
  frame._imagePosition[1] * normal.y +
  frame._imagePosition[2] * normal.z;
  return frame;
};

VJS.models.stack.prototype._sortDistance = function(a, b) {return a._dist - b._dist;};

VJS.models.stack.prototype.zSpacing = function() {
  // Spacing
  // can not be 0 if not matrix can not be inverted.
  var zSpacing = 1;
  window.console.log(this._frame[0]);

  if (this._numberOfFrames > 1) {
    if (this._spacingBetweenSlices) {
      zSpacing = this._spacingBetweenSlices;
    } else if (this._frame[0]._sliceThickness) {
      zSpacing = this._frame[0]._sliceThickness;
    } else {
      var xCosine = new THREE.Vector3(
        this._frame[0]._imageOrientation[0],
        this._frame[0]._imageOrientation[1],
        this._frame[0]._imageOrientation[2]
      );

      var yCosine = new THREE.Vector3(
        this._frame[0]._imageOrientation[3],
        this._frame[0]._imageOrientation[4],
        this._frame[0]._imageOrientation[5]
      );

      var zCosine = new THREE.Vector3(0, 0, 0).crossVectors(xCosine, yCosine).normalize();

      // compute and sort by dist in this series
      this._frame.map(this._computeDistance.bind(null, zCosine));
      this._frame.sort(this._sortDistance);

      zSpacing = this._frame[1]._dist - this._frame[0]._dist;
    }
  }

  if (zSpacing === 0) {
    zSpacing = 1;
  }

  return zSpacing;
};

VJS.models.stack.prototype.merge = function(stack) {
  // try to merge imageHelper with current image.
  // same image if same Series UID?
  // could use concatenation if available, to already know if image is complete!
  var sameStackID = false;
  if (this._stackID === stack._stackID) {
    sameStackID = true;

    // Make sure image information is consisent?
    // re-compute it?
    var frame = stack._frame;
    // Merge Stacks (N against N)
    // try to match all stack to current stacks, if not add it to stacks list!
    for (var i = 0; i < frame.length; i++) {
      // test stack against existing stack
      for (var j = 0; j < this._frame.length; j++) {
        // test dimension
        // dimension index value not defined!
        if (
          
          // dimension index is unique
          (this._frame[j]._dimensionIndexValues &&
            frame[i]._dimensionIndexValues &&
            this._frame[j]._dimensionIndexValues.join() === frame[i]._dimensionIndexValues.join()) ||
          
          // instance number is unique?
          (this._frame[j]._instanceNumber &&
            frame[i]._instanceNumber &&
            this._frame[j]._instanceNumber === frame[i]._instanceNumber) ||
          
          // imagePosition + imageOrientation is unique
          (this._frame[j]._imagePosition &&
            frame[i]._imagePosition &&
            this._frame[j]._imagePosition.join() === frame[i]._imagePosition.join() &&
            this._frame[j]._imageOrientation &&
            frame[i]._imageOrientation &&
            this._frame[j]._imageOrientation.join() === frame[i]._imageOrientation.join() &&
            // FOR DIFFUSION.. same position but different instance numbers...
            this._frame[j]._instanceNumber &&
            frame[i]._instanceNumber &&
            this._frame[j]._instanceNumber === frame[i]._instanceNumber) //||

          // _pixelData length is unique...? imageSOP?
          // (this._frame[j]._pixelData &&
          //   frame[i]._pixelData &&
          //   this._frame[j]._pixelData.length === frame[i]._pixelData.length)

          ) {

          window.console.log('BREAKING!');
          window.console.log(frame[i], this._frame[j]);
          break;
         
        } else if (j === this._frame.length - 1) {

          window.console.log('PUSHING FRAME TO STACK!');
          this._frame.push(frame[i]);
          break;

        }

      }

    }
  }

  window.console.log(this);

  return sameStackID;
};



/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS.models.stack;
}
