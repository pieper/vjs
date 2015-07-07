/*global FS, module, dcmjs, $ */

'use strict';

// imports

var vjsModelsImage = require('../models/models.image');
var vjsModelsStack = require('../models/models.stack');
var vjsModelsFrame = require('../models/models.frame');

var dicomParser = require('dicom-parser');

// var daikon = daikon || {};
// daikon.Series = daikon.Series || require('../../../bower_components/daikon/src/series');
// daikon.Parser = daikon.Parser || require('../../../bower_components/daikon/src/parser');
// daikon.series = daikon.series || require('../../daikon/src/series');
// window.console.log(daikon.series);

var VJS = VJS || {};

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
};

VJS.parsers.dicom.prototype.sopInstanceUID=  function(){
  return this.dataSet.string('x0020000d');
};

VJS.parsers.dicom.prototype.photometricInterpretation=  function(){
  return this.dataSet.string('x00280004');
};

VJS.parsers.dicom.prototype.samplesPerPixel=  function(){
  return this.dataSet.string('x00280002');
};

VJS.parsers.dicom.prototype.numberOfFrames=  function(){
  return this.dataSet.string('x00280008');
};


VJS.parsers.dicom.prototype.parseArrayBuffer = function(arrayBuffer){
  var byteArray = new Uint8Array(arrayBuffer);
  return dicomParser.parseDicom(byteArray);
};

VJS.parsers.dicom.prototype.goNAMIC = function(imageUniqueName, arrayBuffer) {
  console.time('goNAMIC');

  // Parsing of DICOM FILE!
  var byteArray = new Uint8Array(arrayBuffer);
  window.console.log(byteArray.length);
  this.dataSet = dicomParser.parseDicom(byteArray);

  // File was parsed! Extract information of interest!
  var imageType = 'MR';


  //  Series specific specific information
  var sopInstanceUid = this.sopInstanceUID();
  window.console.log(sopInstanceUid);
  var photometricInterpretation = this.photometricInterpretation();
  window.console.log(photometricInterpretation);
  var samplesPerPixel = this.samplesPerPixel();
  window.console.log(samplesPerPixel);
  var nbFrames = this.numberOfFrames();
  window.console.log(nbFrames);

  window.console.log(sopInstanceUid);
  var pixelDataElement = dataSet.elements.x7fe00010;
  window.console.log(pixelDataElement);

  var pixelSpacing = dataSet.elements.x00280030;
  window.console.log(pixelSpacing);

  var sharedFunctionnalGroup = dataSet.elements.x52009229;
  window.console.log(sharedFunctionnalGroup);

  var perFrameFunctionnalGroup = dataSet.elements.x52009230;
  window.console.log(perFrameFunctionnalGroup);

  // get encoding type


  // store file on virtual FS in order to run DCMJS on it
  // console.time('goNAMICSaveOnFS');
  // this.fileToFS(imageUniqueName, arrayBuffer);
  // console.timeEnd('goNAMICSaveOnFS');

  // // get  encoding type!
  // console.time('goNAMICEncodingType');
  // var encodingType = this.goNAMICEncodingType(imageUniqueName);
  // window.console.log(encodingType);
  // console.timeEnd('goNAMICEncodingType');

  // // get xml dump of the header!
  // console.time('goNAMICXMLHeader');
  // var xml = this.goNAMICXMLHeader(imageUniqueName);
  // //window.console.log(xml);
  // var $xml = $($.parseXML(xml));
  // window.console.log($xml);
  // console.timeEnd('goNAMICXMLHeader');

  // // get image information
  // console.time('goNAMICImageInformation');
  // var imageModel = this.goNAMICImageInformation($xml);
  // // do it in first dcm dump too...
  // imageModel._rawPixelData2 = this.goNAMICRawData(imageUniqueName);
  // window.console.log(imageModel._rawPixelData2);
  // // in theory dicom support N pixel data seq.
  // var stat = FS.stat(imageUniqueName + '.0.raw');
  // var stream = FS.open(imageUniqueName + '.0.raw');
  // var imageRawBuffer = new Uint8Array(stat.size);
  // FS.read(stream, imageRawBuffer, 0, stat.size);
  // FS.close(stream);

  // var buf = FS.read(imageUniqueName);
  // function toArrayBuffer(buffer) {
  //   var ab, view, i;

  //   ab = new ArrayBuffer(buffer.length);
  //   view = new Uint8Array(ab);
  //   for (i = 0; i < buffer.length; i += 1) {
  //     view[i] = buffer[i];
  //   }
  //   return ab;
  // }
  // var data = new DataView(arrayBuffer);
  // // daikon.Parser.verbose = true;
  // var image = daikon.Series.parseImage(data);

  // window.console.log(image.getPixelSpacing());

  // imageModel._rawPixelData = imageRawBuffer;
  // window.console.log(imageModel._rawPixelData);

  // // +W might be the best...
  // window.console.log(imageModel);
  // console.timeEnd('goNAMICImageInformation');

  // // depending on encoding, take action!
  // // process Image's rawPixelData
  // // take photometric interpolation into account too....
  // // get min/max values too...
  // window.console.log('encoding type: ', encodingType);
  // // get bits allocated

  // switch (encodingType){
  //   case 'LittleEndianExplicit':
  //     // need array buffer
  //     // in theory should check endianness of this machine...
  //     // assume little endian for now...
  //     break;
  //   case 'JPEG2000':
  //     // need array buffer
  //     // decode with JPX...
  //     // returns arraybuffer
  //     break;
  //   case '':
  //     // need dicom file
  //     // overwrite with no compression
  //     // extract rawData
  //     // run dcmjs appropriate tool
  //     break;
  //   default:
  //     window.console.log('Unkown encoding type: ' + encodingType);
  //     break;
  // }

  // // order based on photometric interp.

  // // loop through frames
  // if (imageModel._numberOfFrames > 0) {
  //   // dummy for loop for now...
  //   console.time('goNAMICForLoopFrame');
  //   for (var i = 0; i < imageModel._numberOfFrames; i++) {
  //     console.time('goNAMICForLoopSingleFrame');
  //     var frame = this.goNAMICFrameInformation($xml, i);
  //     window.console.log(frame);
  //     // var stackUID = 0;
  //     // var stack = this.goNAMICStackInformation($xml, stackUID);

  //     // merge frame in stack

  //     // merge stack in image

  //     console.timeEnd('goNAMICForLoopSingleFrame');
  //   }
  //   console.timeEnd('goNAMICForLoopFrame');
  // } else {
  //   window.console.log('oooops... check the number of frames');
  //   window.console.log(imageModel);
  // }

  // YAY!
  console.timeEnd('goNAMIC');
};

