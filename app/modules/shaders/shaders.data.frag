vec4 sampleAs3DTexture(sampler2D textureContainer[16], vec3 textureCoordinate, vec3 dataSize, float textureSize) {

  float slicePixelSize = 1.0 / textureSize;
  // Model coordinate (IJK) to data index
  float index = textureCoordinate.x * dataSize.x + textureCoordinate.y * dataSize.y * dataSize.x + textureCoordinate.z * dataSize.z * dataSize.y * dataSize.x;

  // Map data index to right sampler2D texture
  float textureIndex = floor(index / (textureSize*textureSize));
  float inTextureIndex = mod(index, textureSize*textureSize);

  // Get row and column in the texture
  float rowIndex = floor(inTextureIndex/textureSize);
  float colIndex = mod(inTextureIndex, textureSize);

  // Map row and column to uv
  vec2 uv = vec2(0,0);
  uv.x = slicePixelSize * 0.5 + colIndex * slicePixelSize;
  uv.y = 1.0 - (slicePixelSize * 0.5 + rowIndex * slicePixelSize);

  vec4 dataValue = vec4(0, 0, 0, 1);
  if(textureIndex == 0.0){
    dataValue = texture2D(textureContainer[0], uv);
  }
  else if(textureIndex == 1.0){
    dataValue = texture2D(textureContainer[1], uv);
  }
  else if(textureIndex == 2.0){
    dataValue = texture2D(textureContainer[2], uv);
  }
  else if(textureIndex == 3.0){
    dataValue = texture2D(textureContainer[3], uv);
  }
  else if(textureIndex == 4.0){
    dataValue = texture2D(textureContainer[4], uv);
  }
  else if(textureIndex == 5.0){
    dataValue = texture2D(textureContainer[5], uv);
  }
  else if(textureIndex == 6.0){
    dataValue = texture2D(textureContainer[6], uv);
  }
  else if(textureIndex == 7.0){
    dataValue = texture2D(textureContainer[7], uv);
  }
  else if(textureIndex == 8.0){
    dataValue = texture2D(textureContainer[8], uv);
  }
  else if(textureIndex == 9.0){
    dataValue = texture2D(textureContainer[9], uv);
  }
  else if(textureIndex == 10.0){
    dataValue = texture2D(textureContainer[10], uv);
  }
  else if(textureIndex == 11.0){
    dataValue = texture2D(textureContainer[11], uv);
  }
  else if(textureIndex == 12.0){
    dataValue = texture2D(textureContainer[12], uv);
  }
  else if(textureIndex == 13.0){
    dataValue = texture2D(textureContainer[13], uv);
  }
  else if(textureIndex == 14.0){
    dataValue = texture2D(textureContainer[14], uv);
  }
  else if(textureIndex == 15.0){
    dataValue = texture2D(textureContainer[15], uv);
  }
  else {
    discard;
  }

  return dataValue;
}

uniform lowp float uTextureSize;
uniform lowp float uWindowLevel[2];
uniform sampler2D uTextureContainer[16];
uniform vec3 uDataDimensions;
uniform mat4 uWorldToData;
uniform int uNumberOfChannels;
uniform int uBitsAllocated;
uniform int uInvert;

// hack because can not pass arrays if too big
// best would be to pass texture but have to deal with 16bits
uniform int uLut;
uniform lowp float uLutI[16]; // 16 * 4 (intesity - r- g - b)
uniform lowp float uLutR[16];
uniform lowp float uLutG[16];
uniform lowp float uLutB[16];

varying vec4 vPos;

void main(void) {

  // get texture coordinates of current pixel
  // might not be the right way to do it:
  // precision issues ar voxels limits
  // need to add machine epsilon?
  vec4 dataCoordinateRaw = uWorldToData * vPos;
  dataCoordinateRaw += 0.5;
  vec3 dataCoordinate = vec3(floor(dataCoordinateRaw.x), floor(dataCoordinateRaw.y), floor(dataCoordinateRaw.z));


  // if data in range, look it up in the texture!
  if(dataCoordinate.x >= 0.0
  && dataCoordinate.y >= 0.0
  && dataCoordinate.z >= 0.0
  && dataCoordinate.x < uDataDimensions.x
  && dataCoordinate.y < uDataDimensions.y
  && dataCoordinate.z < uDataDimensions.z
  ){
    vec3 textureCoordinate = dataCoordinate/uDataDimensions;
    vec4 dataValue = sampleAs3DTexture(uTextureContainer, textureCoordinate, uDataDimensions, uTextureSize);
    

    // Threshold? to copr intensities out?

    if(uNumberOfChannels == 1){
      // reconstruct 16bits data if any
      float rawValue = dataValue.r * 255.0 * 256.0 + dataValue.g * 255.0;
      float windowMin = uWindowLevel[0] - uWindowLevel[1]/2.0;
      float windowMax = uWindowLevel[0] + uWindowLevel[1]/2.0;
      float combined = ( rawValue - windowMin ) / uWindowLevel[1];

      dataValue.r = dataValue.g = dataValue.b = combined;
    }

    // Apply LUT table...
    // will pass it through a texture...

    if(uLut == 1){
    float lut[12];
    // float[12](0.0, 1.0, 0.0, 0.0, 0.5, 1.0. 1.0. 0.0, 1.0, 1.0, 1.0, 1.0);
    lut[0] = 0.0;
    lut[1] = 1.0;
    lut[2] = 0.0;
    lut[3] = 0.0;

    lut[4] = 0.5;
    lut[5] = 1.0;
    lut[6] = 1.0;
    lut[7] = 0.0;

    lut[8] = 1.0;
    lut[9] = 1.0;
    lut[10] = 1.0;
    lut[11] = 1.0;
    // if uApplyLUT
    // if LUT Gradation? Interpolation
    // get LUT from texture
    for(int i=0; i<16; i++){
      if(dataValue.r < uLutI[i]){
        // i and i-1
        float dataValuePosition = dataValue.r - uLutI[i-1];
        float lutRange = uLutI[i] - uLutI[i-1];
        float lutWeight = dataValuePosition/lutRange;
        // use gradation or not??
        // color distance
        float colorDistanceR = uLutR[i] - uLutR[i-1];
        float colorDistanceG = uLutG[i] - uLutG[i-1];
        float colorDistanceB = uLutB[i] - uLutB[i-1];

        // by weight
        float colorIncrementR = lutWeight * colorDistanceR;
        float colorIncrementG = lutWeight * colorDistanceG;
        float colorIncrementB = lutWeight * colorDistanceB;

        // add it
        dataValue.r = uLutR[i-1] + colorIncrementR;
        dataValue.g = uLutG[i-1] + colorIncrementG;
        dataValue.b = uLutB[i-1] + colorIncrementB;
        // dataValue.r += colorIncrementR;
        // dataValue.g += colorIncrementG;
        // dataValue.b += colorIncrementB;
       break;
     }
    }
    }

    // Apply label map...?
    // target specific intensity

    if(uInvert == 1){
      dataValue = vec4(1, 1, 1, 1) - dataValue;
      dataValue.a = 1.0;
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