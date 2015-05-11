'use strict';

var VJS = VJS || {};
VJS.frame = VJS.frame || {};

/**
 * Viewer of frame module.
 * It should be a group instead of a mesh!
 * So we can control border, frame, and whatever would be needed
 */
VJS.frame.view = function(frameModel) {
    this.vjsModel = frameModel;
    this.vjsSpace = 'LPS'; // IJK, LPS, WORLD
    this.material = null;
    this.geometry = null;
};

VJS.frame.view.prototype = Object.create(THREE.Mesh.prototype);
VJS.frame.view.prototype.constructor = VJS.frame.view;

VJS.frame.view.prototype.threejsframe = function() {
    var width = this.vjsModel._columns;
    var height = this.vjsModel._rows;

    // create a frame!
    var geometry = new THREE.PlaneGeometry(width, height);

    var textureFormat = THREE.LuminanceFormat;
    if (this.vjsModel.nbChannels === 3) {
        textureFormat = THREE.RGBFormat;
    }
    var rampTex = new THREE.DataTexture(this.vjsModel.pixelData, width, height, textureFormat);
    rampTex.needsUpdate = true;
    rampTex.magFilter = THREE.NearestFilter;
    rampTex.minFilter = THREE.LinearMipMapLinearFilter;

    var material2 = new THREE.MeshBasicMaterial({
        map: rampTex,
        side: THREE.DoubleSide
    });

    window.console.log(material2);



    // create the geometry


    // attach the texture

    // done! view can directly be added to the threJS scene.
    // it is a "smart" threeJS object.
    THREE.Mesh.call(this, geometry, material2);


    // add border a a child....?
    // var materialBorder = new THREE.LineBasicMaterial({
    //     color: 0x0000ff
    // });
    // var geometryBorder = new THREE.Geometry();
    // geometryBorder.vertices = this.vertices;
    // // for (var i = 0; i < this._sliceCore._intersections.length; i++) {
    // //     geometry.vertices.push(this._sliceCore._intersections[i]);
    // // }
    // // geometry.vertices.push(this._sliceCore._intersections);
    // var line = new THREE.Line(geometryBorder, materialBorder);

    //this.add(line);
};

// visualization tasks for a frame

// create frame  // create geometry + texture
// update frame  // update geometry + texture + window level?
// volume render a slice, etc.

// frame to RAS  // update geometry
// frame to IJK
// frame to etc.

//returns ThreeJS friendly objects
// where where do we interact wioth the content? i.e. window level, LUT

// 2D viewer? ortho camera centered on 0,0,0?
// 2D viewer always 0,0,0

// 2D + Reslice? center/lookat normal.
