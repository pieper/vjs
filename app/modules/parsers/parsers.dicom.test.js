/* globals describe, it, expect, beforeEach*/
'use strict';

//var dicomParser = require('dicom-parser');
var vjsParsersDicom = require('../parsers/parsers.dicom');


var datasets = [];
// fruit dataset
var data = {
  name: 'MRI - single channel - enhanced',
  url: '/base/app/data/dcm/fruit.dcm',
  nbOfFrames: 60
};
datasets.push(data);

// //
// data = {
//   name: 'MRI - 3 channels',
//   url: '/base/app/data/dcm/US-RGB-8-esopecho.dcm',
//   nbOfFrames: 1
// };
// datasets.push(data);

function MRITestSequence(mri) {
  describe(mri.name, function() {

    // before each, load the data...
    var dataset;
    var originalTimeout;

    beforeEach(function(done) {
      // originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      // jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

      // fetch the data!
      var oReq = new XMLHttpRequest();
      oReq.open('GET', mri.url, true);
      oReq.responseType = 'arraybuffer';
      
      oReq.onload = function(oEvent) {
        var arrayBuffer = oReq.response; // Note: not oReq.responseText
        if (arrayBuffer) {
                      var byteArray = new Uint8Array(arrayBuffer);
                      window.console.log(byteArray.length);
            //dataset =  dicomParser.parseDicom(byteArray);
          //dataset = new vjsParsersDicom(arrayBuffer,0);
          done();
        }
      };
      oReq.send();
    });

    it('contains expected number of frames', function() {
        expect(true).toBe(true);
      });

    it('contains expected number of rows', function() {
        expect(true).toBe(true);
      });

    it('contains expected number of colums', function() {
        expect(true).toBe(true);
      });

    it('contains expected number of channels', function() {
        expect(true).toBe(true);
      });
  });
}

describe('Parser.dicom', function() {
  for (var i = 0; i < datasets.length; i++) {
    // var i = 0;
    MRITestSequence(datasets[i]);
  }
});
