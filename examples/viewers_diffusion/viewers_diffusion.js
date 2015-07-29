/* globals Stats, dat*/
'use strict';

var VJS = VJS || {};
VJS.loaders = VJS.loaders || {};
VJS.loaders.dicom = require('../../src/loaders/loaders.dicom');

VJS.cameras = VJS.cameras || {};
VJS.cameras.camera2d = require('../../src/cameras/cameras.camera2d');

VJS.core = VJS.core || {};
VJS.core.intersections = require('../../src/core/core.intersections');

VJS.controls = VJS.controls || {};
VJS.controls.orbitControls2D = require('../../src/controls/OrbitControls2D');

VJS.extras = VJS.extras || {};
VJS.extras.lut = require('../../src/extras/extras.lut');

VJS.helpers = VJS.helpers || {};
VJS.helpers.slice = require('../../src/helpers/helpers.slice');

// standard global variables
var controls, renderer, scene, camera, statsyay, threeD;
var received = 0;
var total = -1;
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
  camera = new THREE.OrthographicCamera(threeD.offsetWidth / -2, threeD.offsetWidth / 2, threeD.offsetHeight / 2, threeD.offsetHeight / -2, 1, 1000);
  // var vjsCamera = new VJS.cameras.camera2d(threeD.offsetWidth / -2, threeD.offsetWidth / 2, threeD.offsetHeight / 2, threeD.offsetHeight / -2, -1000, 1000, positionT);
  // camera = vjsCamera.GetCamera();

  // controls
  controls = new VJS.controls.orbitControls2D(camera, renderer.domElement);
  controls.noRotate = true;

  animate();
}

window.onload = function() {

  // init threeJS...
  init();

  var seriesHelperContainer = [];

  function mergeSeries(seriesH) {
    var mergedHelpers = [seriesH[0]];
    for (var k = 0; k < seriesH.length; k++) {
      // test image against existing imagess
      for (var j = 0; j < mergedHelpers.length; j++) {
        if (mergedHelpers[j]._series.merge(seriesH[k]._series)) {
          // merged successfully
          break;
        } else if (j === mergedHelpers.length - 1) {
          // last merge was not successful
          // this is a new series
          mergedHelpers.push(seriesH[k]);
        }
      }
    }

    return mergedHelpers;
  }

  function buildGUI(sliceHelper) {
    var stack = sliceHelper._series._stack[0];
    
    var gui = new dat.GUI({
            autoPlace: false
          });

    var customContainer = document.getElementById('my-gui-container');
    customContainer.appendChild(gui.domElement);

    var stackFolder = gui.addFolder('Stack');
    var windowWidthUpdate = stackFolder.add(sliceHelper._slice, 'windowWidth', 1, stack._minMax[1]).step(1).listen();
    windowWidthUpdate.onChange(function() {sliceHelper.updateCosmeticUniforms();});

    var windowCenterUpdate = stackFolder.add(sliceHelper._slice, 'windowCenter', stack._minMax[0], stack._minMax[1]).step(1).listen();
    windowCenterUpdate.onChange(function() {sliceHelper.updateCosmeticUniforms();});

    var windowAutoUpdate = stackFolder.add(sliceHelper._slice, 'windowAuto');
    windowAutoUpdate.onChange(function() {
            sliceHelper.updateSliceWindowLevel();
            sliceHelper.updateCosmeticUniforms();
          });

    var invertUpdate = stackFolder.add(sliceHelper._slice, 'invert');
    invertUpdate.onChange(function() {sliceHelper.updateCosmeticUniforms();});

    var lutUpdate = stackFolder.add(sliceHelper._slice, 'lut', VJS.extras.lut.luts());
    lutUpdate.onChange(function() {sliceHelper.updateCosmeticUniforms();});

    var frameIndex = stackFolder.add(sliceHelper._slice, 'index', 0, stack._dimensions.z - 1).step(1);
    // update everything, we have to create a new mesh!
    frameIndex.onChange(function() {sliceHelper.updateSlice();});

    stackFolder.open();
  }

  function handleFile(e) {
    received++;
    var arrayBuffer = e.target.result;
    var loader = new VJS.loaders.dicom();
    var dummySeries = loader.parse(arrayBuffer);
    // add image to image helper
    // image helper is a 3D object image wherease image is a general JS Object
    // series helper with lot of goodies
    var myHelper = new VJS.helpers.slice(dummySeries);
    // try catch it...?
    // myHelper.prepare();
    if (myHelper !== null) {
      seriesHelperContainer.push(myHelper);
    }
        
    if (received === total) {
      window.console.log('ALL IMAGES RECEIVED');
      window.console.log(seriesHelperContainer);

      // prepare for slice visualization
      var sliceHelper = mergeSeries(seriesHelperContainer)[0];
      sliceHelper.prepare();
      scene.add(sliceHelper);

      // return;

      window.console.log(sliceHelper);

      var stack = sliceHelper._series._stack[0];

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

      var firstVoxel = new THREE.Vector3(0, 0, 0);
      firstVoxel.applyMatrix4(stack._ijk2LPS);
      var lastVoxel = new THREE.Vector3(stack._dimensions.x - 1, stack._dimensions.y - 1, stack._dimensions.z - 1);
      lastVoxel.applyMatrix4(stack._ijk2LPS);

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

      buildGUI(sliceHelper);
    }
  }

  function readMultipleFiles(evt) {
    // hide the upload button
    document.getElementById('fileinput').style.display = 'none';

    for (var i = 0; i < evt.target.files.length; i++) {
      var f = evt.target.files[i];
      total = evt.target.files.length;
      
      if (f) {
        var r = new FileReader();
        r.onload = handleFile;
        r.readAsArrayBuffer(f);
      } else { 
        window.console.log('Failed to load file');
      }
    }
  }
  // hook up file input listener
  document.getElementById('fileinput').addEventListener('change', readMultipleFiles, false);
};
