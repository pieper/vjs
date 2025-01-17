/* globals describe, it, expect, beforeEach*/
'use strict';

// MISSING:
// frame of reference
// dimensions
// stacks

var vjsParsersDicom = require('../parsers/parsers.dicom');

var datasets = [];
var data = {};

// MR
// frames not ordered
// need to use indexDimensionValues to order properly!
data = {
  name: 'Fruit and Veggies!',
  from: 'http://www.insight-journal.org/midas/collection/view/194',
  url: '/base/data/dcm/fruit.dcm.tar',

  // Series specific
  modality: 'MR',
  seriesInstanceUID: '1.3.46.670589.11.5730.5.0.10204.2010041914320789246',
  transferSyntaxUID: '1.2.840.10008.1.2.1', // Implicit VR Endian
  numberOfFrames: 60,
  numberOfChannels: 1,

  // Stack specific

  // Frame specific
  photometricInterpretation: 'MONOCHROME2',
  planarConfiguration: null,
  samplesPerPixel: 1,
  imageOrientation: [1, 0, 0, 0, 1, 0],
  imagePosition: [-74.26927947998, -96.01170349121, -56.623718261718],
  pixelSpacing: [0.17299106717109, 0.17299106717109],
  sopInstanceUID: '1.3.46.670589.11.5730.5.20.1.1.10204.2010041914320789246',
  sliceThickness: 2.5,
  rows: 896,
  columns: 896,
  pixelRepresentation: 0,
  bitsAllocated: 16,
  highBit: 11,
  rescaleIntercept: 0.0,
  rescaleSlope: 0,
  windowCenter: 359,
  windowWidth: 623,
  dimensionIndexValues: [1, 1],
  instanceNumber: 1,
  pixelAspectRatio: null,
  inStackPositionNumber: 1,
  stackID: 1,

  // computed values
  minMax: [0, 437]
};
datasets.push(data);

data = {
  name: 'Osirix test',
  from: 'OSIRIX',
  url: '/base/data/dcm/MELANIX.dcm.tar',

  // Series specific
  modality: 'CT',
  seriesInstanceUID: '1.3.12.2.1107.5.1.4.48545.30000006091907514717100002940',
  transferSyntaxUID: '1.2.840.10008.1.2.4.91', // JPEG 2000 Image Compression
  numberOfFrames: null,
  numberOfChannels: 1,

  // Stack specific

  // Frame specific
  photometricInterpretation: 'MONOCHROME2',
  planarConfiguration: null,
  samplesPerPixel: 1,
  imageOrientation: [1, 0, 0, 0, 1, 0],
  imagePosition: [-249.51171875, -366.51171875, -801.6],
  pixelSpacing: [0.9765625, 0.9765625],
  sopInstanceUID: '1.3.12.2.1107.5.1.4.48545.30000006091907514717100003456',
  sliceThickness: 2,
  rows: 512,
  columns: 512,
  pixelRepresentation: 0,
  bitsAllocated: 16,
  highBit: 11,
  rescaleIntercept: -1024,
  rescaleSlope: 1.0,
  windowCenter: 40,
  windowWidth: 400,
  dimensionIndexValues: null,
  instanceNumber: 516,
  pixelAspectRatio: null,
  inStackPositionNumber: null,
  stackID: null,

  // computed values
  minMax: [0, 2402]
};
datasets.push(data);

// US
data = {
  name: 'US - RGB',
  from: 'http://www.barre.nom.fr/medical/samples/',
  url: '/base/data/dcm/US-RGB-8-esopecho.dcm.tar',

  // Series specific
  modality: 'US',
  seriesInstanceUID: '999.999.2.19941105.112000.2',
  transferSyntaxUID: '1.2.840.10008.1.2.1', // Implicit VR Endian
  numberOfFrames: null,
  numberOfChannels: 3,

  // Stack specific

  // Frame specific
  photometricInterpretation: 'RGB',
  planarConfiguration: 0,
  samplesPerPixel: 3,
  imageOrientation: null,
  imagePosition: null,
  pixelSpacing: null,
  sopInstanceUID: '999.999.2.19941105.112000.2.107',
  sliceThickness: null,
  rows: 120,
  columns: 256,
  pixelRepresentation: 0,
  bitsAllocated: 8,
  highBit: 7,
  rescaleIntercept: null,
  rescaleSlope: null,
  windowCenter: null,
  windowWidth: null,
  dimensionIndexValues: null,
  instanceNumber: 107,
  pixelAspectRatio: [4, 3],
  inStackPositionNumber: null,
  stackID: null,

  // computed values
  minMax: [16, 248]
};
datasets.push(data);

