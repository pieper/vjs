'use strict';

var VJS = VJS || {};

var Stats = Stats || {};
// standard global variables
var controls, renderer, stats, scene, camera, dat;

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

  animate();
}

window.onload = function() {

  // init threeJS...
  init();

  window.console.log(dat);

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

  // var files = ['/data/dcm/corn', '/data/dcm/tomato', '/data/dcm/fruit', '/data/dcm/bellpepper'];
  var files = ['/data/dcm/corn', '/data/dcm/tomato'];
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
        function(object) {
          //scene.add( object );
          window.console.log('imageHelper ready!');
          window.console.log(object);
          scene.add(object);
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
