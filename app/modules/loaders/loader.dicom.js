/*global Module, dcmjs, FS, $*/

'use strict';

var VJS = VJS || {};

/**
 * loader namespace
 * @namespace loader
 * @memberOf VJS
 * @public
 */
VJS.loader = VJS.loader || {};


/**
 *
 * It is typically used to load a DICOM image. Use loading manager for
 * advanced usage, such as multiple files handling.
 *
 * Demo: {@link https://fnndsc.github.io/vjs#loader_dicom}
 *
 * @constructor
 * @class
 * @memberOf VJS.loader
 * @public
 *
 * @param {THREE.DefaultLoadingManager=} manager - Manager for advanced users.
 *
 * @example
 * var files = ['/data/dcm/fruit'];
 *
 * // Instantiate a dicom loader
 * var dicomLoader = new VJS.loader.dicom();
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
VJS.loader.dicom = function(manager) {

    this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
    this.crossOrigin = true;
    this.responseType = 'arraybuffer';

};
VJS.loader.dicom.prototype.constructor = VJS.loader.dicom;

/**
 *
 * Load target file and attach necessary callbacks.
 *
 * @todo Might want to implement onError extra layer like for "onLoad".
 * @public
 *
 * @param {string} url - Url of the file to be pulled.
 * @param {function} onLoad - On load callback, after response has been parsed by VJS.loader.dicom.parse.
 * @param {function} onProgress - On progress callback.
 * @param {function} onError - On error callback.
 *
 */
VJS.loader.dicom.prototype.load = function(url, onLoad, onProgress, onError) {

    var scope = this;

    var loader = new THREE.XHRLoader(scope.manager);
    loader.setCrossOrigin(this.crossOrigin);
    loader.setResponseType(this.responseType);
    loader.load(url, function(response) {

        onLoad(scope.parse(response));

    }, onProgress, onError);

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
VJS.loader.dicom.prototype.parse = function(response) {

    var container = new THREE.Object3D();

    console.time('LoaderDicom');

    window.console.log(response);

    var imageNameFS = 'image_' + container.id;
    window.console.log(imageNameFS);

    //
    // write to virtual FS
    //
    var uploadedObject = new Int8Array(response);
    // should create the FS tree maybe rather than just using filename...
    var options = {
        encoding: 'binary'
    };

    var output = FS.writeFile(imageNameFS, uploadedObject, options);
    window.console.log(output);

    //
    // Save all frames on FS
    //
    var frameImageNameFS = imageNameFS + '-raw.8b';
    dcmjs.utils.execute('dcm2pnm', ['--verbose', '--all-frames', '--write-raw-pnm', imageNameFS, frameImageNameFS]);

    //
    // Dump to XML
    //
    var dumpLines = [];
    Module.print = function(s) {
        dumpLines.push(s);
    };

    var returnCode = dcmjs.utils.execute('dcm2xml', ['--native-format', imageNameFS]);
    Module.print = print;
    window.console.log(returnCode);

    //var xml = VJS.parsers.dicom.printToXML(dumpLines);
    var xml = dumpLines.join('\n');
    window.console.log(xml);

    //
    // jQuery DOM
    //
    var $dicomDom = $.parseXML(xml);
    window.console.log($dicomDom);

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

    console.timeEnd('LoaderDicom');

    return container;

};
