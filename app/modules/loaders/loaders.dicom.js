'use strict';

var VJS = VJS || {};

VJS.parsers = VJS.parsers || {};
VJS.parsers.dicom = VJS.parsers.dicom || require('../parsers/parsers.dicom');

VJS.models = VJS.models || {};
VJS.models.series = VJS.models.series || require('../models/models.series');
VJS.models.stack = VJS.models.stack || require('../models/models.stack');
VJS.models.frame = VJS.models.frame || require('../models/models.frame');

VJS.helpers = VJS.helpers || {};
VJS.helpers.series = VJS.helpers.series || require('../helpers/helpers.series');

/**
 * loaders namespace
 * @namespace loaders
 * @memberOf VJS
 * @public
 */

VJS.loaders = VJS.loaders || {};

/**
 *
 * It is typically used to load a DICOM image. Use loading manager for
 * advanced usage, such as multiple files handling.
 *
 * Demo: {@link https://fnndsc.github.io/vjs#loader_dicom}
 *
 * @constructor
 * @class
 * @memberOf VJS.loaders
 * @public
 *
 * @param {THREE.DefaultLoadingManager=} manager - Manager for advanced users.
 *
 * @example
 * var files = ['/data/dcm/fruit'];
 *
 * // Instantiate a dicom loader
 * var dicomLoader = new VJS.loaders.dicom();
 *
 * // load a resource
 * loader.load(
 *   // resource URL
 *   files[0],
 *   // Function when resource is loaded
 *   function(object) {
 *     //scene.add( object );
 *     window.console.log(object);
 *   }
 * );
 */