VJS.parsers.dicom.prototype.goNAMICFrameInformation = function($xml, frameIndex) {
  // create image!
  var frameModel = new vjsModelsFrame();

  // get frame functional groups if any
  var $perFrameFunctionalGroupsSequence = this.imagePerFrameFunctionalGroupSequence(frameIndex, $xml);
  // shared functionnal group?
  
  // fill frame model
  frameModel._stackID = this.getFrameStackID($perFrameFunctionalGroupsSequence, $xml);
  frameModel._dimensionIndexValues = this.getFrameDimensionIndexValues($perFrameFunctionalGroupsSequence, $xml);
  frameModel._imagePositionPatient = this.getFrameImagePositionPatient($perFrameFunctionalGroupsSequence, $xml);
  frameModel._imageOrientationPatient = this.getFrameImageOrientationPatient($perFrameFunctionalGroupsSequence, $xml);
  frameModel._sliceThickness = this.getFrameSliceThickness($perFrameFunctionalGroupsSequence, $xml);
  frameModel._pixelSpacing = this.getFramePixelSpacing($perFrameFunctionalGroupsSequence, $xml);
  frameModel._spacingBetweenSlices = this.getSpacingBetweenSlices($perFrameFunctionalGroupsSequence, $xml);

  // http://dicomiseasy.blogspot.com.es/2012/08/chapter-12-pixel-data.html
  // ROWS * COLUMNS * NUMBER_OF_FRAMES * SAMPLES_PER_PIXEL * (BITS_ALLOCATED/8) 
  // int frameSize = ROWS*COLUMNS*SAMPLES_PER_PIXEL;
  //currentFrame._pixelData = pixelData;
  // window.console.log($xml);

  // return it!
  return frameModel;
};

VJS.parsers.dicom.prototype.goNAMICImageInformation = function($xml) {
  // create image!
  var imageModel = new vjsModelsImage();

  // fill it!
  imageModel._concatenationUID = this.imageConcatenationUID($xml);
  imageModel._seriesUID = this.imageSeriesUID($xml);
  imageModel._seriesNumber = this.imageSeriesNumber($xml);
  imageModel._imageFrameOfReferenceUID = this.frameOfReferenceUID($xml);
  imageModel._dimensionIndexSequence = this.imageDimensionIndexSequence($xml);
  imageModel._numberOfFrames = this.imageNumberOfFrames($xml);
  imageModel._rows = this.imageRows($xml);
  imageModel._columns = this.imageColumns($xml);
  imageModel._photometricInterpretation = this.imagePhotometricInterpretation($xml);
  imageModel._instanceNumber = this.getImageInstanceNumber($xml);

  // return it!
  return imageModel;
};

VJS.parsers.dicom.prototype.goNAMICEncodingType = function(imageUniqueName) {
  // get  encoding type!
  var dumpLines = [];
  Module.print = function(s) {
    dumpLines.push(s);
  };
  dcmjs.utils.execute('dcmdump', ['+P', '0002,0010', '--load-short', imageUniqueName]);
  var  encoding = 'Unknown';

  if (dumpLines.length === 1) {
    // split on white space
    var split = dumpLines[0].split(' ');
    // should be the 3rd occurence
    if (split.length >= 3) {
      // strip leading = if any
      if (split[2].substring(0, 1) === '=') {
        encoding = split[2].substring(1);
      } else {
        encoding = split[2];
      }
    }
  }
  return encoding;
};

