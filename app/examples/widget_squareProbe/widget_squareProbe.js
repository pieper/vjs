'use strict';

var VJS = VJS || {};

var Stats = Stats || {};
// standard global variables
var controls, renderer, stats, scene, camera, dat, probe, raycaster, mouse;

// FUNCTIONS
function onProgressCallback(evt, filename) {
  var percentComplete = Math.round((evt.loaded / evt.total) * 100);

  // window.console.log(filename);

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

  // fileContainer

  // window.console.log(percentComplete + '%');
}

function init() {

  function onDocumentMouseMove(event) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    mouse.x = (event.clientX / threeD.offsetWidth) * 2 - 1;
    mouse.y = -(event.clientY / threeD.offsetHeight) * 2 + 1;
  }

  // this function is executed on each animation frame
  function animate() {

    // image probe widget
    if (probe) {
      raycaster.setFromCamera(mouse, camera);
      // probe.update(raycaster);
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
  controls = new THREE.OrbitControls2D(camera, renderer.domElement);

  //
  // mouse callbacks
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);

  animate();
}

window.onload = function() {

  // init threeJS...
  init();

  window.console.log(dat);

  // create loader manager (to keep track of progress over N files...)
  // might not be useful with promises anymore.

  // Create Box
  var geometry = new THREE.BoxGeometry(500, 500, 500);
  var material = new THREE.MeshBasicMaterial({
      wireframe: true,
      color: 0x607D8B
    });
  var cube = new THREE.Mesh(geometry, material);
  scene.add(cube);


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

  var files = ['/data/dcm/adi/36749894'];
  // instantiate the loader
  var loader = new VJS.loader.dicom(manager);

  // Go!
  Promise
  // all data downloaded and parsed
    .all(
      loader.load(
        // files to be loaded
        files,
        // loaded callback
        function(imageHelper) {
          // should it just return an image model?
          // add image helper to scene
          imageHelper.prepare();
          scene.add(imageHelper);

          // probe = new VJS.widgets.imageProbe(imageHelper._image, imageHelper.children);
          // var threeD = document.getElementById('r3d');
          // threeD.appendChild(probe.domElement);
          
        },
        // progress callback
        onProgressCallback,
        // (network) error callback
        null
    ))
    .then(function(message) {
      window.console.log(message);
      window.console.log(scene);
      window.console.log('ALL SET YAY DICOM');
    })
    .catch(function(error) {
      window.console.log(error);
    });

};
