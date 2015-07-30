/* globals Stats*/
'use strict';

var VJS = VJS || {};
VJS.controls = VJS.controls || {};
VJS.controls.orbitControls2D = require('../../src/controls/OrbitControls2D');

VJS.widgets = VJS.widgets || {};
VJS.widgets.pixelProbe = require('../../src/widgets/widgets.pixelProbe');

VJS.loaders = VJS.loaders || {};
VJS.loaders.dicom = require('../../src/loaders/loaders.dicom');

VJS.helpers = VJS.helpers || {};
VJS.helpers.slice = require('../../src/helpers/helpers.slice');

// standard global variables
var controls, renderer, stats, scene, camera, probe, raycaster, mouse, drag;

// FUNCTIONS
function onProgressCallback(evt, filename) {
  var percentComplete = Math.round((evt.loaded / evt.total) * 100);

  window.console.log(filename);

  var fileContainer = document.getElementById(filename);
  if (!fileContainer) {
    var progressContainer = document.getElementById('my-progress-container');
    var div = document.createElement('div');
    div.setAttribute('id', filename);
    div.innerHTML = 'Downloading ' + filename + ': ' + percentComplete + '%';

    progressContainer.appendChild(div);
  } else {
    fileContainer.innerHTML = 'Downloading ' + filename + ': ' + percentComplete + '%';
  }
}

function init() {
  function onDocumentMouseMove(event) {
    event.preventDefault();

    drag = 1;

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / threeD.offsetWidth) * 2 - 1;
    mouse.y = -(event.clientY / threeD.offsetHeight) * 2 + 1;
    mouse.clientX = event.clientX;
    mouse.clientY = event.clientY;
  }

  function onDocumentMouseDown(event) {
    event.preventDefault();

    drag = 0;

  }

  function onDocumentMouseUp(event) {
    event.preventDefault();

    if (drag === 0) {
      // create/select handle
      raycaster.setFromCamera(mouse, camera);
      // name???
      var domElement = probe.mark(raycaster, mouse);
      if (domElement) {
        var threeD = document.getElementById('r3d');
        threeD.appendChild(domElement);
      }
    }
  }

  // this function is executed on each animation frame
  function animate() {

    // image probe widget
    if (mouse && raycaster && probe) {
      raycaster.setFromCamera(mouse, camera);
      probe.update(raycaster, mouse, camera, threeD);
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

  //
  // mouse callbacks
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
  renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
  renderer.domElement.addEventListener('mouseup', onDocumentMouseUp, false);

  animate();
}

window.onload = function() {
  // init threeJS...
  init();

  // create loader manager (to keep track of progress over N files...)
  // might not be useful with promises anymore.

  // can not promise do it for us??
  var manager = new THREE.LoadingManager();
  manager.onProgress = function(item, loaded, total) {
    window.console.log(item);
    var fileContainer = document.getElementById(item);
    if (fileContainer) {
      fileContainer.innerHTML = ' ' + item + ' is ready! ' + '(' + loaded + '/' + total + ')';
      // merge images!
      // add it to the scene!
    }
  };

  var file = '/data/dcm/adi/36749894';
  //var file = '../../data/dcm/fruit';

  // instantiate the loader
  var loader = new VJS.loaders.dicom(manager);
  loader.load(
      file,
      // on load
        function(series) {
          var sliceHelper = new VJS.helpers.slice(series);
          sliceHelper.prepare();

          scene.add(sliceHelper);

          probe = new VJS.widgets.pixelProbe(series, sliceHelper.children);
          scene.add(probe);

          var threeD = document.getElementById('r3d');
          threeD.appendChild(probe.domElement);
        },
        // progress
        function() {
          onProgressCallback(event, file);
        },
        // error
        function(message) {
          window.console.log('error: ', message);
        }
    );
};
