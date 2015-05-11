'use strict';

var VJS = VJS || {};
VJS.stack = VJS.stack || {};

/**
 * Viewer of stack module.
 */
VJS.stack.view = function(stackModel) {
    this.vjsModel = stackModel;
    this.vjsSpace = 'LPS'; // IJK, LPS, WORLD
    this.material = null;
    this.geometry = null;
    //this.type = '';

    this.frameIndex = 0;
};

VJS.stack.view.prototype = Object.create(THREE.Mesh.prototype);
VJS.stack.view.prototype.constructor = VJS.stack.view;

VJS.stack.view.prototype.threejsframe = function(frameindex) {

    // DEAL WITH RGB TOO!!!!

    // should probably leverage frame view :)

    // display middle frame of first object...!
    var frame = this.vjsModel.frame[frameindex];
    var width = frame.columns;
    var height = frame.rows;

    var geometry = new THREE.PlaneGeometry(width, height);
    var textureFormat = THREE.LuminanceFormat;
    if (frame.nbChannels === 3) {
        textureFormat = THREE.RGBFormat;
    }
    var rampTex = new THREE.DataTexture(this.vjsModel.pixelData, width, height, textureFormat);
    rampTex.needsUpdate = true;
    rampTex.magFilter = THREE.NearestFilter;
    rampTex.minFilter = THREE.LinearMipMapLinearFilter;

    var material = new THREE.MeshBasicMaterial({
        map: rampTex,
        side: THREE.DoubleSide
    });


    // create the geometry

    // attach the texture

    window.console.log(this);

    // done! view can directly be added to the threJS scene.
    // it is a "smart" threeJS object.
    THREE.Mesh.call(this, geometry, material);

    window.console.log(this);
};

VJS.stack.view.prototype.frame = function(frameindex) {

    // update the current frame

    // geometry

    // material!
    var frame = this.vjsModel.frame[frameindex];
    var width = frame.columns;
    var height = frame.rows;

    var rampTex = new THREE.DataTexture(frame.pixelData, width, height, THREE.LuminanceFormat);
    rampTex.needsUpdate = true;
    rampTex.magFilter = THREE.NearestFilter;
    rampTex.minFilter = THREE.LinearMipMapLinearFilter;

    this.material.map = rampTex;
};


