/*global module*/


//ftp://medical.nema.org/MEDICAL/Dicom/2014c/output/chtml/part05/sect_6.2.html/

'use strict';

// imports
var dicomParser = require('dicom-parser');
// var jpx = require('./jpx.js');

var VJS = VJS || {};

// WE RETURN NULL INSTEAD OF GUESSING

/**
 * parsers namespace
 * @namespace parsers
 * @memberOf VJS
 */
VJS.parsers = VJS.parsers || {};

/**
 * Dicom parser is a combination of utilities to get a VJS image from dicom files.
 *
 * Relies on dcmjs, jquery, HTML5 fetch API, HTML5 promise API.
 *
 * @constructor
 * @class
 * @memberOf VJS.parsers
 * @public
 *
 * @param arrayBuffer {arraybuffer} - List of files to be parsed. It is urls from which
 * VJS.parsers.dicom can pull the data from.
 */
VJS.parsers.dicom = function(arrayBuffer, id) {
  /**
   * @member
   * @type {arraybuffer}
   */
  this._id = id;
  this._arrayBuffer = arrayBuffer;

  var byteArray = new Uint8Array(arrayBuffer);
  // window.console.log(byteArray.length);
  this._dataSet = dicomParser.parseDicom(byteArray);

  //window.console.log(dicomParser);
  // window.console.log(this._dataSet);
  // this.rescaleIntercept(0);
};

VJS.parsers.dicom.prototype.seriesInstanceUID =  function() {
  return this._dataSet.string('x0020000e');
};

VJS.parsers.dicom.prototype.modality =  function() {
  return this._dataSet.string('x00080060');
};

// image/frame specific
VJS.parsers.dicom.prototype.sopInstanceUID =  function() {
  return this._dataSet.string('x00200018');
};

VJS.parsers.dicom.prototype.transferSyntaxUID =  function() {
  return this._dataSet.string('x00020010');
};

VJS.parsers.dicom.prototype.photometricInterpretation =  function() {
  return this._dataSet.string('x00280004');
};

VJS.parsers.dicom.prototype.planarConfiguration =  function() {

  var planarConfiguration = this._dataSet.uint16('x00280006');

  if (typeof planarConfiguration === 'undefined') {
    planarConfiguration = null;
  }

  return planarConfiguration;
};

VJS.parsers.dicom.prototype.samplesPerPixel =  function() {
  return this._dataSet.uint16('x00280002');
};

VJS.parsers.dicom.prototype.numberOfFrames =  function() {
  var numberOfFrames = this._dataSet.intString('x00280008');

  // need something smarter!
  if (typeof numberOfFrames === 'undefined') {
    numberOfFrames = null;
  }

  // make sure we return a number! (not a string!)
  return numberOfFrames;
};

VJS.parsers.dicom.prototype.numberOfChannels =  function() {
  var numberOfChannels = 1;
  var photometricInterpretation = this.photometricInterpretation();

  if (photometricInterpretation === 'RGB' ||
            photometricInterpretation === 'PALETTE COLOR' ||
            photometricInterpretation === 'YBR_FULL' ||
            photometricInterpretation === 'YBR_FULL_422' ||
            photometricInterpretation === 'YBR_PARTIAL_422' ||
            photometricInterpretation === 'YBR_PARTIAL_420' ||
            photometricInterpretation === 'YBR_RCT') {
    numberOfChannels = 3;
  }

  // make sure we return a number! (not a string!)
  return numberOfChannels;
};

VJS.parsers.dicom.prototype.imageOrientation =  function(frameIndex) {
  // expect frame index to start at 0!
  var imageOrientation = this._dataSet.string('x00200037');

  // try to get it from enhanced MR images
  // per-frame functionnal group
  if (typeof imageOrientation === 'undefined') {
    // per frame functionnal group sequence
    var perFrameFunctionnalGroupSequence = this._dataSet.elements.x52009230;

    if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
      // plane orientation sequence for Nth element in the sequence
      var planeOrientationSequence = perFrameFunctionnalGroupSequence
        .items[frameIndex].dataSet.elements.x00209116.items[0].dataSet;
      imageOrientation = planeOrientationSequence.string('x00200037');
    } else {
      // default orientation
      // should we default to undefined??
      imageOrientation = null;
    }
  }

  // format image orientation ('1\0\0\0\1\0') to array containing 6 numbers
  if (imageOrientation) {
    // make sure we return a number! (not a string!)
    // might not need to split (floatString + index)
    imageOrientation = imageOrientation.split('\\').map(Number);
  }

  return imageOrientation;
};

