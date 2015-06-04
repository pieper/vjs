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
 * @public
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

  this._textureSize = 2048;
  this._nbTextures = 16; // HIGH RES..
  this._rawData = [];

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
VJS.stack.model.prototype.prepare = function() {
  // order the frames based on theirs dimension indices
  // first index is the most important.
  // 1,1,1,1 willl be first
  // 1,1,2,1 will be next
  // 1,1,2,3 will be next
  // 1,1,3,1 wil be next
  this._frame.sort(VJS.stack.model.prototype.orderFrameOnDimensionIndices);

  // dimensions of the stack
  this._nbFrames = this._frame.length;
  this._rows = this._frame[0]._rows;
  this._columns = this._frame[0]._columns;
  this._dimensions = new THREE.Vector3(this._columns, this._rows, this._nbFrames);

  // extra
  this._pixelSpacing.row = this._frame[0]._pixelSpacing.row;
  this._pixelSpacing.column = this._frame[0]._pixelSpacing.column;
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

    // check for spacing consistency
    if (this._pixelSpacing.row !== this._frame[i]._pixelSpacing.row || this._pixelSpacing.column !== this._frame[i]._pixelSpacing.column) {
      // send an error message...
      window.console.log('Spacing in stack\'s frames is not consistent.');
      window.console.log(this);
      window.console.log('First frame had : ', this._pixelSpacing.row, ' x ', this._pixelSpacing.column, ' spacing.');
      window.console.log('Frame index : ', i, ' has: ', this._frame[i]._pixelSpacing.row, ' x ', this._frame[i]._pixelSpacing.column, ' spacing.');
    }

    // check slice spacing consitency
    if (this._spacingBetweenSlices !== this._frame[i]._spacingBetweenSlices) {
      // send an error message...
      window.console.log('Spacing betwen slices in stack\'s frames is not consistent.');
      window.console.log(this);
      window.console.log('First frame had: ', this._spacingBetweenSlices, ' spacing betwen slices.');
      window.console.log('Frame index: ', i, ' has: ', this.frame[i]._spacingBetweenSlices, ' spacing betwen slices.');
    }

    // check for slice thickness consistency
    if (this._sliceThickness !== this._frame[i]._sliceThickness) {
      window.console.log('Slice thickness in stack\'s frames is not consistent.');
      window.console.log(this);
      window.console.log('First frame had: ', this._sliceThickness, ' sliceThickness.');
      window.console.log('Frame index: ', i, ' has: ', this._frame[i]._sliceThickness, ' sliceThickness.');
    }
  }

  // Origin
  this._origin = this._frame[0]._imagePositionPatient;

  // Direction
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
  this._direction = new THREE.Matrix4();
  this._direction.set(
      xCosine.x, yCosine.x, zCosine.x, 0,
      xCosine.y, yCosine.y, zCosine.y, 0,
      xCosine.z, yCosine.z, zCosine.z, 0,
      0, 0, 0, 1);

  // Spacing
  // can not be 0 if not matrix can not be inverted.
  var zSpacing = 1;
  if (this._nbFrames > 1) {
    if (this._spacingBetweenSlices) {
      zSpacing = this._spacingBetweenSlices;
    } else {
      // we got to compute it...!
      window.console.log('NEED TO COMPUTE SPACING BETWEEN THE FRAMES!');
      // It is always better to compute the distance between a pair of
      // slices along a normal to the plane of the image specified by
      // the Image Orientation (Patient) attribute, by projecting the
      // top left hand corner position specified by the Image Position
      // (Patient) attribute onto that normal. These attributes are
      // always sent and much more often "right" than is (0018,0088).
    }
  }

  this._spacing = new THREE.Vector3(
      this._pixelSpacing.row,
      this._pixelSpacing.column,
      zSpacing);

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
  window.console.log(this._lps2IJK);
  this._lps2IJK.getInverse(this._ijk2LPS);

  window.console.log(this._lps2IJK, this._ijk2LPS);

  // only works with 1 channel for now...
  var requiredPixels = this._dimensions.x * this._dimensions.y * this._dimensions.z;

  var nbChannels = 1;
  for (var ii = 0; ii < this._nbTextures; ii++) {
    this._rawData.push(new Uint8Array(this._textureSize * this._textureSize * nbChannels));
  }

  // if required pixels > this._textureSize * this._textureSize * nbChannels ?
  // window.console.log(requiredPixels);
  // window.console.log(this._rows);
  // window.console.log(this._columns);
  // window.console.log(this._rows * this._columns);
  // window.console.log(this._textureSize);

  // Can not just use subarray because we have to normalize the values (Uint* 0<x<255)
  //var prevFrame = -1;
  //var prevTexture = -1;
  var frameDimension = this._dimensions.x * this._dimensions.y;
  var textureDimension = this._textureSize * this._textureSize;
  for (var jj = 0; jj < requiredPixels; jj++) {

    var frameIndex = Math.floor(jj / frameDimension);
    var inFrameIndex = jj % (frameDimension);
    var textureIndex = Math.floor(jj / textureDimension);
    var inTextureIndex = jj % (textureDimension);

    // window.console.log(textureIndex, inTextureIndex);
    // different ways to itereate if 1 or N channels!!
    // just 1 for now!
    // NORMAALIZE IN THE SHADERS!
    // could track min/max here...?

    //window.console.log(textureIndex,frameIndex);

    // if(prevFrame !== frameIndex){
    //   window.console.log('frameIndex', frameIndex);
    //   prevFrame = frameIndex;
    // }
    // if(prevTexture !== textureIndex){
    //   window.console.log('textureIndex', textureIndex);
    //   prevTexture = textureIndex;
    // }

    // if(frameIndex < 100 && frameIndex > 58){
    this._rawData[textureIndex][inTextureIndex] = this._frame[frameIndex]._pixelData[inFrameIndex]; //Math.floor( Math.random() * 255 );

    // }

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

// The Image Position (0020,0032) specifies the x, y, and z coordinates
// of the upper left hand corner of the image; it is the center of the
// first voxel transmitted. Image Orientation (0020,0037) specifies the
// direction cosines of the first row and the first column with respect
// to the patient. These Attributes shall be provide as a pair. Row value
// for the x, y, and z axes respectively followed by the Column value for
// the x, y, and z axes respectively.

// The direction of the axes is defined fully by the patient's
// orientation. The x-axis is increasing to the left hand side of the
// patient. The y-axis is increasing to the posterior side of the
// patient. The z-axis is increasing toward the head of the patient.

// The patient based coordinate system is a right handed system, i.e. the
// vector cross product of a unit vector along the positive x-axis and a
// unit vector along the positive y-axis is equal to a unit vector along
// the positive z-axis.
// "

// (**)
// http://www.itk.org/mailman/private/i...ry/007553.html
// You need to be suscribed to the ML to have access to this post (sorry).

// Reply With Quote Reply With Quote
// 10-02-2007 10:05 AM #2
// Re: Image Position (Patient) and Image Orientation (Patient)
// Since it might be usefull for other people, I am copy/pasting the
// answer from David Clunie here:

// -------- Original Message --------
// Subject: Re: [Insight-developers] [GDCM] ITK Origin and coordinate
// system
// Date: Wed, 18 Jan 2006 12:57:42 -0500
// From: David Clunie <>
// Reply-To:
// To:

// Hi all

// Just to clarify a few things with respect to DICOM and what
// vendors do, without knowing enough about ITK or gdcm to
// answer the context of the concern. Please excuse me if I
// restate the obvious.

// As has been pointed out in previous posts there is absolutely
// no ambiguity about the DICOM attributes in this respect, nor
// whether the vendors interpret them differently (they do not).

// Specifically:

// - all DICOM references are relative to a specific "frame of
// reference" identified by a UID - all images that share that
// FoR share the same, completely arbitrary, origin; the origin
// might be the isocenter of the magnet, which is constant, but
// the patient position relative to it is not; this is the
// context in which all other DICOM attributes related to the
// "patient coordinate system" should be interpreted; the
// corollary is that different FoRs means coordinates and vectors
// are not comparable

// - the center of the top left hand voxel of a slice is defined
// relative to the FoR-specific origin by an x,y,z tuple that
// represents a translation of that location in mm from the offset;
// the x,y and z directions are patient (not gantry) relative,
// and their order is consistent and defined (see the standard)

// - the direction of the rows and columns are defined relative
// to the patient by unit vectors (direction cosines), again
// the details are in the standard.

// - the Image Position (Patient) TLHC location (which defines
// the offset from the FoR origin) is completely independent of
// the Image Orientation (Patient) unit vectors, which define
// the plane of the slice (only)

// Again, the x,y,z translation from the origin of the TLHC is
// in the nominal patient relative FoR, NOT the plane specified
// by the unit vectors that define the orientation of the slice.

// Note that the use of "patient relative" is relatively imprecise,
// in the sense that if the operator does not line the patient's
// head foot axis exactly down the center line of the gantry or
// table, then though the direction of the Z axis will nominally
// be along the head-foot axis, but reproducible only within the
// same nominal FoR, and even then, only as long as the patient
// doesn't move without the operator re-landmarking.

// All the vendors interpret this the same way, with the one notable
// exception being arguments over whether the TLHC is the center
// of the voxel or one edge of it (the standard has been clarified
// to specify the center, whereas previously it was unspecified,
// hence older implementations vary in this respect).