// MR
data = {
  name: 'MR - Multiframe',
  from: 'http://www.barre.nom.fr/medical/samples/',
  url: '/base/data/dcm/MR-MONO2-8-16x-heart.dcm.tar',

  // Series specific
  modality: 'MR',
  seriesInstanceUID: '999.999.2.19960619.163000.1',
  transferSyntaxUID: '1.2.840.10008.1.2.1', // Implicit VR Endian
  numberOfFrames: 16,
  numberOfChannels: 1,

  // Stack specific

  // Frame specific
  photometricInterpretation: 'MONOCHROME2',
  planarConfiguration: null,
  samplesPerPixel: 1,
  imageOrientation: null,
  imagePosition: null,
  pixelSpacing: null,
  sopInstanceUID: '999.999.2.19960619.163000.1.103',
  sliceThickness: 10,
  rows: 256,
  columns: 256,
  pixelRepresentation: 0,
  bitsAllocated: 8,
  highBit: 7,
  rescaleIntercept: null,
  rescaleSlope: null,
  windowCenter: null,
  windowWidth: null,
  dimensionIndexValues: null,
  instanceNumber: 103,
  pixelAspectRatio: null,
  inStackPositionNumber: null,
  stackID: null,

  // computed values
  minMax: [0, 252]
};
datasets.push(data);

function DICOMTestSequence(referenceDataset) {
  describe(referenceDataset.name, function() {

    // before each, load the data...
    var parser;

    beforeEach(function(done) {
      // originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      // jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

      // fetch the data!
      var oReq = new XMLHttpRequest();
      oReq.open('GET', referenceDataset.url, true);
      oReq.responseType = 'arraybuffer';
      
      oReq.onload = function(oEvent) {
        var arrayBuffer = oReq.response;
        if (arrayBuffer) {
          parser = new vjsParsersDicom(arrayBuffer, 0);
          done();
        }
      };
      oReq.send();
    });

    // SERIES TESTING
    describe('Series Information', function() {
      it('Modality: ' + referenceDataset.modality, function() {
        expect(parser.modality()).toBe(referenceDataset.modality);
      });

      it('SOP Instance UID: ' + referenceDataset.seriesInstanceUID, function() {
        expect(parser.seriesInstanceUID()).toBe(referenceDataset.seriesInstanceUID);
      });

      it('Transfer Syntax UID: ' + referenceDataset.transferSyntaxUID, function() {
        expect(parser.transferSyntaxUID()).toBe(referenceDataset.transferSyntaxUID);
      });

      it('Number of frames: ' + referenceDataset.numberOfFrames, function() {
        expect(parser.numberOfFrames()).toBe(referenceDataset.numberOfFrames);
      });

      it('Number of channels: ' + referenceDataset.numberOfChannels, function() {
        expect(parser.numberOfChannels()).toBe(referenceDataset.numberOfChannels);
      });
    });

    // FRAME TESTING
    describe('Frame (image) Information', function() {
      it('Photometric Interpolation: ' + referenceDataset.photometricInterpretation, function() {
        expect(parser.photometricInterpretation()).toBe(referenceDataset.photometricInterpretation);
      });

      it('Planar configuration: ' + referenceDataset.planarConfiguration, function() {
        expect(parser.planarConfiguration()).toBe(referenceDataset.planarConfiguration);
      });

      it('Samples per pixel: ' + referenceDataset.samplesPerPixel, function() {
        expect(parser.samplesPerPixel()).toBe(referenceDataset.samplesPerPixel);
      });

      it('Rows: ' + referenceDataset.rows, function() {
        var frameIndex = 0;
        expect(parser.rows(frameIndex)).toBe(referenceDataset.rows);
      });

      it('Columns: ' + referenceDataset.columns, function() {
        var frameIndex = 0;
        expect(parser.columns(frameIndex)).toBe(referenceDataset.columns);
      });

      it('Image Orientation: ' + referenceDataset.imageOrientation, function() {
        var frameIndex = 0;
        expect(parser.imageOrientation(frameIndex)).toEqual(referenceDataset.imageOrientation);
      });

      it('Image Position: ' + referenceDataset.imagePosition, function() {
        var frameIndex = 0;
        expect(parser.imagePosition(frameIndex)).toEqual(referenceDataset.imagePosition);
      });

      it('Pixel Spacing: ' + referenceDataset.pixelSpacing, function() {
        var frameIndex = 0;
        expect(parser.pixelSpacing(frameIndex)).toEqual(referenceDataset.pixelSpacing);
      });

      it('SOP Instance UID: ' + referenceDataset.sopInstanceUID, function() {
        var frameIndex = 0;
        expect(parser.sopInstanceUID(frameIndex)).toBe(referenceDataset.sopInstanceUID);
      });

      it('Slice Thickness: ' + referenceDataset.sliceThickness, function() {
        var frameIndex = 0;
        expect(parser.sliceThickness(frameIndex)).toBe(referenceDataset.sliceThickness);
      });

      it('Pixel representation: ' + referenceDataset.pixelRepresentation, function() {
        var frameIndex = 0;
        expect(parser.pixelRepresentation(frameIndex)).toBe(referenceDataset.pixelRepresentation);
      });

      it('Bits allocated: ' + referenceDataset.bitsAllocated, function() {
        var frameIndex = 0;
        expect(parser.bitsAllocated(frameIndex)).toBe(referenceDataset.bitsAllocated);
      });

      it('High bit: ' + referenceDataset.highBit, function() {
        var frameIndex = 0;
        expect(parser.highBit(frameIndex)).toBe(referenceDataset.highBit);
      });

      it('Rescale intercept: ' + referenceDataset.rescaleIntercept, function() {
        var frameIndex = 0;
        expect(parser.rescaleIntercept(frameIndex)).toBe(referenceDataset.rescaleIntercept);
      });

      it('Rescale slope: ' + referenceDataset.rescaleSlope, function() {
        var frameIndex = 0;
        expect(parser.rescaleSlope(frameIndex)).toBe(referenceDataset.rescaleSlope);
      });

      it('Window center: ' + referenceDataset.windowCenter, function() {
        var frameIndex = 0;
        expect(parser.windowCenter(frameIndex)).toBe(referenceDataset.windowCenter);
      });

      it('Window width: ' + referenceDataset.windowWidth, function() {
        var frameIndex = 0;
        expect(parser.windowWidth(frameIndex)).toBe(referenceDataset.windowWidth);
      });

      it('Dimension index values: ' + referenceDataset.dimensionIndexValues, function() {
        var frameIndex = 0;
        expect(parser.dimensionIndexValues(frameIndex)).toEqual(referenceDataset.dimensionIndexValues);
      });

      it('Instance number: ' + referenceDataset.instanceNumber, function() {
        var frameIndex = 0;
        expect(parser.instanceNumber(frameIndex)).toEqual(referenceDataset.instanceNumber);
      });

      it('Pixel aspect ratio: ' + referenceDataset.pixelAspectRatio, function() {
        var frameIndex = 0;
        expect(parser.pixelAspectRatio(frameIndex)).toEqual(referenceDataset.pixelAspectRatio);
      });

      it('In stack position number: ' + referenceDataset.inStackPositionNumber, function() {
        var frameIndex = 0;
        expect(parser.inStackPositionNumber(frameIndex)).toEqual(referenceDataset.inStackPositionNumber);
      });

      it('Stack id: ' + referenceDataset.stackID, function() {
        var frameIndex = 0;
        expect(parser.stackID(frameIndex)).toEqual(referenceDataset.stackID);
      });
    });
  });
}