VJS.parsers.dicom.prototype.pixelAspectRatio =  function() {
  var pixelAspectRatio = [
    this._dataSet.intString('x00280034', 0),
    this._dataSet.intString('x00280034', 1)
    ];

  // need something smarter!
  if (typeof pixelAspectRatio[0] === 'undefined') {
    pixelAspectRatio = null;
  }

  // make sure we return a number! (not a string!)
  return pixelAspectRatio;
};

VJS.parsers.dicom.prototype.imagePosition =  function(frameIndex) {
  var imagePosition = null;
  // first look for frame!
  // per frame functionnal group sequence
  var perFrameFunctionnalGroupSequence = this._dataSet.elements.x52009230;

  if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
    // plane orientation sequence for Nth element in the sequence
    var planeOrientationSequence = perFrameFunctionnalGroupSequence
      .items[frameIndex].dataSet.elements.x00209113.items[0].dataSet;
    imagePosition = planeOrientationSequence.string('x00200032');
  } else {
    // should we default to undefined??
    // default orientation
    imagePosition = this._dataSet.string('x00200032');

    if (typeof imagePosition === 'undefined') {
      imagePosition = null;
    }
  }

  // format image orientation ('1\0\0\0\1\0') to array containing 6 numbers
  if (imagePosition) {
    // make sure we return a number! (not a string!)
    imagePosition = imagePosition.split('\\').map(Number);
  }

  return imagePosition;
};

VJS.parsers.dicom.prototype.instanceNumber =  function(frameIndex) {
  var instanceNumber = null;
  // first look for frame!
  // per frame functionnal group sequence
  var perFrameFunctionnalGroupSequence = this._dataSet.elements.x52009230;

  if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
    // plane orientation sequence for Nth element in the sequence
    // PHILIPS HACK...
    if (perFrameFunctionnalGroupSequence
      .items[frameIndex].dataSet.elements.x2005140f) {
      var planeOrientationSequence = perFrameFunctionnalGroupSequence
        .items[frameIndex].dataSet.elements.x2005140f.items[0].dataSet;
      instanceNumber = planeOrientationSequence.intString('x00200013');
    } else {
      instanceNumber = this._dataSet.intString('x00200013');

      if (typeof instanceNumber === 'undefined') {
        instanceNumber = null;
      }
    }

  } else {
    // should we default to undefined??
    // default orientation
    instanceNumber = this._dataSet.intString('x00200013');

    if (typeof instanceNumber === 'undefined') {
      instanceNumber = null;
    }
  }

  return instanceNumber;
};

VJS.parsers.dicom.prototype.pixelSpacing =  function(frameIndex) {
  // expect frame index to start at 0!
  var pixelSpacing = this._dataSet.string('x00280030');

  // try to get it from enhanced MR images
  // per-frame functionnal group
  if (typeof pixelSpacing === 'undefined') {
    // per frame functionnal group sequence
    var perFrameFunctionnalGroupSequence = this._dataSet.elements.x52009230;

    if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
      // plane orientation sequence for Nth element in the sequence
      var planeOrientationSequence = perFrameFunctionnalGroupSequence
        .items[frameIndex].dataSet.elements.x00289110.items[0].dataSet;
      pixelSpacing = planeOrientationSequence.string('x00280030');
    } else {
      // default orientation
      pixelSpacing = null;
    }
  }

  // format image orientation ('1\0\0\0\1\0') to array containing 6 numbers
  // should we default to undefined??
  if (pixelSpacing) {

    // make sure we return array of numbers! (not strings!)
    pixelSpacing = pixelSpacing.split('\\').map(Number);
  }
  return pixelSpacing;
};

VJS.parsers.dicom.prototype.sopInstanceUID =  function(frameIndex) {
  // expect frame index to start at 0!
  var sopInstanceUID = this._dataSet.string('x00080018');
  return sopInstanceUID;
};

