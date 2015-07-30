/* globals Stats*/
'use strict';

var VJS = VJS || {};

VJS.controls = VJS.controls || {};
VJS.controls.orbitControls2D = require('../../src/controls/OrbitControls2D');

VJS.widgets = VJS.widgets || {};
VJS.widgets.pixelProbe = require('../../src/widgets/widgets.pixelProbe');
VJS.widgets.orientation = require('../../src/widgets/widgets.orientation');

VJS.loaders = VJS.loaders || {};
VJS.loaders.dicom = require('../../src/loaders/loaders.dicom');

VJS.helpers = VJS.helpers || {};
VJS.helpers.slice = require('../../src/helpers/helpers.slice');



// standard global variables
var controls, renderer, stats, scene, camera, dat, probe, raycaster, mouse, orientation;

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
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / threeD.offsetWidth) * 2 - 1;
    mouse.y = -(event.clientY / threeD.offsetHeight) * 2 + 1;
    mouse.clientX = event.clientX;
    mouse.clientY = event.clientY;
  }

  function onDocumentMouseDown(event) {
    event.preventDefault();

    raycaster.setFromCamera(mouse, camera);
    var domElement = probe.mark(raycaster, mouse);
    if (domElement) {
      var threeD = document.getElementById('r3d');
      threeD.appendChild(domElement);
    }

  }

  // this function is executed on each animation frame
  function animate() {
    // image probe widget
    if (mouse && raycaster && probe) {
      raycaster.setFromCamera(mouse, camera);
      probe.update(raycaster, mouse, camera, threeD);
    }

    orientation.update();
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

  // orientation widget
  orientation = new VJS.widgets.orientation('r3d', camera, controls);

  //
  // mouse callbacks
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
  renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);

  animate();
}

window.onload = function() {

  // init threeJS...
  init();

  // Create Box
  var geometry = new THREE.BoxGeometry(500, 500, 500);
  var material = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0x607D8B
  });
  var cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // create loader manager (to keep track of progress over N files...)
  // might not be useful with promises anymore.

  // can not promise do it for us??
  var seriesContainer = [];
  var manager = new THREE.LoadingManager();
  manager.onProgress = function(item, loaded, total) {

    var fileContainer = document.getElementById(item);
    if (fileContainer) {
      fileContainer.innerHTML = ' ' + item + ' is ready! ' + '(' + loaded + '/' + total + ')';
    }

    if (loaded === total) {
      var mergedSeriesContainer = [seriesContainer[0]];
      // if all files loaded
      for (var i = 0; i < seriesContainer.length; i++) {
        // test image against existing imagess
        for (var j = 0; j < mergedSeriesContainer.length; j++) {
          if (mergedSeriesContainer[j].merge(seriesContainer[i])) {
            // merged successfully
            break;
          } else if (j === mergedSeriesContainer.length - 1) {
            // last merge was not successful
            // this is a new image
            mergedSeriesContainer.push(seriesContainer[i]);
          }
        }
      }
      
      var dummySeries = mergedSeriesContainer[0];
      var myHelper = new VJS.helpers.slice(dummySeries);

      myHelper.prepare();
      scene.add(myHelper);

      probe = new VJS.widgets.pixelProbe(dummySeries, myHelper.children);
      scene.add(probe);

      var threeD = document.getElementById('r3d');
      threeD.appendChild(probe.domElement);

    }
  };

  var filenames = [
      '36749810', '36749824', '36749838', '36749852', '36749866', '36749880',
      '36749894', '36749908', '36749922', '36749936', '36749950', '36749964'
  ];

  var files = filenames.map(function(v) {
    return '../../data/dcm/adi/' + v;
  });

  window.console.log(files);

  function loadClosure(filename) {
    var loader = new VJS.loaders.dicom(manager);
    loader.load(
        filename,
        // on load
            function(series) {
              // should it just return an image model?
              // add image helper to scene
              seriesContainer.push(series);
            },
            // progress
            function() {
              window.console.log(filename);
              onProgressCallback(event, filename);
            },
            // error
            function(message) {
              window.console.log('error: ', message);
            }
        );
  }

  for (var k = 0; k < files.length; k++) {
    loadClosure(files[k]);
  }
};