VJS.stack.view.prototype.threejsslice = function(origin, normal) {
    // normal and origins in which space?
    // Need IJK to LPS transform...?
    window.console.log(normal, origin);

    // BENEFITS TO GENERATE THE GEOMETRY BEFORE
    // -MUCH CLEANER
    // - LESS PIXEL TO BE PROCESSED IN SHADERS
    // - REMOVE IF LOOPS IN SHADERS
    // MOREOVER NOT MUCH MORE EXPESIVE THAN PLANE BBOX

    // Should directly get the intersection between OBB and plane
    // need volume 3 directions
    // need volume center RAS
    // need half lenght in each direction


    //
    //
    // !IMPORTANT!
    // transform to OBB space depends on in which space we provide normal and origin!
    // !IMPORTANT!
    //
    //

    var obb = {
        'halfDimensions': this.vjsModel._halfDimensions,
        'orientation': this.vjsModel._orientation,
        'center': this.vjsModel._halfDimensions,
        'toOBBSpace': new THREE.Matrix4(),//this.vjsModel._lps2IJK,
        'toOBBSpaceInvert': new THREE.Matrix4() //this.vjsModel._ijk2LPS,
    };

    var plane = {
        'origin': origin,
        'normal': normal
    };

    // BOOM!
    var intersections = VJS.Intersections.obbPlane(obb, plane);

    // if less than 3, we have a problem: not a surface!
    if (intersections.length < 3) {
        window.console.log('WARNING: Less than 3 intersections between OBB and Plane.');
        window.console.log('OBB');
        window.console.log(obb);
        window.console.log('Plane');
        window.console.log(plane);
        window.console.log('exiting...');
    }

    window.console.log(intersections);

    // center of mass
    var centerOfMass = new THREE.Vector3(0, 0, 0);
    for (var i = 0; i < intersections.length; i++) {
        centerOfMass.x += intersections[i].x;
        centerOfMass.y += intersections[i].y;
        centerOfMass.z += intersections[i].z;
    }
    centerOfMass.divideScalar(intersections.length);

    window.console.log('center of mass: ', centerOfMass);

    // order the intersections
    // reference line
    var a0 = intersections[0].x;
    var b0 = intersections[0].y;
    var c0 = intersections[0].z;
    var x0 = intersections[0].x - centerOfMass.x;
    var y0 = intersections[0].y - centerOfMass.y;
    var z0 = intersections[0].z - centerOfMass.z;
    var l0 = {
        origin: new THREE.Vector3(a0, b0, c0),
        direction: new THREE.Vector3(x0, y0, z0).normalize()
    };

    var base = new THREE.Vector3(0, 0, 0).crossVectors(l0.direction, normal).normalize();

    var orderedIntersections = [];

    // other lines // if inter, return location + angle
    for (var j = 0; j < intersections.length; j++) {

        var a1 = intersections[j].x;
        var b1 = intersections[j].y;
        var c1 = intersections[j].z;
        var x1 = intersections[j].x - centerOfMass.x;
        var y1 = intersections[j].y - centerOfMass.y;
        var z1 = intersections[j].z - centerOfMass.z;

        var l1 = {
            origin: new THREE.Vector3(a1, b1, c1),
            direction: new THREE.Vector3(x1, y1, z1).normalize()
        };

        var x = l0.direction.dot(l1.direction);
        var y = base.dot(l1.direction);

        var thetaAngle = Math.atan2(y, x);
        var theta = thetaAngle * (180 / Math.PI);
        orderedIntersections.push({
            'angle': theta,
            'point': l1.origin,
            'xy': {
                'x': x,
                'y': y
            }
        });
    }

    window.console.log('orderedIntersections: ', orderedIntersections);

    orderedIntersections.sort(function(a, b) {
        return a.angle - b.angle;
    });

    // format vars
    intersections = [];
    var intersectionsXY = [];
    var intersectionsAngle = [];
    for (var k = 0; k < orderedIntersections.length; k++) {
        intersections.push(orderedIntersections[k].point);
        intersectionsXY.push(orderedIntersections[k].xy);
        intersectionsAngle.push(orderedIntersections[k].angle);
    }

    //
    // CREATE GEOMETRY!
    //

    var sliceShape = new THREE.Shape();
    // move to first point!
    sliceShape.moveTo(intersectionsXY[0].x, intersectionsXY[0].y);


    // loop through all points!
    for (var l = 1; l < intersectionsXY.length; l++) {
        // project each on plane!
        sliceShape.lineTo(intersectionsXY[l].x, intersectionsXY[l].y);
    }

    // close the shape!
    sliceShape.lineTo(intersectionsXY[0].x, intersectionsXY[0].y);

    // Generate Geometry. (all we care about is triangulation!)
    var geometry = new THREE.ShapeGeometry(sliceShape);

    // update real position of each vertex!
    geometry.vertices = intersections;
    geometry.verticesNeedUpdate = true;

    //
    // CREATE MATERIAL
    //

    // var frame = this.vjsModel.frame[30];
    // var width = frame.columns;
    // var height = frame.rows;

    // var textureFormat = THREE.LuminanceFormat;
    // if (frame.nbChannels === 3) {
    //     textureFormat = THREE.RGBFormat;
    // }
    // var rampTex = new THREE.DataTexture(this.vjsModel.pixelData, width, height, textureFormat);
    // rampTex.needsUpdate = true;
    // rampTex.magFilter = THREE.NearestFilter;
    // rampTex.minFilter = THREE.LinearMipMapLinearFilter;

    // var material = new THREE.MeshBasicMaterial({
    //     map: rampTex,
    //     side: THREE.DoubleSide
    // });

    var material = new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0x61F2F3
    });

    // CREATE HIGH_RES SHADER
    window.console.log(VJS);
    var sliceShader = VJS.shaders.slice;
    var uniforms = sliceShader.parameters.uniforms;
    uniforms.uTextureSize.value = this.vjsModel._textureSize; //this._sliceCore._volumeCore._textureSize;

    // create 16 luminance textures!
    var textures = [];
    for (var k = 0; k < this.vjsModel._nbTextures; k++) {
        var tex = new THREE.DataTexture(this.vjsModel._rawData[k], this.vjsModel._textureSize, this.vjsModel._textureSize, THREE.LuminanceFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
        tex.needsUpdate = true;
        textures.push(tex);
    }



    // array of 16 textures
    uniforms.uTextureFrames.value = textures;
    uniforms.uIJKDims.value = new THREE.Vector3(this.vjsModel._columns, this.vjsModel._rows, this.vjsModel._nbFrames);//[this.vjsModel._columns, this.vjsModel._rows, this.vjsModel._nbFrames];
    uniforms.uLPSToIJK.value = this.vjsModel._lps2IJK;

    window.console.log(uniforms);

    var mat = new THREE.ShaderMaterial({
        // 'wireframe': true,
        'side': THREE.DoubleSide,
        'transparency': true,
        'uniforms': uniforms,
        'vertexShader': sliceShader.parameters.vertexShader,
        'fragmentShader': sliceShader.parameters.fragmentShader,
    });

    THREE.Mesh.call(this, geometry, mat);

};

// create stack  // create geometry + texture
// update stack  // update geometry + texture + window level?
// stack to RAS  // update geometry
// stack to IJK
// stack to etc.

// slice from stack
// reslice from stack
// VR from stack
