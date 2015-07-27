/* globals Stats, dat*/
'use strict';

var VJS = VJS || {};
VJS.loaders = VJS.loaders || {};
VJS.loaders.dicom = require('../../src/loaders/loaders.dicom');

VJS.cameras = VJS.cameras || {};
VJS.cameras.camera2d = require('../../src/cameras/cameras.camera2d');

VJS.core = VJS.core || {};
VJS.core.intersections = require('../../src/core/core.intersections');

var vjsOrbitControl2D = require('../../src/controls/OrbitControls2D');

// standard global variables
var controls, renderer, scene, camera, statsyay, threeD;

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
  threeD = document.getElementById('r3d');
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
  renderer.setClearColor(0xFFFFFF, 1);

  //var maxTextureSize = renderer.context.getParameter(renderer.context.MAX_TEXTURE_SIZE);
  //var maxTextureImageUnits = renderer.context.getParameter(renderer.context.MAX_TEXTURE_IMAGE_UNITS);

  threeD.appendChild(renderer.domElement);

  // stats
  statsyay = new Stats();
  threeD.appendChild(statsyay.domElement);

  // scene
  scene = new THREE.Scene();
  // camera
  // var positionT = new THREE.Vector3(400, 0, 0);
    // camera = new THREE.PerspectiveCamera(45, threeD.offsetWidth / threeD.offsetHeight, 1, 10000000);
  camera = new THREE.OrthographicCamera(threeD.offsetWidth / -2, threeD.offsetWidth / 2, threeD.offsetHeight / 2, threeD.offsetHeight / -2, -1000, 1000);
  // var vjsCamera = new VJS.cameras.camera2d(threeD.offsetWidth / -2, threeD.offsetWidth / 2, threeD.offsetHeight / 2, threeD.offsetHeight / -2, -1000, 1000, positionT);
  // camera = vjsCamera.GetCamera();

  // controls
  controls = new vjsOrbitControl2D(camera, renderer.domElement);
  // controls.noRotate = true;

  animate();
}

