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

            // https://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences
            'vec4 sampleAs3DTexture(sampler2D textureContainer[16], vec3 textureCoordinate, vec3 dataSize, float textureSize) {',

            'float slicePixelSize = 1.0 / textureSize;',

            // Model coordinate (IJK) to data index
            'float index = textureCoordinate.x * dataSize.x + textureCoordinate.y * dataSize.y * dataSize.x + textureCoordinate.z * dataSize.z * dataSize.y * dataSize.x;',

            // Map data index to right sampler2D texture
            'float textureIndex = floor(index / (textureSize*textureSize));',
            'float inTextureIndex = mod(index, textureSize*textureSize);',

            // Get row and column in the texture
            'float rowIndex = floor(inTextureIndex/textureSize);',
            'float colIndex = mod(inTextureIndex, textureSize);',

            // Map row and column to uv
            'vec2 uv = vec2(0,0);',
            'uv.x = slicePixelSize * 0.5 + colIndex * slicePixelSize;',
            'uv.y = 1.0 - (slicePixelSize * 0.5 + rowIndex * slicePixelSize);',

            'vec4 dataValue = vec4(0, 0, 0, 0);',
            'if(textureIndex == 0.0){',
            'dataValue = texture2D(textureContainer[0], uv);',
            '}',
            'else if(textureIndex == 1.0){',
            'dataValue = texture2D(textureContainer[1], uv);',
            '}',
            'else if(textureIndex == 2.0){',
            'dataValue = texture2D(textureContainer[2], uv);',
            '}',
            'else if(textureIndex == 3.0){',
            'dataValue = texture2D(textureContainer[3], uv);',
            '}',
            'else if(textureIndex == 4.0){',
            'dataValue = texture2D(textureContainer[4], uv);',
            '}',
            'else if(textureIndex == 5.0){',
            'dataValue = texture2D(textureContainer[5], uv);',
            '}',
            'else if(textureIndex == 6.0){',
            'dataValue = texture2D(textureContainer[6], uv);',
            '}',
            'else if(textureIndex == 7.0){',
            'dataValue = texture2D(textureContainer[7], uv);',
            '}',
            'else if(textureIndex == 8.0){',
            'dataValue = texture2D(textureContainer[8], uv);',
            '}',
            'else if(textureIndex == 9.0){',
            'dataValue = texture2D(textureContainer[9], uv);',
            '}',
            'else if(textureIndex == 10.0){',
            'dataValue = texture2D(textureContainer[10], uv);',
            '}',
            'else if(textureIndex == 11.0){',
            'dataValue = texture2D(textureContainer[11], uv);',
            '}',
            'else if(textureIndex == 12.0){',
            'dataValue = texture2D(textureContainer[12], uv);',
            '}',
            'else if(textureIndex == 13.0){',
            'dataValue = texture2D(textureContainer[13], uv);',
            '}',
            'else if(textureIndex == 14.0){',
            'dataValue = texture2D(textureContainer[14], uv);',
            '}',
            'else if(textureIndex == 15.0){',
            'dataValue = texture2D(textureContainer[15], uv);',
            '}',
            'else {',
            'discard;',
            '}',

            'return dataValue;',
            '}',

            'uniform float uTextureSize;',
            'uniform sampler2D uTextureContainer[16];',
            'uniform vec3 uDataDimensions;',
            'uniform mat4 uWorldToData;',

            'varying vec4 vPos;',

            'void main(void) {',

            // get texture coordinates of current pixel
            // might not be the right way to do it:
            // precision issues ar voxels limits
            // need to add machine epsilon?
            'vec4 dataCoordinateRaw = uWorldToData * vPos;',
            'dataCoordinateRaw += 0.5;',
            'vec3 dataCoordinate = vec3(floor(dataCoordinateRaw.x), floor(dataCoordinateRaw.y), floor(dataCoordinateRaw.z));',
            'vec3 textureCoordinate = dataCoordinate/uDataDimensions;',

            // if data in range, look it up in the texture!
            'if(textureCoordinate.x >= 0.0',
            '&& textureCoordinate.y >= 0.0',
            '&& textureCoordinate.z >= 0.0',
            '&& textureCoordinate.x <= 1.0',
            '&& textureCoordinate.y <= 1.0',
            '&& textureCoordinate.z <= 1.0',
            '){',
            'vec3 color = vec3(0, 0, 0);',
            'vec4 dataValue = sampleAs3DTexture(uTextureContainer, textureCoordinate, uDataDimensions, uTextureSize);',
            'color.rgb = dataValue.rgb;',
            'vec4 data = vec4(color, 1.0);',
            // 'vec4 test = vec4(.5, .5, dataCoordinate[2]/60.0, 1.0);',
            'gl_FragColor = data;',
            // 'gl_FragColor = mix(data, test, 0.5);',
            //'gl_FragColor = vec4(3.0 - dataCoordinate[2], 4.0 - dataCoordinate[2], 5.0 - dataCoordinate[2], 1.0);',
            //'gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);',
            '}',
            'else{',
            // should be able to choose what we want to do if not in range:
            // discard or specific color
            //'discard;',
            'gl_FragColor = vec4(0.011, 0.662, 0.956, 1.0);',

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

module.exports = VJS.shaders.data;
