'use strict';

var VJS = VJS || {};
VJS.shaders = VJS.shaders || {};

/**
 *
 * Custom shader for the slice object. Should be a shader directory. We can add this shader to any object...
 * @member
 *
 */

VJS.shaders.data = {

    /* -------------------------------------------------------------------------
    //  Slice shader
    // features:
    //
     ------------------------------------------------------------------------- */

    'parameters': {

        uniforms: {
            'uTextureSize': {
                type: 'f',
                value: 0.0
            },
            'uTextureContainer': {
                type: 'tv',
                value: null
            },
            'uDataDimensions': {
                type: 'v3',
                value: new THREE.Vector3()
            },
            'uWorldToData': {
                type: 'm4',
                value: new THREE.Matrix4()
            },
            'uWindowLevel': {
                type: 'fv1',
                value: [0.0,0.0]
            },
            'uNumberOfChannels': {
                type: 'i',
                value: 1
            },
            'uBitsAllocated': {
                type: 'i',
                value: 8
            },
            'uInvert': {
                type: 'i',
                value: 0
            }
        }

    }

};

module.exports = VJS.shaders.data;
