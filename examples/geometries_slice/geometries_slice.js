/* globals Stats, dat*/
'use strict';

var vjsSliceGeometry = require('../../src/geometries/geometries.slice');
var vjsOrbitControl2D = require('../../src/controls/OrbitControls2D');

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

  // make a box!
  var dimensions = new THREE.Vector3(123, 45, 67);
  var boxGeometry = new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);
  var boxMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0x61F2F3
  });
  var box = new THREE.Mesh(boxGeometry, boxMaterial);
  scene.add(box);

  // make a slice!
  var halfDimensions = dimensions.clone().divideScalar(2);
  var center = new THREE.Vector3(0, 0, 0);
  var orientation = new THREE.Vector3(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 1));

  var position = center.clone();
  var direction = new THREE.Vector3(-0.2, 0.5, 0.3);

  var sliceGeometry = new vjsSliceGeometry(halfDimensions, center, orientation, position, direction);
  var sliceMaterial = new THREE.MeshBasicMaterial({
    'side': THREE.DoubleSide,
    'transparency': true,
    'color': 0x03A9F4
  });
  var slice = new THREE.Mesh(sliceGeometry, sliceMaterial);
  scene.add(slice);

  // make the direction!!
  var length = 20;
  var hex = 0xF44336;

  var arrowHelper = new THREE.ArrowHelper(direction, position, length, hex);
  var arrowUpdate = {
    'direction': {
      'i': direction.x,
      'j': direction.y,
      'k': direction.z
    },
    'position': {
      'i': position.x,
      'j': position.y,
      'k': position.z
    }
  };

  scene.add(arrowHelper);

  var gui = new dat.GUI({
    autoPlace: false
  });

  var customContainer = document.getElementById('my-gui-container');
  customContainer.appendChild(gui.domElement);

  var directionFolder = gui.addFolder('Plane direction');
  var frameIndexControllerDirectionI = directionFolder.add(arrowUpdate.direction, 'i', -1, 1);
  var frameIndexControllerDirectionJ = directionFolder.add(arrowUpdate.direction, 'j', -1, 1);
  var frameIndexControllerDirectionK = directionFolder.add(arrowUpdate.direction, 'k', -1, 1);
  directionFolder.open();

  var positionFolder = gui.addFolder('Plane position');
  var frameIndexControllerOriginI = positionFolder.add(arrowUpdate.position, 'i', -61.5, 61.5);
  var frameIndexControllerOriginJ = positionFolder.add(arrowUpdate.position, 'j', -22.5, 22.5);
  var frameIndexControllerOriginK = positionFolder.add(arrowUpdate.position, 'k', -33.5, 33.5);
  positionFolder.open();

  frameIndexControllerDirectionI.onChange(function(value) {
    var newDirection = new THREE.Vector3(value, arrowUpdate.direction.j, arrowUpdate.direction.k);
    newDirection.normalize();
    var newPosition = new THREE.Vector3(arrowUpdate.position.i, arrowUpdate.position.j, arrowUpdate.position.k);

    arrowHelper.setDirection(newDirection);

    // is memory leaking???
    var newSliceGeometry = new vjsSliceGeometry(halfDimensions, center, orientation, newPosition, newDirection);
    slice.geometry = newSliceGeometry;
    slice.geometry.verticesNeedUpdate = true;
  });

  frameIndexControllerDirectionJ.onChange(function(value) {
    var newDirection = new THREE.Vector3(arrowUpdate.direction.i, value, arrowUpdate.direction.k);
    newDirection.normalize();
    var newPosition = new THREE.Vector3(arrowUpdate.position.i, arrowUpdate.position.j, arrowUpdate.position.k);

    arrowHelper.setDirection(newDirection);

    // is memory leaking???
    var newSliceGeometry = new vjsSliceGeometry(halfDimensions, center, orientation, newPosition, newDirection);
    slice.geometry = newSliceGeometry;
    slice.geometry.verticesNeedUpdate = true;
  });

  frameIndexControllerDirectionK.onChange(function(value) {
    var newDirection = new THREE.Vector3(arrowUpdate.direction.i, arrowUpdate.direction.j, value);
    newDirection.normalize();
    var newPosition = new THREE.Vector3(arrowUpdate.position.i, arrowUpdate.position.j, arrowUpdate.position.k);

    arrowHelper.setDirection(newDirection);

    // is memory leaking???
    var newSliceGeometry = new vjsSliceGeometry(halfDimensions, center, orientation, newPosition, newDirection);
    slice.geometry = newSliceGeometry;
    slice.geometry.verticesNeedUpdate = true;
  });

  frameIndexControllerOriginI.onChange(function(value) {
    var newDirection = new THREE.Vector3(arrowUpdate.direction.i, arrowUpdate.direction.j, arrowUpdate.direction.k);
    newDirection.normalize();
    var newPosition = new THREE.Vector3(value, arrowUpdate.position.j, arrowUpdate.position.k);

    scene.remove(arrowHelper);
    arrowHelper = new THREE.ArrowHelper(newDirection, newPosition, length, hex);
    scene.add(arrowHelper);

    // is memory leaking???
    var newSliceGeometry = new vjsSliceGeometry(halfDimensions, center, orientation, newPosition, newDirection);
    slice.geometry = newSliceGeometry;
    slice.geometry.verticesNeedUpdate = true;
  });

  frameIndexControllerOriginJ.onChange(function(value) {
    var newDirection = new THREE.Vector3(arrowUpdate.direction.i, arrowUpdate.direction.j, arrowUpdate.direction.k);
    newDirection.normalize();
    var newPosition = new THREE.Vector3(arrowUpdate.position.i, value, arrowUpdate.position.k);

    scene.remove(arrowHelper);
    arrowHelper = new THREE.ArrowHelper(newDirection, newPosition, length, hex);
    scene.add(arrowHelper);

    // is memory leaking???
    var newSliceGeometry = new vjsSliceGeometry(halfDimensions, center, orientation, newPosition, newDirection);
    slice.geometry = newSliceGeometry;
    slice.geometry.verticesNeedUpdate = true;
  });

  frameIndexControllerOriginK.onChange(function(value) {
    var newDirection = new THREE.Vector3(arrowUpdate.direction.i, arrowUpdate.direction.j, arrowUpdate.direction.k);
    newDirection.normalize();
    var newPosition = new THREE.Vector3(arrowUpdate.position.i, arrowUpdate.position.j, value);

    scene.remove(arrowHelper);
    arrowHelper = new THREE.ArrowHelper(newDirection, newPosition, length, hex);
    scene.add(arrowHelper);

    // is memory leaking???
    var newSliceGeometry = new vjsSliceGeometry(halfDimensions, center, orientation, newPosition, newDirection);
    slice.geometry = newSliceGeometry;
    slice.geometry.verticesNeedUpdate = true;
  });
};