VJS.parsers.dicom.prototype.sliceThickness =  function(frameIndex) {
  // expect frame index to start at 0!
  var sliceThickness = this._dataSet.floatString('x00180050');

  // try to get it from enhanced MR images
  // per-frame functionnal group
  if (typeof sliceThickness === 'undefined') {
    // per frame functionnal group sequence
    var perFrameFunctionnalGroupSequence = this._dataSet.elements.x52009230;

    if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
      // plane orientation sequence for Nth element in the sequence
      var planeOrientationSequence = perFrameFunctionnalGroupSequence
        .items[frameIndex].dataSet.elements.x00289110.items[0].dataSet;
      sliceThickness = planeOrientationSequence.floatString('x00180050');
    } else {
      // default orientation
      // should we default to undefined??
      // print warning at least...
      sliceThickness = null;
    }
  }

  return sliceThickness;
};

VJS.parsers.dicom.prototype.rows =  function(frameIndex) {
  // expect frame index to start at 0!
  var rows = this._dataSet.uint16('x00280010');

  if (typeof rows === 'undefined') {
    rows = null;
    // print warning at least...
  }

  return rows;
};

VJS.parsers.dicom.prototype.columns =  function(frameIndex) {
  // expect frame index to start at 0!
  var columns = this._dataSet.uint16('x00280011');

  if (typeof columns === 'undefined') {
    columns = null;
    // print warning at least...
  }

  return columns;
};

VJS.parsers.dicom.prototype.pixelRepresentation =  function(frameIndex) {
  // expect frame index to start at 0!
  var pixelRepresentation = this._dataSet.uint16('x00280103');
  return pixelRepresentation;
};

VJS.parsers.dicom.prototype.bitsAllocated =  function(frameIndex) {
  // expect frame index to start at 0!
  var bitsAllocated = this._dataSet.uint16('x00280100');
  return bitsAllocated;
};

VJS.parsers.dicom.prototype.highBit =  function(frameIndex) {
  // expect frame index to start at 0!
  var highBit = this._dataSet.uint16('x00280102');
  return highBit;
};

VJS.parsers.dicom.prototype.rescaleIntercept =  function(frameIndex) {
  // expect frame index to start at 0!
  var rescaleIntercept = this._dataSet.floatString('x00281052');

  // try to get it from enhanced MR images
  // per-frame functionnal group
  if (typeof rescaleIntercept === 'undefined') {
    // per frame functionnal group sequence
    var perFrameFunctionnalGroupSequence = this._dataSet.elements.x52009230;

    if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
      // NOT A PHILIPS TRICK!
      var philipsPrivateSequence = perFrameFunctionnalGroupSequence
        .items[frameIndex].dataSet.elements.x00289145.items[0].dataSet;
      rescaleIntercept = philipsPrivateSequence.floatString('x00281052');
    } else {
      // default rescaleIntercept
      rescaleIntercept = null;
    }
  }

  return rescaleIntercept;
};

VJS.parsers.dicom.prototype.rescaleSlope =  function(frameIndex) {
  // expect frame index to start at 0!
  var rescaleSlope = this._dataSet.floatString('x00281053');

  // try to get it from enhanced MR images
  // per-frame functionnal group
  if (typeof rescaleSlope === 'undefined') {
    // per frame functionnal group sequence
    var perFrameFunctionnalGroupSequence = this._dataSet.elements.x52009230;

    if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
      // NOT A PHILIPS TRICK!
      var philipsPrivateSequence = perFrameFunctionnalGroupSequence
        .items[frameIndex].dataSet.elements.x00289145.items[0].dataSet;
      rescaleSlope = philipsPrivateSequence.floatString('x00281052');
    } else {
      // default rescaleSlope
      rescaleSlope = null;
    }
  }

  return rescaleSlope;
};

VJS.parsers.dicom.prototype.windowCenter =  function(frameIndex) {
  // expect frame index to start at 0!
  var windowCenter = this._dataSet.floatString('x00281050');

  // try to get it from enhanced MR images
  // per-frame functionnal group
  if (typeof windowCenter === 'undefined') {
    // per frame functionnal group sequence
    var perFrameFunctionnalGroupSequence = this._dataSet.elements.x52009230;

    if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
      // NOT A PHILIPS TRICK!.
      var philipsPrivateSequence = perFrameFunctionnalGroupSequence
        .items[frameIndex].dataSet.elements.x00289132.items[0].dataSet;
      windowCenter = philipsPrivateSequence.floatString('x00281050');
    } else {
      // default windowCenter
      // print warning at least...
      windowCenter = null;
    }
  }

  return windowCenter;
};

