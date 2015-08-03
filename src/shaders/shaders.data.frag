precision highp float;

uniform float uTextureSize;
uniform float uWindowLevel[2];
uniform sampler2D uTextureContainer[7];
uniform vec3 uDataDimensions;
uniform mat4 uWorldToData;
uniform int uNumberOfChannels;
uniform int uBitsAllocated;
uniform int uInvert;

// hack because can not pass arrays if too big
// best would be to pass texture but have to deal with 16bits
uniform int uLut;
uniform float uLutI[16]; // 16 * 4 (intesity - r- g - b)
uniform float uLutR[16];
uniform float uLutG[16];
uniform float uLutB[16];

varying vec4 vPos;

vec4 sampleAs3DTexture(in vec3 textureCoordinate) {

  float slicePixelSize = 1.0 / (uTextureSize - 1.);
  // Model coordinate (IJK) to data index
  float index = textureCoordinate.x * uDataDimensions.x
              + textureCoordinate.y * uDataDimensions.y * uDataDimensions.x
              + textureCoordinate.z * uDataDimensions.z * uDataDimensions.y * uDataDimensions.x;

  // Map data index to right sampler2D texture
  int textureIndex = int(floor(index / (uTextureSize*uTextureSize)));
  float inTextureIndex = mod(index, uTextureSize*uTextureSize);

  // Get row and column in the texture
  float rowIndex = floor(inTextureIndex/uTextureSize);
  float colIndex = mod(inTextureIndex, uTextureSize);

  // Map row and column to uv
  vec2 uv = vec2(0,0);
  uv.x = (0.5 + colIndex) * slicePixelSize;
  uv.y = 1.0 - (0.5 + rowIndex) * slicePixelSize;

  vec4 dataValue = vec4(0, 0, 0, 1);
  if(textureIndex == 0){ dataValue = texture2D(uTextureContainer[0], uv); }
  else if(textureIndex == 1){ dataValue = texture2D(uTextureContainer[1], uv); }
  else if(textureIndex == 2){ dataValue = texture2D(uTextureContainer[2], uv); }
  else if(textureIndex == 3){ dataValue = texture2D(uTextureContainer[3], uv); }
  else if(textureIndex == 4){ dataValue = texture2D(uTextureContainer[4], uv); }
  else if(textureIndex == 5){ dataValue = texture2D(uTextureContainer[5], uv); }
  else if(textureIndex == 6){ dataValue = texture2D(uTextureContainer[6], uv); }

  return dataValue;
}

void main(void) {

  // get texture coordinates of current pixel
  // might not be the right way to do it:
  // precision issues ar voxels limits
  // need to add machine epsilon?
  vec4 dataCoordinateRaw = uWorldToData * vPos;
  //dataCoordinateRaw += 0.5;
  vec3 dataCoordinate = floor(dataCoordinateRaw.xyz);

  // if data in range, look it up in the texture!
  if ( all(greaterThanEqual(dataCoordinate, vec3(0.))) &&
       all(lessThan(dataCoordinate, uDataDimensions))) {

    vec3 textureCoordinate = dataCoordinate/uDataDimensions;
    vec4 dataValue = sampleAs3DTexture(textureCoordinate);

    // Threshold? to copr intensities out?

    if(uNumberOfChannels == 1){
      // reconstruct 16 bit data if any
      float rawValue = dataValue.r * 256.0 * 256.0 + dataValue.g * 255.0;
      float windowMin = uWindowLevel[0] - uWindowLevel[1]/2.0;
      float windowMax = uWindowLevel[0] + uWindowLevel[1]/2.0;
      float combined = ( rawValue - windowMin ) / uWindowLevel[1];

      dataValue.r = dataValue.g = dataValue.b = combined;
    }

    gl_FragColor = dataValue;
  }
  else{
    // should be able to choose what we want to do if not in range:
    // discard or specific color
    //discard;
    gl_FragColor = vec4(0.011, 0.662, 0.956, 1.0);
  }
}
