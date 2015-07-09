/* globals Stats, dat*/
'use strict';

var vjsOrbitControl2D = require('../../modules/controls/OrbitControls2D');
var vjsLoaderDicom = require('../../modules/loaders/loaders.dicom');
var vjsShadersData = require('../../modules/shaders/shaders.data');
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
  controls = new vjsOrbitControl2D(camera, renderer.domElement);

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

  var file = ['../../data/dcm/fruit.dcm'];

  // instantiate the loader
  var loader = new vjsLoaderDicom();
  loader.load(
      file,
      // on load
        function(message) {

          // float textures to shaders
          //http://jsfiddle.net/greggman/upZ7V/
          //http://jsfiddle.net/greggman/LMbhk/

          // merge images if needed!
          // prepare images (generate convenience vars at all image/stack/frame levels)
          // view the stack (N slices to start...)
          window.console.log('all parsed');

          // those operations could be async too!
          // prepare the texture!
          var stack = message._image._stack[0];
          window.console.log(stack);
          stack.prepare();

          // make a box!
          var geometry = new THREE.BoxGeometry(896, 896, 60);
          geometry.applyMatrix(new THREE.Matrix4().makeTranslation(448, 448, 30));
          geometry.applyMatrix(stack._ijk2LPS);
          var material = new THREE.MeshBasicMaterial({
            wireframe: true,
            color: 0x61F2F3
          });
          var cube = new THREE.Mesh(geometry, material);
          scene.add(cube);

          // create 16 luminance textures!
          var textures = [];
          for (var m = 0; m < stack._nbTextures; m++) {
            var tex = new THREE.DataTexture(stack._rawData[m], stack._textureSize, stack._textureSize, THREE.LuminanceFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
            tex.needsUpdate = true;
            textures.push(tex);
          }

          var uniforms = vjsShadersData.parameters.uniforms;
          uniforms.uTextureSize.value = stack._textureSize; //this._sliceCore._volumeCore._textureSize;
          // array of 16 textures
          uniforms.uTextureContainer.value = textures;
          // texture dimensions
          uniforms.uDataDimensions.value = new THREE.Vector3(stack._columns, stack._rows, stack._nbFrames); //[stack._columns, stack._rows, stack._nbFrames];
          // world to model
          uniforms.uWorldToData.value = stack._lps2IJK; //new THREE.Matrix4().makeTranslation(448, 448, 30); //new THREE.Matrix4(); //stack._lps2IJK;

          var sliceMaterial = new THREE.ShaderMaterial({
            // 'wireframe': true,
            'side': THREE.DoubleSide,
            'transparency': true,
            'uniforms': uniforms,
            'vertexShader': vjsShadersData.parameters.vertexShader,
            'fragmentShader': vjsShadersData.parameters.fragmentShader,
          });

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