window.onload = function() {

  // init threeJS...
  init();

  var seriesHelper = [];

  function readMultipleFiles(evt) {
    // hide the upload button
    document.getElementById('fileinput').style.display = 'none';

    for (var i = 0; i < evt.target.files.length; i++) {
      var f = evt.target.files[i]; 

      if (f) {
        var r = new FileReader();
        r.onload = function(e) { 
        var arrayBuffer = e.target.result;
        var loader = new VJS.loaders.dicom();
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

          window.console.log(mergedHelpers[0]);

          var stack = mergedHelpers[0]._series._stack[0];

          // update camera accordingly

          // up in image space
          var upStart = new THREE.Vector3(0, 0, 0);
          var upEnd = new THREE.Vector3(0, 0, 1);
          // to LPS space
          upStart.applyMatrix4(stack._ijk2LPS);
          upEnd.applyMatrix4(stack._ijk2LPS);
          window.console.log('My normal');
          window.console.log(upEnd.x - upStart.x, upEnd.y - upStart.y, upEnd.z - upStart.z);

          // update camera's up
          var up = new THREE.Vector3(stack._direction.elements[4], stack._direction.elements[5], stack._direction.elements[6]);
          //camera.up.set(up.x, up.y, up.z);
          // camera.up.set(0, 1, 0);

          window.console.log('UP:', camera.up);

          // position center first plane
          // var centerFirstPlane = new THREE.Vector3(stack._halfDimensions.x , stack._halfDimensions.y, 0);
          // // to LPS space
          // centerFirstPlane.applyMatrix4(stack._ijk2LPS);
          // // position center last plane
          // var centerLastPlane = new THREE.Vector3(stack._halfDimensions.x, stack._halfDimensions.y, stack._dimensions.z);
          // // to LPS space
          // centerLastPlane.applyMatrix4(stack._ijk2LPS);

          var firstVoxel = new THREE.Vector3(0, 0, 0);
          firstVoxel.applyMatrix4(stack._ijk2LPS);
          var lastVoxel = new THREE.Vector3(stack._dimensions.x - 1, stack._dimensions.y - 1, stack._dimensions.z - 1);
          lastVoxel.applyMatrix4(stack._ijk2LPS);

          window.console.log('FIRST:', firstVoxel);
          window.console.log('LAST:', lastVoxel);

          var lpsBBox = [
          Math.min(firstVoxel.x, lastVoxel.x),
          Math.min(firstVoxel.y, lastVoxel.y),
          Math.min(firstVoxel.z, lastVoxel.z),
          Math.max(firstVoxel.x, lastVoxel.x),
          Math.max(firstVoxel.y, lastVoxel.y),
          Math.max(firstVoxel.z, lastVoxel.z)];

          window.console.log(lpsBBox);
                         
          var lpsCenter = new THREE.Vector3(
            lpsBBox[0] + (lpsBBox[3] - lpsBBox[0]) / 2,
            lpsBBox[1] + (lpsBBox[4] - lpsBBox[1]) / 2,
            lpsBBox[2] + (lpsBBox[5] - lpsBBox[2]) / 2);

          window.console.log(lpsCenter);

          // update camera's position
          // camera.position.set(centerFirstPlane.x, centerFirstPlane.y, centerFirstPlane.z + 10);
          // camera.position.x = position.x;
          // camera.position.y = position.y;
          // camera.position.z = position.z;

          // intersection ray  with box
          // ray: {position, direction}
          // box: {halfDimensions, center}
          var ray = {position: null, direction: null};
          ray.position = lpsCenter;
          ray.direction = new THREE.Vector3(stack._direction.elements[8], stack._direction.elements[9], stack._direction.elements[10]);

          window.console.log(ray);

          var box = {halfDimensions: null, center: null};
          box.center = lpsCenter;
          box.halfDimensions = new THREE.Vector3(lpsBBox[3] - lpsBBox[0] + 4, lpsBBox[4] - lpsBBox[1] + 4, lpsBBox[5] - lpsBBox[2] + 4);

          window.console.log(box);

          var intersections = VJS.core.intersections.rayBox(ray, box);
          window.console.log(intersections);
          // camera.position.set(intersections[0].x, intersections[0].y, intersections[0].z);
          //camera.position.set(lpsCenter.x, lpsCenter.y, lpsCenter.z);

          window.console.log('POSITION:', camera.position);


          camera.position.set(intersections[0].x, intersections[0].y, intersections[0].z);
          camera.up.set(up.x, up.y, up.z);
          camera.lookAt(intersections[1].x, intersections[1].y, intersections[1].z);
          camera.updateProjectionMatrix();

          controls.target.set(intersections[1].x, intersections[1].y, intersections[1].z);



          var luts = {
            lut: 'none',
            luts: ['none', 'spectrum', 'hotandcold', 'gold', 'red', 'green', 'blue', 'grayscale'],
            // good for testing, display should match when none is selected
            grayscale: {
              label: 'Gray Scale',
              data: [[0, 0, 0, 0], [1, 1, 1, 1]]
            },
            spectrum: {
              label: 'Spectrum',
              data: [[0, 0, 0, 0], [0.1, 0, 0, 1], [0.33, 0, 1, 1], [0.5, 0, 1, 0], [0.66, 1, 1, 0], [0.9, 1, 0, 0], [1, 1, 1, 1]]
            },
            hotandcold:{
              label: 'Hot and cold',
              data: [[0, 0, 0, 1], [0.15, 0, 1, 1], [0.3, 0, 1, 0], [0.45, 0, 0, 0], [0.5, 0, 0, 0], [0.55, 0, 0, 0], [0.7, 1, 1, 0], [0.85, 1, 0, 0], [1, 1, 1, 1]]
            },
            gold : {
              label: 'Gold',
              data: [[0, 0, 0, 0], [0.13, 0.19, 0.03, 0], [0.25, 0.39, 0.12, 0], [0.38, 0.59, 0.26, 0], [0.50, 0.80, 0.46, 0.08], [0.63, 0.99, 0.71, 0.21], [0.75, 0.99, 0.88, 0.34], [0.88, 0.99, 0.99, 0.48], [1, 0.90, 0.95, 0.61]]
            },
            red : {
              label: 'Red Overlay',
              data: [[0, 0.75, 0, 0], [0.5, 1, 0.5, 0], [0.95, 1, 1, 0], [1, 1, 1, 1]]
            },
            green : {
              label: 'Green Overlay',
              data: [[0, 0, 0.75, 0], [0.5, 0.5, 1, 0], [0.95, 1, 1, 0], [1, 1, 1, 1]]
            },
            blue : {
              label: 'Blue Overlay',
              data: [[0, 0, 0, 1], [0.5, 0, 0.5, 1], [0.95, 0, 1, 1], [1, 1, 1, 1]]
            }
          };

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

          var lutUpdate = stackFolder.add(luts, 'lut', luts.luts);
          lutUpdate.onChange(function(value) {

            if (value === 'none') {
              mergedHelpers[0]._uniforms.uLut.value = 0;
            } else {
              // format LUT (max size 16)
              var i = new Array(16);
              var r = new Array(16);
              var g = new Array(16);
              var b = new Array(16);
              for (var l = 0; l < luts[value].data.length; l++) {
                i[l] = luts[value].data[l][0];
                r[l] = luts[value].data[l][1];
                g[l] = luts[value].data[l][2];
                b[l] = luts[value].data[l][3];
              }

              mergedHelpers[0]._uniforms.uLutI.value = i;
              mergedHelpers[0]._uniforms.uLutR.value = r;
              mergedHelpers[0]._uniforms.uLutG.value = g;
              mergedHelpers[0]._uniforms.uLutB.value = b;
              mergedHelpers[0]._uniforms.uLut.value = 1;
            }
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