VJS.parsers.dicom.prototype.goNAMICRawData = function(imageUniqueName) {
  // get  encoding type!
  var rawPixelData = [];
  Module.print = function(s) {
    rawPixelData.push(s);
  };
  dcmjs.utils.execute('dcmdump', ['+P', '7fe0,0010', '--write-pixel', '.', imageUniqueName]);

  return rawPixelData;
};

VJS.parsers.dicom.prototype.goNAMICXMLHeader = function(imageUniqueName) {

  var dumpLines = [];
  Module.print = function(s) {
    dumpLines.push(s);
  };
  dcmjs.utils.execute('dcm2xml', ['--native-format', imageUniqueName]);

  var xmlHeader = dumpLines.join('\n');

  return xmlHeader;
};

VJS.parsers.dicom.prototype.parse = function() {
  var self = this;
  console.time('Parsing Dicom');
  var imageNameFS = 'image_' + self._id;
  var frameNameFS = imageNameFS + '-raw.8b';

  self.goNAMIC(imageNameFS, self._arrayBuffer);
  return;

  // save on FS
  self.fileToFS(imageNameFS, self._arrayBuffer);

  // save frames on FS
  self.framesToFS(imageNameFS, frameNameFS);

  // dump dicom header to XML
  var xml = self.dumpToXML(imageNameFS);

  // create VJS friendly image
  var $dicomDom = $.parseXML(xml);
  var image = self.domToImage($dicomDom, frameNameFS);

  return image;
};

VJS.parsers.dicom.prototype.parsePromise = function() {
  var self = this;
  console.time('Parsing Dicom');
  var imageNameFS = 'image_' + self._id;
  var frameNameFS = imageNameFS + '-raw.8b';
  //
  // Promises in action!
  //
  var sequence = Promise.resolve();
  return sequence
        .then(function() {
          // same image to Virtual FS
          return self.fileToFS(imageNameFS, self._arrayBuffer);
        })
        .then(function() {
          // extract frames from image and save it on Vistual FS
          return self.framesToFS(imageNameFS, frameNameFS);
        })
        .then(function() {
          // extract dicom header from image and convert it to XML
          return self.dumpToXML(imageNameFS);
        })
        .then(function(xml) {
          // parse XML Header and build VJS objects
          var $dicomDom = $.parseXML(xml);
          //window.console.log($dicomDom);
          var image = self.domToImage($dicomDom, frameNameFS);
          //resolve(self.domToImage($dicomDom, frameNameFS));

          // Dom to image it!
          return image;
        });
};

/**
 * Promise dump dicom file to xml.
 * Call dcm2xml over a file previously savedd on the virtual FS.
 * {@link http://support.dcmtk.org/docs-snapshot/dcm2xml.html}
 *
 * @todo Doesn't have to be a promise...
 *
 *
 * @param filename {string} - Name of the file to be dumped.
 *
 * @returns {string} Xml dump from dicom file.
 */
VJS.parsers.dicom.prototype.fileToFS = function(filename, arraybuffer) {
  window.console.log('fileToFS');
  var uploadedObject = new Int8Array(arraybuffer);
  var options = {
    encoding: 'binary'
  };

  // NOT ASYNC!!!! :(
  var output = FS.writeFile(filename, uploadedObject, options);
  window.console.log(output);

  return output;
};

VJS.parsers.dicom.prototype.framesToFS = function(filename, framenameFS) {
  window.console.log('framesToFS');
  var dcm2pnmOptions = ['--verbose', '--all-frames', '--write-raw-pnm', filename, framenameFS];
  var output = dcmjs.utils.execute('dcm2pnm', dcm2pnmOptions);
  return output;
  //});
};

VJS.parsers.dicom.prototype.dumpToXML = function(filename) {
  //return new Promise(function(resolve) {
  window.console.log('dumpToXML');
  // sleep(6000);
  // return 'YAY';
  // dcmudmp
  var dumpLines = [];
  Module.print = function(s) {
    dumpLines.push(s);
  };

  var returnCode = dcmjs.utils.execute('dcm2xml', ['--native-format', filename]);
  Module.print = print;
  window.console.log(returnCode);

  var xml = dumpLines.join('\n');
  //window.console.log(xml);
  // also escape invalid characters!!!!!

  return xml;
  // });
};