VJS.parsers.dicom.prototype.windowWidth =  function(frameIndex) {
  // expect frame index to start at 0!
  var windowWidth = this._dataSet.floatString('x00281051');

  // try to get it from enhanced MR images
  // per-frame functionnal group
  if (typeof windowWidth === 'undefined') {
    // per frame functionnal group sequence
    var perFrameFunctionnalGroupSequence = this._dataSet.elements.x52009230;

    if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
      // NOT A PHILIPS TRICK!
      var philipsPrivateSequence = perFrameFunctionnalGroupSequence
        .items[frameIndex].dataSet.elements.x00289132.items[0].dataSet;
      windowWidth = philipsPrivateSequence.floatString('x00281051');
    } else {
      // default windowWidth
      // print warning at least...
      windowWidth = null;
    }
  }
  return windowWidth;
};

VJS.parsers.dicom.prototype.dimensionIndexValues =  function(frameIndex) {
  var dimensionIndexValues = [];

  // try to get it from enhanced MR images
  // per-frame functionnal group sequence
  var perFrameFunctionnalGroupSequence = this._dataSet.elements.x52009230;

  if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
    // NOT A PHILIPS TRICK!
    var philipsPrivateSequence = perFrameFunctionnalGroupSequence
      .items[frameIndex].dataSet.elements.x00209111.items[0].dataSet;
    var element = philipsPrivateSequence.elements.x00209157;
    // /4 because UL
    var nbValues = element.length / 4;
    for (var i = 0; i < nbValues; i++) {
      dimensionIndexValues.push(philipsPrivateSequence.uint32('x00209157', i));
    }
  } else {
    dimensionIndexValues = null;
  }

  return dimensionIndexValues;
};

VJS.parsers.dicom.prototype.inStackPositionNumber =  function(frameIndex) {
  var inStackPositionNumber = null;

  // try to get it from enhanced MR images
  // per-frame functionnal group sequence
  var perFrameFunctionnalGroupSequence = this._dataSet.elements.x52009230;

  if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
    // NOT A PHILIPS TRICK!
    var philipsPrivateSequence = perFrameFunctionnalGroupSequence
      .items[frameIndex].dataSet.elements.x00209111.items[0].dataSet;
      inStackPositionNumber = philipsPrivateSequence.uint32('x00209057');
  } else {
    inStackPositionNumber = null;
  }

  return inStackPositionNumber;
};


VJS.parsers.dicom.prototype.stackID =  function(frameIndex) {
  var stackID = null;

  // try to get it from enhanced MR images
  // per-frame functionnal group sequence
  var perFrameFunctionnalGroupSequence = this._dataSet.elements.x52009230;

  if (typeof perFrameFunctionnalGroupSequence !== 'undefined') {
    // NOT A PHILIPS TRICK!
    var philipsPrivateSequence = perFrameFunctionnalGroupSequence
      .items[frameIndex].dataSet.elements.x00209111.items[0].dataSet;
      stackID = philipsPrivateSequence.intString('x00209056');
  } else {
    stackID = null;
  }

  return stackID;
};

VJS.parsers.dicom.prototype.dPixelData =  function(frameIndex) {
  // expect frame index to start at 0!
  var dPixelData = [];
  // http://www.dicomlibrary.com/dicom/transfer-syntax/
  var transferSyntaxUID = this.transferSyntaxUID();

  // find compression scheme
  if (transferSyntaxUID === '1.2.840.10008.1.2.4.90' ||  // JPEG 2000 lossless
      transferSyntaxUID === '1.2.840.10008.1.2.4.91') {  // JPEG 2000 lossy
    //window.console.log('JPG2000 in action!');
    // window.console.log(this._dataSet);
    //window.console.log(dicomParser);
    //window.console.log(this._dataSet.elements);
    //var compressedPixelData = dicomParser.readEncapsulatedPixelData(this._dataSet, this._dataSet.elements.x7fe00010, frameIndex);
    var pixelDataElement = this._dataSet.elements.x7fe00010;
    var pixelData = new Uint8Array(this._dataSet.byteArray.buffer, pixelDataElement.dataOffset, pixelDataElement.length);
    // var jpxImage = new jpx();
    // jpxImage.parse(pixelData);

    // var j2kWidth = jpxImage.width;
    // var j2kHeight = jpxImage.height;

    // window.console.log(jpxImage);
  }

  return dPixelData;
};