VJS.loaders.dicom = function(manager) {

    this.manager =
        (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
    this.crossOrigin = true;
    this.responseType = 'arraybuffer';
    this._imageHelper = null;
    this._image = null;

};
VJS.loaders.dicom.prototype.constructor = VJS.loaders.dicom;

/**
 *
 * Load target file and attach necessary callbacks.
 *
 * @todo Might want to implement onError extra layer like for "onLoad".
 * @public
 *
 * @param {string} url - Url of the file to be pulled.
 * @param {function} onLoad - On load callback, after response has been parsed by VJS.loaders.dicom.parse.
 * @param {function} onProgress - On progress callback.
 * @param {function} onError - On error callback.
 *
 * @returns {Array<Promise>} Loading sequence for each file.
 *
 */
VJS.loaders.dicom.prototype.load = function(file, onLoad, onProgress, onError) {
    // no more promises...!
    //

    var scope = this;


    // scope._imageHelper = new Array(files.length);
    // scope._image = new Array(files.length);

    var loader = new THREE.XHRLoader(scope.manager);
    loader.setCrossOrigin(this.crossOrigin);
    loader.setResponseType(this.responseType);
    loader.load(file, function(response) {

        onLoad(scope.parse(response));

    }, onProgress, onError);

    // Build the promise sequence for each file
    // return files.map(function(url, i) {

    //   var loader = new VJS.loader.xhrpromise(scope.manager);
    //   loader.setCrossOrigin(scope.crossOrigin);
    //   loader.setResponseType(scope.responseType);

    //   // 1- get the data
    //   // return an array buffer
    //   return loader.load(url, onProgress)
    //     .catch(function(error) {
    //       window.console.log(error);
    //       if (onError) {
    //         onError(error);
    //       }
    //     })
    //   // 2- parse the array buffer
    //   // return an image model
    //     .then(function(response) {
    //       var imageHelper = new VJS.helpers.image();
    //       scope._imageHelper[i] = imageHelper;
    //       var dicomParser = new VJS.parsers.dicom(response, imageHelper.id);
    //       return dicomParser.parse();
    //     })
    //   // 3- create helper with image
    //   // return the image helper
    //     .then(function(image) {
    //       scope._imageHelper[i].addImage(image);
    //       scope._image[i] = image;

    //       // a helper is an object we can directly add to the scene and visualize
    //       window.console.log('ALL SET');

    //       return scope._imageHelper[i];
    //     })
    //   // 4- run onLoad callback
    //   // input is imageHelper
    //   // (should it be the image?)
    //     .then(function(imageHelper) {
    //       if (onLoad) {
    //         window.console.log('onLoad callback (i.e. add to scene or play with helper)');
    //         onLoad(imageHelper);
    //       }

    //       return imageHelper;
    //     });
    // });
};

/**
 *
 * Parse the response and returned a well formatted VJS Image Helper;
 *
 * @public
 *
 * @param {arraybuffer} response - Data to be parsed.
 *
 * @returns {VJS.Helper.Image}
 *
 */
VJS.loaders.dicom.prototype.parse = function(response) {
    window.console.log(response);
    window.console.log('file downloaded yay!');

    // series helper with lot of goodies
    var seriesHelper = new VJS.helpers.series();

    // parse DICOM
    var dicomParser = new VJS.parsers.dicom(response, seriesHelper.id);
    
    // create a series
    var series = new VJS.models.series();
    series._seriesInstanceUID = dicomParser.seriesInstanceUID();
    series._numberOfFrames = dicomParser.numberOfFrames();
    series._numberOfChannels = dicomParser.numberOfFrames();

    // just create 1 dummy stack for now
    var stack = new VJS.models.stack();

    series._stack.push(stack);

    // loop through all the frames!
    for(var i = 0; i<series._numberOfFrames; i++){
      // shoud check for target stack
      // should check if frame was already added in stack
      // etc.
      var frame = new VJS.models.frame();
      frame._rows = dicomParser.rows(i);
      frame._columns = dicomParser.columns(i);
      frame._pixelData = dicomParser.extractPixelData(i);
      frame._pixelSpacing = dicomParser.pixelSpacing(i);
      frame._sliceThickness = dicomParser.sliceThickness(i);
      frame._imageOrientation = dicomParser.imageOrientation(i);
      frame._imagePosition = dicomParser.imagePosition(i);
      //frame._dimensionIndexValues = dicomParser.dimensionIndexValues(i);

      stack._frame.push(frame);
    }

    // var image = dicomParser.parse();

    // add image to image helper
    // image helper is a 3D object image wherease image is a general JS Object
    seriesHelper.addSeries(series);
    return seriesHelper;
    //var self = this;

    //return new Promise(function(resolve) {

    // console.time('LoaderDicom');
    // // use response as input to image helper.
    // // can provide an image or not...
    // var imageHelper = new VJS.helpers.image();
    // var dicomParser = new VJS.parsers.dicom(response, imageHelper.id);

    // //var image = dicomParser.parse();
    // var sequence = Promise.resolve();
    // sequence
    //   .then(function() {
    //     return dicomParser.parse();
    //   })
    //   .then(function(image) {
    //     imageHelper.add(image);
    //     console.timeEnd('LoaderDicom');
    //     return (imageHelper);
    //   });

    // return sequence;

    //imageHelper.add(dicomParser.parse());

    //
    //  Create A dicom parser to help us fill the Image Helper!
    //

    // var dicomParser = new VJS.parsers.dicom(name, jQueryDom);

    // var object, objects = [];
    // var geometry, material;

    // for ( var i = 0, l = objects.length; i < l; i ++ ) {

    //   object = objects[ i ];
    //   geometry = object.geometry;

    //   var buffergeometry = new THREE.BufferGeometry();

    //   buffergeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( geometry.vertices ), 3 ) );

    //   if ( geometry.normals.length > 0 ) {
    //     buffergeometry.addAttribute( 'normal', new THREE.BufferAttribute( new Float32Array( geometry.normals ), 3 ) );
    //   }

    //   if ( geometry.uvs.length > 0 ) {
    //     buffergeometry.addAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( geometry.uvs ), 2 ) );
    //   }

    //   material = new THREE.MeshLambertMaterial();
    //   material.name = object.material.name;

    //   var mesh = new THREE.Mesh( buffergeometry, material );
    //   mesh.name = object.name;

    //   container.add( mesh );

    // }

    //resolve(imageHelper);
    //});

};

// export the probePixel widget module
module.exports = VJS.loaders.dicom;