/**
 * Convert jQuery representation of XML dump to VJS image.
 * It creates VJS.image, VJS.stack and VJS.frame as needed and fills it.
 *
 * Also extracts the frame with robust (but slow) dcm2pnm.
 * {@link http://support.dcmtk.org/docs/dcm2pnm.html}
 *
 * Need to define strategy to parse the dicom file
 * Has stacks?
 * No stacks?
 * Per Frame functional groups?
 * Shared functional groups?
 *
 * https://github.com/FNNDSC/vjs/commit/3d9d15e87ed82568e9573e9fa290b1753054baf2
 *
 * @param dom {jQueryObj} - $.parseXML(xml) output.
 * @param filename {string} - Target file name.
 *
 * @returns {VJS.Image} VJS Image of target dicom.
 */
VJS.parsers.dicom.prototype.domToImage = function(dom, filename) {

  window.console.log('domToImage', this);
  window.console.log(this);

  var imageFilePath = filename;
  var $dom = $(dom);

  // Create the image
  // Get information that is image specific
  // http://medical.nema.org/medical/dicom/current/output/html/part03.html#sect_C.7.6.16
  var imageModel = new vjsModelsImage();
  // why can't we use series UID? to concatenate?
  imageModel._concatenationUID = this.imageConcatenationUID($dom);
  imageModel._seriesUID = this.imageSeriesUID($dom);
  imageModel._seriesNumber = this.imageSeriesNumber($dom);
  imageModel._imageFrameOfReferenceUID = this.frameOfReferenceUID($dom);
  imageModel._dimensionIndexSequence = this.imageDimensionIndexSequence($dom);
  imageModel._numberOfFrames = this.imageNumberOfFrames($dom);
  // Are those image specific?
  // image pixel module!!!!
  // image pixel module!!!!
  // no, it is frame specific!
  imageModel._rows = this.imageRows($dom);
  // no, it is frame specific!
  imageModel._columns = this.imageColumns($dom);
  imageModel._photometricInterpretation = this.imagePhotometricInterpretation($dom);

  // Create stacks and frames
  // Get information that is stack and frame specific
  for (var i = 0; i < imageModel._numberOfFrames; i++) {
    // get frame specific information
    // starts at 1
    var frameIndex = i + 1;
    var $perFrameFunctionalGroupsSequence = this.imagePerFrameFunctionalGroupSequence(frameIndex, $dom);
    //get shared frame function group sequence too

    // Stack ID is unique???
    var stackID = this.getFrameStackID($perFrameFunctionalGroupsSequence, $dom);
    var dimensionIndexValues = this.getFrameDimensionIndexValues($perFrameFunctionalGroupsSequence, $dom);

    var currentStack = null;
    var stackByID = imageModel._stack.filter(this.filterByStackID, stackID);

    // Create stack object and add it to image if necessary
    if (stackByID.length === 0) {
      //window.console.log('+++ stack');
      var stackModel = new vjsModelsStack();
      stackModel._stackID = stackID;
      imageModel._stack.push(stackModel);
      currentStack = stackModel;
    } else {
      //window.console.log('= stack');
      currentStack = stackByID[0];
    }

    currentStack._rows = imageModel._rows;
    currentStack._columns = imageModel._columns;

    // Add frame to Stack
    var currentFrame = null;

    window.console.log('outside!!!');
    window.console.log(dimensionIndexValues);
    window.console.log(currentStack._frame);

    // use dimension instead to know if already there!
    var dimensionIndex = currentStack._frame.filter(this.dimensionIndex, dimensionIndexValues);

    // Create frame object and add it to image if necessary
    if (dimensionIndex.length === 0) {
      window.console.log('+++ frame');
      var frameModel = new vjsModelsFrame();
      frameModel._dimensionIndexValues = dimensionIndex;
      currentStack._frame.push(frameModel);
      currentFrame = frameModel;
    } else {
      // frame exists, go to next frame.
      window.console.log('--- frame');
      continue;
      //window.console.log('= frame');
      //currentFrame = frameByPositionAndTime[0];
    }

    // Fill content of a frame

    // Instance number!
    currentFrame._instanceNumber = this.getImageInstanceNumber($dom);

    //
    // General Information
    //
    currentFrame._rows = currentStack._rows;
    currentFrame._columns = currentStack._columns;

    //
    // Frame Content Sequence
    //
    currentFrame._stackID = stackID;
    currentFrame._dimensionIndexValues = dimensionIndexValues;
    // http://medical.nema.org/medical/dicom/current/output/html/part03.html#sect_C.7.6.2
    // image plane module!!!!
    // image plane module!!!!
    currentFrame._imagePositionPatient = this.getFrameImagePositionPatient($perFrameFunctionalGroupsSequence, $dom);
    currentFrame._imageOrientationPatient = this.getFrameImageOrientationPatient($perFrameFunctionalGroupsSequence, $dom);

    //
    // Pixel Measure Sequence
    //
    // image pixel module!
    // http://medical.nema.org/medical/dicom/current/output/html/part03.html#sect_C.7.6.3
    currentFrame._sliceThickness = this.getFrameSliceThickness($perFrameFunctionalGroupsSequence, $dom);
    currentFrame._pixelSpacing = this.getFramePixelSpacing($perFrameFunctionalGroupsSequence, $dom);
    currentFrame._spacingBetweenSlices = this.getSpacingBetweenSlices($perFrameFunctionalGroupsSequence, $dom);

    // currentFrame.pixelData = pnmBuffer;
    // pixel type? (to guess file extension)
    var ppmExtension = 'pgm';
    currentFrame.nbChannels = 1;
    if (imageModel._photometricInterpretation === 'RGB' ||
        imageModel._photometricInterpretation === 'PALETTE COLOR' ||
        imageModel._photometricInterpretation === 'YBR_FULL' ||
        imageModel._photometricInterpretation === 'YBR_FULL_422' ||
        imageModel._photometricInterpretation === 'YBR_PARTIAL_422' ||
        imageModel._photometricInterpretation === 'YBR_PARTIAL_420' ||
        imageModel._photometricInterpretation === 'YBR_RCT') {
      ppmExtension = 'ppm';
      currentFrame._nbChannels = 3;
    }

    var stat = FS.stat(imageFilePath + '.' + i + '.' + ppmExtension);
    var stream = FS.open(imageFilePath + '.' + i + '.' + ppmExtension);
    var pnmBuffer = new Uint8Array(stat.size);
    FS.read(stream, pnmBuffer, 0, stat.size);
    FS.close(stream);

    // // // https://www.branah.com/ascii-converter
    // // // dec to ascii
    // always 15 bits header?
    var pixelData = pnmBuffer.subarray(15);
    currentFrame._pixelData = pixelData;

    // mailing list for DICOM?
  }

  // for each frame, get info of interest
  //var perFrame = $dom.find('[tag="52009230"] [tag="00289110"] [tag="00180050"]');
  //window.console.log(perFrame);

  // starts at 1
  //var $frame1 = $dom.find('[tag="52009230"] > [number="1"]');
  //window.console.log($frame1);
  // how do we get pixel data from there...?
  // where does time fit?
  return imageModel;
};

