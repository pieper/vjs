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
            }
        },

        fragmentShader: [

            //
            // Get data color given coordinate and texture
            //
            'vec4 getDataValue(vec3 modelCoordinates, vec3 dataDimensions, float textureSize, sampler2D textureContainer[16]) {',

            // Model coordinate to data index
            'float index = modelCoordinates[0] + modelCoordinates[1]*dataDimensions[0] + modelCoordinates[2]*dataDimensions[0]*dataDimensions[1];',

            // Map data index to right sampler2D texture
            'float frameIndex = floor(index / (textureSize*textureSize));',
            'float inFrameIndex = mod(index, textureSize*textureSize);',

            // Get row and column in the texture
            'float rowIndex = floor(inFrameIndex/textureSize);',
            'float colIndex = mod(inFrameIndex, textureSize);',

            // Map row and column to uv
            'vec2 sliceSize = vec2(1.0 / textureSize, 1.0 / textureSize);',
            'float u = colIndex*sliceSize.x + sliceSize.x/2.;',
            'float v = 1.0 - (rowIndex*sliceSize.y + sliceSize.y/2.);',

            'vec2 uv = vec2(u,v);',
            'vec4 dataValue = vec4(0, 0, 0, 0);',
            'if(frameIndex == 0.0){',
            'dataValue = texture2D(textureContainer[0], uv);',
            '}',
            'else if(frameIndex == 1.0){',
            'dataValue = texture2D(textureContainer[1], uv);',
            '}',
            'else if(frameIndex == 2.0){',
            'dataValue = texture2D(textureContainer[2], uv);',
            '}',
            'else if(frameIndex == 3.0){',
            'dataValue = texture2D(textureContainer[3], uv);',
            '}',
            'else if(frameIndex == 4.0){',
            'dataValue = texture2D(textureContainer[4], uv);',
            '}',
            'else if(frameIndex == 5.0){',
            'dataValue = texture2D(textureContainer[5], uv);',
            '}',
            'else if(frameIndex == 6.0){',
            'dataValue = texture2D(textureContainer[6], uv);',
            '}',
            'else if(frameIndex == 7.0){',
            'dataValue = texture2D(textureContainer[7], uv);',
            '}',
            'else if(frameIndex == 8.0){',
            'dataValue = texture2D(textureContainer[8], uv);',
            '}',
            'else if(frameIndex == 9.0){',
            'dataValue = texture2D(textureContainer[9], uv);',
            '}',
            'else if(frameIndex == 10.0){',
            'dataValue = texture2D(textureContainer[10], uv);',
            '}',
            'else if(frameIndex == 11.0){',
            'dataValue = texture2D(textureContainer[11], uv);',
            '}',
            'else if(frameIndex == 12.0){',
            'dataValue = texture2D(textureContainer[12], uv);',
            '}',
            'else if(frameIndex == 13.0){',
            'dataValue = texture2D(textureContainer[13], uv);',
            '}',
            'else if(frameIndex == 14.0){',
            'dataValue = texture2D(textureContainer[14], uv);',
            '}',
            'else if(frameIndex == 15.0){',
            'dataValue = texture2D(textureContainer[15], uv);',
            '}',
            'else {',
            'discard;',
            '}',

            'return dataValue;',
            '}',

            // 'precision mediump float;',
            // 'precision mediump sampler2D;',

            'uniform float uTextureSize;',
            'uniform sampler2D uTextureContainer[16];',
            'uniform vec3 uDataDimensions;',
            'uniform mat4 uWorldToData;',

            'varying vec4 vPos;',

            'void main(void) {',

            // get data coordinates of current pixel
            // 'vec4 vPosNext1 = vPos * 100000000000.0;',
            // 'vPosNext1 += 0.5;',
            // 'vec4 vPosNext = floor(vPosNext1)/100000000000.0;',
            'highp vec4 dataCoordinateRaw = uWorldToData * vPos;',
            // account for machine epsilon
            // 'float epsilon = 0.00001;',
            'dataCoordinateRaw += 0.5;',
            'highp vec3 dataCoordinate = vec3(floor(dataCoordinateRaw.x), floor(dataCoordinateRaw.y), floor(dataCoordinateRaw.z));',

            // if data in range, look for it!
            // should use integers...
            'if(dataCoordinate[0] >= 0.0',
            '&& dataCoordinate[1] >= 0.0',
            '&& dataCoordinate[2] >= 0.0',
            '&& dataCoordinate[0] < uDataDimensions[0]',
            '&& dataCoordinate[1] < uDataDimensions[1]',
            '&& dataCoordinate[2] < uDataDimensions[2]',
            '){',
            'vec3 color = vec3(0, 0, 0);',
            'vec4 dataValue = getDataValue(dataCoordinate, uDataDimensions, uTextureSize, uTextureContainer);',
            'color.rgb = dataValue.rgb;',
            'gl_FragColor = vec4(color, 1.0);',
            //'gl_FragColor = vec4(dataCoordinate[2]/60.0, dataCoordinate[2]/60.0, dataCoordinate[2]/60.0, 1.0);',
            // 'gl_FragColor = vec4(3.0 - dataCoordinate[2], 4.0 - dataCoordinate[2], 5.0 - dataCoordinate[2], 1.0);',
            // 'gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);',
            '}',
            'else{',
            // should be able to choose what we want to do if not in range:
            // discard or specific color
            //'discard;',
            'gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);',

            '}',

            '}'

        ].join('\n'),

        vertexShader: [

            'varying highp vec4 vPos;',

            //
            // main
            //
            'void main() {',

            'vPos = modelMatrix * vec4(position, 1.0 );',

            'gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );',

            '}'

        ].join('\n')

    }

};
