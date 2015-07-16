/* globals Stats, dat*/
'use strict';

var vjsOrbitControl2D = require('../../modules/controls/OrbitControls2D');
var vjsLoaderDicom = require('../../modules/loaders/loaders.dicom');

// standard global variables
var controls, renderer, scene, camera, statsyay;

// FUNCTIONS
function init() {

  // this function is executed on each animation frame
  function animate() {
    // render
    controls.update();
    renderer.render(scene, camera);
    statsyay.update();

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
  statsyay = new Stats();
  threeD.appendChild(statsyay.domElement);

  // scene
  scene = new THREE.Scene();
  // camera
  camera = new THREE.PerspectiveCamera(45, threeD.offsetWidth / threeD.offsetHeight, 1, 10000000);
  camera.position.x = 100;
  camera.position.y = 100;
  camera.position.z = 100;
  camera.lookAt(scene.position);
  // controls
  controls = new vjsOrbitControl2D(camera, renderer.domElement);

  animate();
}

window.onload = function() {

  // init threeJS...
  init();

  var seriesHelper = [];

  function readMultipleFiles(evt) {
    //Retrieve the first (and only!) File from the FileList object
    //window.console.log(evt.target.files.length);

    for (var i = 0; i < evt.target.files.length; i++) {
      var f = evt.target.files[i]; 

      if (f) {
        var r = new FileReader();
        r.onload = function(e) { 
        var arrayBuffer = e.target.result;
        var loader = new vjsLoaderDicom();
        var myHelper = loader.parse(arrayBuffer);
        // myHelper.prepare();
        seriesHelper.push(myHelper);

        if (seriesHelper.length === evt.target.files.length) {
          //     window.console.log(seriesHelper);
          var mergedHelpers = [seriesHelper[0]];
          //     // if all files loaded
          //     window.console.log('merged:', mergedHelpers.length);
          //     window.console.log('series:', seriesHelper.length);
          for (var k = 0; k < seriesHelper.length; k++) {
            // test image against existing imagess
            for (var j = 0; j < mergedHelpers.length; j++) {
              if (mergedHelpers[j].merge(seriesHelper[k])) {
                // merged successfully
                break;
              } else if (j === mergedHelpers.length - 1) {
                // last merge was not successful
                // this is a new image
                mergedHelpers.push(seriesHelper[k]);
              }
            }
          }

          mergedHelpers[0].prepare();
          scene.add(mergedHelpers[0]);
          var stack = mergedHelpers[0]._series._stack[0];

          var gui = new dat.GUI({
            autoPlace: false
          });

          var customContainer = document.getElementById('my-gui-container');
          customContainer.appendChild(gui.domElement);

          var stackFolder = gui.addFolder('Stack');
          var windowWidthUpdate = stackFolder.add(stack, '_windowWidth', 1, stack._minMax[1]).step(1);
          windowWidthUpdate.onChange(function(value) {
            var windowLevel = stack._windowLevel;
            windowLevel[1] = value;
            mergedHelpers[0]._uniforms.uWindowLevel.value = windowLevel;
          });
          var windowCenterUpdate = stackFolder.add(stack, '_windowCenter', stack._minMax[0], stack._minMax[1]).step(1);
          windowCenterUpdate.onChange(function(value) {
            var windowLevel = stack._windowLevel;
            windowLevel[0] = value;
            mergedHelpers[0]._uniforms.uWindowLevel.value = windowLevel;
          });

          var invertUpdate = stackFolder.add(stack, '_invert', 0, 1).step(1);
          invertUpdate.onChange(function(value) {
            mergedHelpers[0]._uniforms.uInvert.value = value;
          });

          var frameIndex = stackFolder.add(mergedHelpers[0], '_frameIndex', 0, stack._dimensions.z - 1).step(1);
          frameIndex.onChange(function(value) {
            mergedHelpers[0].updateSliceGeometry();
            mergedHelpers[0].updateBorderGeometry();
          });

          stackFolder.open();
        }
      };
        r.readAsArrayBuffer(f);
      } else { 
        window.console.log('Failed to load file');
      }
    }
  }
  // hook up file input listener
  document.getElementById('fileinput').addEventListener('change', readMultipleFiles, false);
};
