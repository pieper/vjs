/* globals Stats, dat*/
'use strict';

var VJS = VJS || {};
VJS.loaders = VJS.loaders || {};
VJS.loaders.dicom = require('../../src/loaders/loaders.dicom');

VJS.controls = VJS.controls || {};
VJS.controls.orbitControls2D = require('../../src/controls/OrbitControls2D');

VJS.shaders = VJS.shaders || {};
VJS.shaders.data = require('../../src/shaders/shaders.data');

var glslify = require('glslify');

var VJS = VJS || {};

// standard global variables
var controls, renderer, stats, scene, camera, bbox, bboxMin, bboxMax, spheres, directions, steps, testSpheres;

// FUNCTIONS
function init() {

  testSpheres = {
    'nbSpheres': 20
  };

  // this function is executed on each animation frame
  function animate() {
    // update spheres positions
    if (spheres && spheres.length === testSpheres.nbSpheres) {

      for (var i = 0; i < testSpheres.nbSpheres; i++) {

        if (spheres[i].position.x >= bbox[1].x) {
          directions[i].x = -1;
        } else if (spheres[i].position.x <= bbox[0].x) {
          directions[i].x = 1;
        }

        if (spheres[i].position.y >= bbox[1].y) {
          directions[i].y = -1;
        } else if (spheres[i].position.y <= bbox[0].y) {
          directions[i].y = 1;
        }

        if (spheres[i].position.z >= bbox[1].z) {
          directions[i].z = -1;
        } else if (spheres[i].position.z <= bbox[0].z) {
          directions[i].z = 1;
        }

        spheres[i].position.x += directions[i].x * steps[i].x;
        spheres[i].position.y += directions[i].y * steps[i].y;
        spheres[i].position.z += directions[i].z * steps[i].z;

      }
    }

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

  var maxTextureSize = renderer.context.getParameter(renderer.context.MAX_TEXTURE_SIZE);
  window.console.log(maxTextureSize);

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

  animate();
}

function createSphere(position, material) {
  var direction = new THREE.Vector3(Math.random() < 0.5 ? -1 : 1, Math.random() < 0.5 ? -1 : 1, Math.random() < 0.5 ? -1 : 1);
  var step = new THREE.Vector3(Math.random(), Math.random(), Math.random());
  var radius = Math.floor((Math.random() * 30) + 1);
  var sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
  var sphere = new THREE.Mesh(sphereGeometry, material);
  sphere.position.x = bbox[0].x + (bbox[1].x - bbox[0].x) / 2;
  sphere.position.y = bbox[0].y + (bbox[1].y - bbox[0].y) / 2;
  sphere.position.z = bbox[0].z + (bbox[1].z - bbox[0].z) / 2;

  spheres.push(sphere);
  directions.push(direction);
  steps.push(step);

  scene.add(sphere);
}

window.onload = function() {

  // init threeJS...
  init();

  var file = '../../data/dcm/fruit.dcm.tar';

  // instantiate the loader
  var loader = new VJS.loaders.dicom();
  loader.load(
      file,
      // on load
        function(series) {

          // float textures to shaders
          //http://jsfiddle.net/greggman/upZ7V/
          //http://jsfiddle.net/greggman/LMbhk/

          // merge images if needed!
          window.console.log('all parsed');

          // those operations could be async too!
          // prepare the texture!
          var stack = series._stack[0];
          window.console.log(stack);
          // compute convenience vars (such as ijk2LPS matrix for the stack, re-order frames based on position)
          stack.prepare();

          // make a box!
          var geometry = new THREE.BoxGeometry(896, 896, 60); // box is centered on 0,0,0
          // we want first voxel of the box to be centered on 0,0,0
          geometry.applyMatrix(new THREE.Matrix4().makeTranslation(448, 448, 30));
          // go the LPS space
          geometry.applyMatrix(stack._ijk2LPS);
          var material = new THREE.MeshBasicMaterial({
            wireframe: true,
            color: 0x61F2F3
          });
          var cube = new THREE.Mesh(geometry, material);
          scene.add(cube);

          // pass formated raw data from stack to webGL texture
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
          var sliceMaterial = new THREE.ShaderMaterial({
            // 'wireframe': true,
            'side': THREE.DoubleSide,
            'transparency': true,
            'uniforms': uniforms,
            'vertexShader': glslify('../../src/shaders/shaders.data.vert'),
            'fragmentShader': glslify('../../src/shaders/shaders.data.frag')
          });

          // create all the spheres with a "slice material" material
          // get LPS BBox to know where to position the sphere
          bboxMax = new THREE.Vector3(896, 896, 60).applyMatrix4(stack._ijk2LPS);
          bboxMin = new THREE.Vector3(0, 0, 0).applyMatrix4(stack._ijk2LPS);
          bbox = [
              new THREE.Vector3(Math.min(bboxMin.x, bboxMax.x), Math.min(bboxMin.y, bboxMax.y), Math.min(bboxMin.z, bboxMax.z)),
              new THREE.Vector3(Math.max(bboxMin.x, bboxMax.x), Math.max(bboxMin.y, bboxMax.y), Math.max(bboxMin.z, bboxMax.z))
          ];
          var bboxCenter = new THREE.Vector3(
              bbox[0].x + (bbox[1].x - bbox[0].x) / 2,
              bbox[0].y + (bbox[1].y - bbox[0].y) / 2,
              bbox[0].z + (bbox[1].z - bbox[0].z) / 2);

          spheres = [];
          directions = [];
          steps = [];
          for (var i = 0; i < testSpheres.nbSpheres; i++) {
            createSphere(bboxCenter, sliceMaterial);
          }

          var gui = new dat.GUI({
            autoPlace: false
          });

          var customContainer = document.getElementById('my-gui-container');
          customContainer.appendChild(gui.domElement);

          var ballsFolder = gui.addFolder('Spheres');
          var numberOfSpheresUpdate = ballsFolder.add(testSpheres, 'nbSpheres', 1, 100).step(1);
          ballsFolder.open();

          numberOfSpheresUpdate.onChange(function(value) {
            var diff = value - spheres.length;
            if (diff > 0) {
              for (var j = 0; j < diff; j++) {
                createSphere(bboxCenter, sliceMaterial);
              }

            } else if (diff < 0) {
              diff = Math.abs(diff);

              for (var k = 0; k < diff; k++) {
                scene.remove(spheres[0]);
                spheres.shift();
                directions.shift();
                steps.shift();
              }
            }
          });
        },
        // progress
        function() {},
        // error
        function() {}
    );
};