VJS.parsers.dicom.prototype.extractPixelData =  function(frameIndex) {
  // expect frame index to start at 0!
  var ePixelData = null;

  // if compressed..?
  var transferSyntaxUID = this.transferSyntaxUID();

  // find compression scheme
  if (transferSyntaxUID === '1.2.840.10008.1.2.4.90' ||  // JPEG 2000 lossless
      transferSyntaxUID === '1.2.840.10008.1.2.4.91') {
    return ePixelData;
  }

  // else
  // ned to guess pixel format to know if uint8, unit16 or int16
  // Note - we may want to sanity check the rows * columns * bitsAllocated * samplesPerPixel against the buffer size
  var pixelRepresentation = this.pixelRepresentation(frameIndex);
  var bitsAllocated = this.bitsAllocated(frameIndex);
  var pixelDataElement = this._dataSet.elements.x7fe00010;
  var pixelDataOffset = pixelDataElement.dataOffset;
  var numberOfChannels  = this.numberOfChannels();
  var numPixels = this.rows(frameIndex) * this.columns(frameIndex) * numberOfChannels;
  var frameOffset = 0;

  if (numberOfChannels === 1) {
    if (pixelRepresentation === 0 && bitsAllocated === 8) {

      // unsigned 8 bit
      frameOffset = pixelDataOffset + frameIndex * numPixels;
      ePixelData =  new Uint8Array(this._dataSet.byteArray.buffer, frameOffset, numPixels);

    } else if (pixelRepresentation === 0 && bitsAllocated === 16) {

      // unsigned 16 bit
      frameOffset = pixelDataOffset + frameIndex * numPixels * 2;
      ePixelData = new Uint16Array(this._dataSet.byteArray.buffer, frameOffset, numPixels);

    } else if (pixelRepresentation === 1 && bitsAllocated === 16) {

      // signed 16 bit
      frameOffset = pixelDataOffset + frameIndex * numPixels * 2;
      ePixelData = new Int16Array(this._dataSet.byteArray.buffer, frameOffset, numPixels);

    }
  } else {
    // ASSUME RGB 8 BITS SIGNED!
    frameOffset = pixelDataOffset + frameIndex * numPixels;
    var encodedPixelData = new Uint8Array(this._dataSet.byteArray.buffer, frameOffset, numPixels);
    var photometricInterpretation = this.photometricInterpretation();

    if (photometricInterpretation === 'RGB') {
      // ALL GOOD, ALREADY ORDERED
      ePixelData = encodedPixelData;

    } else if (photometricInterpretation === 'YBR_FULL') {
      ePixelData = new Uint8Array(numPixels);
      // https://github.com/chafey/cornerstoneWADOImageLoader/blob/master/src/decodeYBRFull.js
      var nPixels = numPixels / 3;
      var ybrIndex = 0;
      var rgbaIndex = 0;
      for (var i = 0; i < nPixels; i++) {
        var y = encodedPixelData[ybrIndex++];
        var cb = encodedPixelData[ybrIndex++];
        var cr = encodedPixelData[ybrIndex++];
        ePixelData[rgbaIndex++] = y + 1.40200 * (cr - 128);// red
        ePixelData[rgbaIndex++] = y - 0.34414 * (cb - 128) - 0.71414 * (cr - 128); // green
        ePixelData[rgbaIndex++] = y + 1.77200 * (cb - 128); // blue
        ePixelData[rgbaIndex++] = 255; //alpha
      }
    } else {
      window.console.log('photometric interpolation not supported: ' + photometricInterpretation);
    }

  }

  return ePixelData;
};

VJS.parsers.dicom.prototype.minMaxPixelData =  function(pixelData) {

  var minMax = [65535, -32768];
  var numPixels = pixelData.length;
  for (var index = 0; index < numPixels; index++) {
    var spv = pixelData[index];
    // TODO: test to see if it is faster to use conditional here rather than calling min/max functions
    minMax[0] = Math.min(minMax[0], spv);
    minMax[1] = Math.max(minMax[1], spv);
  }

  return minMax;
};

VJS.parsers.dicom.prototype.frameOfReferenceUID = function(imageJqueryDom) {
  // try to access frame of reference UID through its DICOM tag
  var seriesNumber = imageJqueryDom.find('[tag="00200052"] Value').text();

  // if not available, assume we only have 1 frame
  if (seriesNumber === '') {
    seriesNumber = 1;
  }
  return seriesNumber;
};

//
// getFrame
// getFrameSpacing
// getFrame...
// getStach
// getStack...
// image ...

// merge!

// export the probePixel widget module
module.exports = VJS.parsers.dicom;
