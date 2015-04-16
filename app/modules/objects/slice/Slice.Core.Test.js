/*global describe, it, expect, beforeEach*/

'use strict';

// Test the core functionnalities
describe('Slice.Core', function() {

    //var slice;
    //var volumeCore;
    //var xSlice;

    beforeEach(function(done) {
        // add sliceX to dom as XTK needs it...
        var div = document.createElement('div');
        div.id = 'sliceX';
        document.body.appendChild(div);

        // done to load the data...
        var slice = new X.renderer2D();
        slice.container = 'sliceX';
        slice.orientation = 'X';
        slice.init();

        var xVolume = new X.volume();
        xVolume.file = 'https://googledrive.com/host/0B8u7h0aKnydhfnRHc0V2OGFmRVhILXp6N3lVSFd4OUUzUThrTERlM2NJeTNPRmFEY0xTcnM/l17.min.nii.gz';
        xVolume.reslicing = true;
        slice.add(xVolume);

        slice.render();
        slice.onShowtime = function() {
            // var rasijk = VJS.Adaptor.Xtk2ThreejsMat4(xVolume.Qh);
            // var ijkras = new THREE.Matrix4().getInverse(rasijk);
            // var ijkdimensions = VJS.Adaptor.Xtk2ThreejsVec3(xVolume.ca);
            // var rasdimensions = VJS.Adaptor.Xtk2ThreejsVec3(xVolume.gb);
            // var rascenter = VJS.Adaptor.Xtk2ThreejsVec3(xVolume.s);
            // var rasorigin = VJS.Adaptor.Xtk2ThreejsVec3(xVolume.Ea);
            // var ras = {
            //     'origin': rasorigin,
            //     'center': rascenter,
            //     'dimensions': rasdimensions,
            //     'spacing': null,
            //     'boundingbox': [
            //         new THREE.Vector3(rascenter.x - rasdimensions.x / 2, rascenter.y - rasdimensions.y / 2, rascenter.z - rasdimensions.z / 2),
            //         new THREE.Vector3(rascenter.x + rasdimensions.x / 2, rascenter.y + rasdimensions.y / 2, rascenter.z + rasdimensions.z / 2)
            //     ]
            // };

            // // need ijk object as well
            // var ijk = {
            //     'origin': null,
            //     'center': null,
            //     'dimensions': ijkdimensions,
            //     'spacing': null
            // };

            // var transforms = {
            //     'ijk2ras': ijkras,
            //     'ras2ijk': rasijk
            // };
            // volumeCore = new VJS.Volume.Core(xVolume.J, xVolume.max, xVolume.min, transforms, ijk, ras);

            // var normalorigin = VJS.Adaptor.Xtk2ThreejsVec3(slice.z);
            // var normaldirection = VJS.Adaptor.Xtk2ThreejsVec3(slice.ec);

            // volumeCore = new VJS.Slice.Core(normalorigin, normaldirection, volumeCore);

            // xSlice = xVolume.children[0].c[xVolume.indexX];

            done();
        };


    });

    it('instantiate class', function() {
        //var instantiateClass = function() {
        //var normalorigin = VJS.Adaptor.Xtk2ThreejsVec3(xSlice.z);
        //var normaldirection = VJS.Adaptor.Xtk2ThreejsVec3(xSlice.ec);

        // Create VJS Slice Core and View
        //slice = new VJS.Slice.Core(normalorigin, normaldirection, volumeCore);
        //};
        expect(2 + 1).toEqual(2);
    });
});