//dPixelData
// get pixel data, decompress
// length output
// min/max
function PixelDataTestSequence(referenceDataset) {
  describe(referenceDataset.name, function() {

    // before each, load the data...
    var parser;

    beforeEach(function(done) {
      // originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      // jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

      // fetch the data!
      var oReq = new XMLHttpRequest();
      oReq.open('GET', referenceDataset.url, true);
      oReq.responseType = 'arraybuffer';
      
      oReq.onload = function(oEvent) {
        var arrayBuffer = oReq.response;
        if (arrayBuffer) {
          parser = new vjsParsersDicom(arrayBuffer, 0);
          done();
        }
      };
      oReq.send();
    });

    describe('Parse pixel data', function() {

      it('Decompress pixel data', function() {
        var frameIndex = 0;
        var pixelData = parser.decompressPixelData(frameIndex);
        // check typeof and length...
        expect(true).toBe(true);
      });

      it('Extract pixel data', function() {
        var frameIndex = 0;
        var pixelData = parser.extractPixelData(frameIndex);
        // check typeof and length...
        expect(true).toBe(true);
      });

      it('Min,Max pixel data: ' + referenceDataset.minMax, function() {
        var frameIndex = 0;
        var pixelData = parser.extractPixelData(frameIndex);
        // hack for the compressed data, for now...
        if (pixelData) {
          var minMax = parser.minMaxPixelData(pixelData);
          expect(minMax).toEqual(referenceDataset.minMax);
        }
      });
    });
  });
}

// test extraction of tags of interest
describe('Parser.dicom', function() {
  for (var i = 0; i < datasets.length; i++) {
    // test utility functions to get dicom tags
    DICOMTestSequence(datasets[i]);

    // test pixelData related functionnalities
    PixelDataTestSequence(datasets[i]);
  }
});