/**
 * Get number of frames in the image.
 *
 *
 * @param imageJqueryDom {jQueryObj} - jQuery representation of the whole image.
 *
 * @returns {number} Number of frames in the target image.
 */
VJS.parsers.dicom.prototype.imageNumberOfFrames = function(imageJqueryDom) {
  // try to access number of frames through its DICOM tag
  var numberOfFrames = imageJqueryDom.find('[tag="00280008"] Value').text();

  // if not available, assume we only have 1 frame
  if (numberOfFrames === '') {
    numberOfFrames = 1;
  }
  return numberOfFrames;
};

/**
 * Get concatenationID in the image.
 *
 *
 * @param imageJqueryDom {jQueryObj} - jQuery representation of the whole image.
 *
 * @returns {number} Concatenation ID of the target image.
 */
VJS.parsers.dicom.prototype.imageConcatenationUID = function(imageJqueryDom) {
  // try to access concatenationUID through its DICOM tag
  var concatenationUID = imageJqueryDom.find('[tag="00209161"] Value').text();

  // if not available, assume we only have 1 frame
  if (concatenationUID === '') {
    concatenationUID = 1;
  }
  return concatenationUID;
};

/**
 * Get SeriesUID of the image.
 *
 *
 * @param imageJqueryDom {jQueryObj} - jQuery representation of the whole image.
 *
 * @returns {number} Series UID of the target image.
 */
VJS.parsers.dicom.prototype.imageSeriesUID = function(imageJqueryDom) {
  // try to access seriesUID through its DICOM tag
  var seriesUID = imageJqueryDom.find('[tag="0020000E"] Value').text();
  window.console.log(imageJqueryDom.find('[tag="0020000E"] Value'));

  // if not available, assume we only have 1 frame
  if (seriesUID === '') {
    seriesUID = 1;
  }
  return seriesUID;
};

/**
 * Get Series Number of the image.
 *
 *
 * @param imageJqueryDom {jQueryObj} - jQuery representation of the whole image.
 *
 * @returns {number} Series Number of the target image.
 */
