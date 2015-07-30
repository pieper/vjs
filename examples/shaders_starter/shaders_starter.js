/* globals Stats*/
'use strict';

var VJS = VJS || {};
VJS.loaders = VJS.loaders || {};
VJS.loaders.dicom = require('../../src/loaders/loaders.dicom');

VJS.controls = VJS.controls || {};
VJS.controls.orbitControls2D = require('../../src/controls/OrbitControls2D');

VJS.shaders = VJS.shaders || {};
VJS.shaders.data = require('../../src/shaders/shaders.data');

var glslify = require('glslify');

// standard global variables
var controls, renderer, stats, scene, camera;

function init() {

  // this function is executed on each animation frame
  function animate() {
    // render
    controls.update();
    renderer.render(scene, camera);
    stats.update();

    // request new frame
    requestAnimationFrame(function() {
      animate();
    });
  }

  // renderer
  var threeD = document.getElementById('r3d');
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
  renderer.setClearColor(0xFFFFFF, 1);
  threeD.appendChild(renderer.domElement);

  // stats
  stats = new Stats();
  threeD.appendChild(stats.domElement);

  // scene
  scene = new THREE.Scene();

  // camera
  camera = new THREE.PerspectiveCamera(45, threeD.offsetWidth / threeD.offsetHeight, 1, 10000000);
  camera.position.x = 150;
  camera.position.y = 150;
  camera.position.z = 100;
  camera.lookAt(scene.position);

  // controls
  controls = new VJS.controls.orbitControls2D(camera, renderer.domElement);

  // start rendering loop
  animate();
}

window.onload = function() {

  // init threeJS
  init();

  // need to finish with tar for karma testings
  // if not, it doesn't load the raw data and encapsulates it
  var file = '../../data/dcm/fruit.dcm.tar';

  // instantiate the loader
  // it loads and parses the dicom image
  var loader = new VJS.loaders.dicom();
  loader.load(
      file,
        // when file loaded and parsed
        function(series) {

          // merge images if needed!
          window.console.log('file parsed');

          // get first stack from series
          var stack = series._stack[0];
          // prepare it
          // * ijk2LPS transforms
          // * Z spacing
          // * etc.
          //
          // IMPORTANT NOTE:
          // This is the most expensive operation right now
          // We get data from each frame and pack it all into a texture
          // The texture is only 8bits so we must pack 16bits data there
          // which is very expensive
          // use webworkers to do that?
          // https://github.com/FNNDSC/vjs/blob/master/src/models/models.stack.js#L240-296
          stack.prepare();

          window.console.log(stack);

          // box geometry
          var boxGeometry = new THREE.BoxGeometry(
            stack._dimensions.x,
            stack._dimensions.y,
            stack._dimensions.z
            );
          // box is centered on 0,0,0
          // we want first voxel of the box to be centered on 0,0,0
          boxGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(
            stack._halfDimensions.x,
            stack._halfDimensions.y,
            stack._halfDimensions.z)
          );
          // go the LPS space
          boxGeometry.applyMatrix(stack._ijk2LPS);

          // box material
          var boxMaterial = new THREE.MeshBasicMaterial({
            wireframe: true,
            color: 0x61F2F3
          });

          // box mesh
          var boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
          scene.add(boxMesh);

          // sphere material
          var textures = [];
          for (var m = 0; m < stack._rawData.length; m++) {
            var tex = new THREE.DataTexture(stack._rawData[m], stack._textureSize, stack._textureSize, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
            tex.needsUpdate = true;
            textures.push(tex);
          }
          
          // update uniforms
          var uniforms = VJS.shaders.data.parameters.uniforms;
          uniforms.uTextureSize.value = stack._textureSize;
          uniforms.uTextureContainer.value = textures;
          uniforms.uDataDimensions.value = new THREE.Vector3(stack._columns, stack._rows, stack._numberOfFrames);
          uniforms.uWorldToData.value = stack._lps2IJK;
          uniforms.uNumberOfChannels.value = stack._numberOfChannels;
          uniforms.uBitsAllocated.value = stack._bitsAllocated;
          uniforms.uWindowLevel.value = stack._windowLevel;
          uniforms.uInvert.value = stack._invert;

          // create material
          var sphereMaterial = new THREE.ShaderMaterial({
            // 'wireframe': true,
            'side': THREE.DoubleSide,
            'transparency': true,
            'uniforms': uniforms,
            'vertexShader': glslify('../../src/shaders/shaders.data.vert'),
            'fragmentShader': glslify('../../src/shaders/shaders.data.frag')
          });

          var centerLPS = new THREE.Vector3(
            stack._halfDimensions.x,
            stack._halfDimensions.y,
            stack._halfDimensions.z
            ).applyMatrix4(stack._ijk2LPS);

          // sphere geometry
          var sphereGeometry = new THREE.SphereGeometry(40, 32, 32);
          sphereGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(
            centerLPS.x,
            centerLPS.y,
            centerLPS.z)
          );

          // sphere mesh
          var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
          scene.add(sphere);
        },
        // progress
        function() {},
        // error
        function() {}
    );
};