VJS.parsers.dicom.prototype.imageSeriesNumber = function(imageJqueryDom) {
  // try to access seriesNumber through its DICOM tag
  var seriesNumber = imageJqueryDom.find('[tag="00200011"] Value').text();

  // if not available, assume we only have 1 frame
  if (seriesNumber === '') {
    seriesNumber = 1;
  }
  return seriesNumber;
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

/**
 * Get Dimension Index Sequence of the image.
 *
 *
 * @param imageJqueryDom {jQueryObj} - jQuery representation of the whole image.
 *
 * @returns {Array<Object>} List dimensions in the Image.
 */
VJS.parsers.dicom.prototype.imageDimensionIndexSequence = function(imageJqueryDom) {
  var dimensionIndexSequence = imageJqueryDom.find('[tag="00209222"]');
  var data = [];
  // pass it an array!
  dimensionIndexSequence.children().each(this.fillDimensionIndexSequence(data));
  return data;
};

/**
 * Convenience function to get dimension index sequence from jQuery each callback.
 *
 *
 * @param data {Array} Array to be filled.
 */
VJS.parsers.dicom.prototype.fillDimensionIndexSequence = function(data) {
  return function() {
    data.push({
      'dimensionDescriptionLabel': $(this).find('[tag="00209421"] Value').text()
    });
  };
};

/**
 * Get Rows of the image.
 *
 *
 * @param imageJqueryDom {jQueryObj} - jQuery representation of the whole image.
 *
 * @returns {number} Rows in the image.
 */
VJS.parsers.dicom.prototype.imageRows = function(imageJqueryDom) {
  var rows = parseInt(imageJqueryDom.find('[tag="00280010"]').text(), 10);
  return rows;
};

/**
 * Get Columns of the image.
 *
 *
 * @param imageJqueryDom {jQueryObj} - jQuery representation of the whole image.
 *
 * @returns {number} Columns in the image.
 */
VJS.parsers.dicom.prototype.imageColumns = function(imageJqueryDom) {
  var columns = parseInt(imageJqueryDom.find('[tag="00280011"]').text(), 10);
  return columns;
};

/**
 * Get Photometric Interpretation of the image.
 *
 *
 * @param imageJqueryDom {jQueryObj} - jQuery representation of the whole image.
 *
 * @returns {string} Photometric interpretation of the image.
 */
VJS.parsers.dicom.prototype.imagePhotometricInterpretation = function(imageJqueryDom) {
  var photometricInterpretation = imageJqueryDom.find('[tag="00280004"] Value').text();
  return photometricInterpretation;
};

/**
 * Get jQuery representation of frame per-frame functionnal group sequence.
 *
 *
 * @param frameIndex {number} - Frame index of interest.
 * @param imageJqueryDom {jQueryObj} - jQuery representation of the whole image.
 *
 * @returns {jQueryObj} jQuery representation of frame per-frame functionnal group sequence.
 */
VJS.parsers.dicom.prototype.imagePerFrameFunctionalGroupSequence = function(frameIndex, imageJqueryDom) {
  var $perFrameFunctionalGroupSequence = imageJqueryDom.find('[tag="52009230"] > [number="' + frameIndex + '"]');
  return $perFrameFunctionalGroupSequence;
};

/**
 * Convenience function to filter array on inner's object _stackID.
 *
 *
 * @param obj {VJS.Stack.model} - Stack Model.
 */
VJS.parsers.dicom.prototype.filterByStackID = function(obj) {
  /*jshint validthis:true*/
  if ('_stackID' in obj && typeof(obj._stackID) === 'number' && !isNaN(obj._stackID) && obj._stackID === this) {
    return true;
  } else {
    return false;
  }
};

// do not handle case with multiple imagePixel datas yet...
VJS.parsers.dicom.prototype.imagePixelData = function(imageJqueryDom) {
  var pixelData = imageJqueryDom.find('[name="PixelData"]');
  //7fe00010
  window.console.log(pixelData);
  return pixelData;
};

//
//STACK RELATED CONVENIENCE METHODS
//
// SHOULD WE PASS FRAME INDEX + IMAGE DOM INSTEAD OF FRAME DOM?
//
//FRAME RELATED CONVENIENCE METHODS
//
VJS.parsers.dicom.prototype.getFrameStackID = function(frameJqueryPreFrameDom, imageJqueryDom) {
  var stackID = parseInt(frameJqueryPreFrameDom.find('[tag="00209111"] [tag="00209056"] Value').text(), 10);

  // or look for it in the imageJqueryDom?
  if (isNaN(stackID)) {
    window.console.log('stackID', stackID);
    window.console.log('imageJqueryDom', imageJqueryDom);
    stackID = 1;
  }

  return stackID;
};

VJS.parsers.dicom.prototype.getFrameInStackPositionNumber = function(frameJqueryPreFrameDom, imageJqueryDom) {
  var inStackPositionNumber = parseInt(frameJqueryPreFrameDom.find('[tag="00209111"] [tag="00209057"] Value').text(), 10);

  // or look for it in the imageJqueryDom?
  if (isNaN(inStackPositionNumber)) {
    window.console.log('inStackPositionNumber', inStackPositionNumber);
    window.console.log('imageJqueryDom', imageJqueryDom);
    inStackPositionNumber = 1;
  }

  return inStackPositionNumber;
};

VJS.parsers.dicom.prototype.getFrameTemporalPostionIndex = function(frameJqueryPreFrameDom, imageJqueryDom) {
  var temporalPositionIndex = parseInt(frameJqueryPreFrameDom.find('[tag="00209111"] [tag="00209128"] Value').text(), 10);

  // or look for it in the imageJqueryDom?
  if (isNaN(temporalPositionIndex)) {
    window.console.log('temporalPositionIndex', temporalPositionIndex);
    window.console.log('imageJqueryDom', imageJqueryDom);
    temporalPositionIndex = 1;
  }

  return temporalPositionIndex;
};

VJS.parsers.dicom.prototype.getFrameDimensionIndexValues = function(frameJqueryPreFrameDom, imageJqueryDom) {
  var $perFrameDimension = frameJqueryPreFrameDom.find('[tag="00209111"] [tag="00209157"]');
  var dimensionIndexValues = [];
  $perFrameDimension.children().each(this.fillDimensionIndexValues(dimensionIndexValues));

  // or look for it in the imageJqueryDom?
  if (!$perFrameDimension) {
    window.console.log('$perFrameDimension', $perFrameDimension);
    window.console.log('imageJqueryDom', imageJqueryDom);
  }

  return dimensionIndexValues;
};

VJS.parsers.dicom.prototype.fillDimensionIndexValues = function(container) {
  return function() {
    container.push($(this).text());
  };
};

VJS.parsers.dicom.prototype.dimensionIndex = function(obj) {
  /*jshint validthis:true*/
  window.console.log('inside!!!');
  window.console.log(this);
  window.console.log(obj);
  if (this.join() === obj._dimensionIndexValues.join()) {
    return true;
  } else {
    return false;
  }
};

VJS.parsers.dicom.prototype.getFrameImagePositionPatient = function(frameJqueryPreFrameDom, imageJqueryDom) {
  var imagePositionPatient = {
    'x': 0,
    'y': 0,
    'z': 0
  };
  imagePositionPatient.x = parseFloat(frameJqueryPreFrameDom.find('[tag="00209113"] [tag="00200032"] Value[number="1"]').text(), 10);
  imagePositionPatient.y = parseFloat(frameJqueryPreFrameDom.find('[tag="00209113"] [tag="00200032"] Value[number="2"]').text(), 10);
  imagePositionPatient.z = parseFloat(frameJqueryPreFrameDom.find('[tag="00209113"] [tag="00200032"] Value[number="3"]').text(), 10);

  // or look for it in the imageJqueryDom?
  if (isNaN(imagePositionPatient.x) || isNaN(imagePositionPatient.y) || isNaN(imagePositionPatient.z)) {
    // try to get it from the imageJqueryDom
    imagePositionPatient.x = parseFloat(imageJqueryDom.find('[tag="00200032"] Value[number="1"]').text(), 10);
    imagePositionPatient.y = parseFloat(imageJqueryDom.find('[tag="00200032"] Value[number="2"]').text(), 10);
    imagePositionPatient.z = parseFloat(imageJqueryDom.find('[tag="00200032"] Value[number="3"]').text(), 10);

    if (isNaN(imagePositionPatient.x) || isNaN(imagePositionPatient.y) || isNaN(imagePositionPatient.z)) {
      window.console.log('imagePositionPatient', imagePositionPatient);
      window.console.log('imageJqueryDom', imageJqueryDom);
      imagePositionPatient = {
        'x': 0,
        'y': 0,
        'z': 0
      };
    }

  }

  return imagePositionPatient;
};

VJS.parsers.dicom.prototype.getImageInstanceNumber = function(imageJqueryDom) {
  var instanceNumber = -1;
  instanceNumber = parseFloat(imageJqueryDom.find('[tag="00200013"]').text(), 10);

  if (isNaN(instanceNumber)) {
    window.console.log('instanceNumber', instanceNumber);
    window.console.log('imageJqueryDom', imageJqueryDom);
    instanceNumber = -1;
  }

  return instanceNumber;
};

VJS.parsers.dicom.prototype.getFrameImageOrientationPatient = function(frameJqueryPreFrameDom, imageJqueryDom) {
  var imageOrientationPatient = {
    'row': {
      'x': 1,
      'y': 0,
      'z': 0
    },
    'column': {
      'x': 0,
      'y': 1,
      'z': 0
    }
  };
  imageOrientationPatient.row.x = parseFloat(frameJqueryPreFrameDom.find('[tag="00209116"] [tag="00200037"] Value[number="1"]').text(), 10);
  imageOrientationPatient.row.y = parseFloat(frameJqueryPreFrameDom.find('[tag="00209116"] [tag="00200037"] Value[number="2"]').text(), 10);
  imageOrientationPatient.row.z = parseFloat(frameJqueryPreFrameDom.find('[tag="00209116"] [tag="00200037"] Value[number="3"]').text(), 10);
  imageOrientationPatient.column.x = parseFloat(frameJqueryPreFrameDom.find('[tag="00209116"] [tag="00200037"] Value[number="4"]').text(), 10);
  imageOrientationPatient.column.y = parseFloat(frameJqueryPreFrameDom.find('[tag="00209116"] [tag="00200037"] Value[number="5"]').text(), 10);
  imageOrientationPatient.column.z = parseFloat(frameJqueryPreFrameDom.find('[tag="00209116"] [tag="00200037"] Value[number="6"]').text(), 10);

  // or look for it in the imageJqueryDom?
  if (isNaN(imageOrientationPatient.row.x) ||
      isNaN(imageOrientationPatient.row.y) ||
      isNaN(imageOrientationPatient.row.z) ||
      isNaN(imageOrientationPatient.column.x) ||
      isNaN(imageOrientationPatient.column.y) ||
      isNaN(imageOrientationPatient.column.z)) {

    imageOrientationPatient.row.x = parseFloat(imageJqueryDom.find('[tag="00200037"] Value[number="1"]').text(), 10);
    imageOrientationPatient.row.y = parseFloat(imageJqueryDom.find('[tag="00200037"] Value[number="2"]').text(), 10);
    imageOrientationPatient.row.z = parseFloat(imageJqueryDom.find('[tag="00200037"] Value[number="3"]').text(), 10);
    imageOrientationPatient.column.x = parseFloat(imageJqueryDom.find('[tag="00200037"] Value[number="4"]').text(), 10);
    imageOrientationPatient.column.y = parseFloat(imageJqueryDom.find('[tag="00200037"] Value[number="5"]').text(), 10);
    imageOrientationPatient.column.z = parseFloat(imageJqueryDom.find('[tag="00200037"] Value[number="6"]').text(), 10);

    if (isNaN(imageOrientationPatient.row.x) ||
        isNaN(imageOrientationPatient.row.y) ||
        isNaN(imageOrientationPatient.row.z) ||
        isNaN(imageOrientationPatient.column.x) ||
        isNaN(imageOrientationPatient.column.y) ||
        isNaN(imageOrientationPatient.column.z)) {
      // window.console.log('imageOrientationPatient', imageOrientationPatient);
      // window.console.log('imageJqueryDom', imageJqueryDom);
      imageOrientationPatient = {
        'row': {
          'x': 1,
          'y': 0,
          'z': 0
        },
        'column': {
          'x': 0,
          'y': 1,
          'z': 0
        }
      };
    }
  }

  // window.console.log('image orientation!');

  // var test = imageJqueryDom.find('[tag="00200037"] Value[number="1"]').text();
  // window.console.log(test, ' vs ', imageOrientationPatient.row.x);

  return imageOrientationPatient;
};

VJS.parsers.dicom.prototype.getFrameSliceThickness = function(frameJqueryPreFrameDom, imageJqueryDom) {
  var sliceThickness = parseFloat(frameJqueryPreFrameDom.find('[tag="00289110"] [tag="00180050"] Value').text(), 10);
  // or look for it in the imageJqueryDom?
  if (isNaN(sliceThickness)) {
    window.console.log('sliceThickness', sliceThickness);
    window.console.log('imageJqueryDom', imageJqueryDom);
    sliceThickness = 1;
  }

  return sliceThickness;
};

VJS.parsers.dicom.prototype.getFramePixelSpacing = function(frameJqueryPreFrameDom, imageJqueryDom) {
  var pixelSpacing = {
    'row': 1,
    'column': 1
  };

  pixelSpacing.row = parseFloat(frameJqueryPreFrameDom.find('[tag="00289110"] [tag="00280030"] Value[number="1"]').text(), 10);
  pixelSpacing.column = parseFloat(frameJqueryPreFrameDom.find('[tag="00289110"] [tag="00280030"] Value[number="2"]').text(), 10);

  // or look for it in the imageJqueryDom?
  if (isNaN(pixelSpacing.row) || isNaN(pixelSpacing.column)) {

    pixelSpacing.row = parseFloat(imageJqueryDom.find('[tag="00280030"] Value[number="1"]').text(), 10);
    pixelSpacing.column = parseFloat(imageJqueryDom.find('[tag="00280030"] Value[number="2"]').text(), 10);

    if (isNaN(pixelSpacing.row) || isNaN(pixelSpacing.column)) {
      window.console.log('pixelSpacing', pixelSpacing);
      window.console.log('imageJqueryDom', imageJqueryDom);
      pixelSpacing = {
        'row': 1,
        'column': 1
      };
    }
  }

  return pixelSpacing;
};

VJS.parsers.dicom.prototype.getSpacingBetweenSlices = function(frameJqueryPreFrameDom, imageJqueryDom) {
  var spacingBetweenSlices = 1.0;

  spacingBetweenSlices = parseFloat(frameJqueryPreFrameDom.find('[tag="00180088"] Value').text(), 10);

  // or look for it in the imageJqueryDom?
  if (isNaN(spacingBetweenSlices)) {
    window.console.log('spacingBetweenSlices', spacingBetweenSlices);
    window.console.log('imageJqueryDom', imageJqueryDom);
    spacingBetweenSlices = 1.0;
  }

  return spacingBetweenSlices;
};

//
// Plane Orientation Sequence
//

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
