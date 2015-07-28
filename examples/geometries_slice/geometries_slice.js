/* globals Stats, dat*/
'use strict';

var VJS = VJS || {};
VJS.geometries = VJS.geometries || {};
VJS.geometries.slice = require('../../src/geometries/geometries.slice');

VJS.controls = VJS.controls || {};
VJS.controls.orbitControls2D = require('../../src/controls/OrbitControls2D');

// standard global variables
var controls, renderer, scene, camera, statsyay, particleLight, sliceMesh, arrowMesh;

var arrow = {
  'direction': new THREE.Vector3(0, 0, 0),
  'position':  new THREE.Vector3(0, 0, 0),
  'length': 20,
  'color': 0xFFF336
};

var box = {
  'dimensions': new THREE.Vector3(123, 45, 67),
  'halfDimensions': new THREE.Vector3(123, 45, 67).divideScalar(2),
  'center': new THREE.Vector3(0, 0, 0),
  'orientation': new THREE.Vector3(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1))
};

function disposeSliceMesh() {
  scene.remove(sliceMesh);
  sliceMesh.geometry.dispose();
  sliceMesh.material.dispose();
  sliceMesh = null;
}

function createSliceMesh() {
  // create the geometry
  var sliceGeometry = new VJS.geometries.slice(box.halfDimensions, box.center, box.orientation, arrow.position, arrow.direction);
  // create the material
  var sliceMaterial = new THREE.MeshLambertMaterial({
    color: 0x03A9F4,
    emissive: 0x000000,
    shininess: 30,
    shading: THREE.SmoothShading,
    'side': THREE.DoubleSide
  });
  return new THREE.Mesh(sliceGeometry, sliceMaterial);
}

function updateGeometries() {
  if (arrowMesh && sliceMesh) {
    // update arrow
    arrowMesh.position.set(arrow.position.x, arrow.position.y, arrow.position.z);
    arrowMesh.setDirection(arrow.direction);

    // create new slice
    // not super efficient...
    disposeSliceMesh();
    sliceMesh = createSliceMesh();
    scene.add(sliceMesh);
  }
}

// FUNCTIONS
function init() {

  // this function is executed on each animation frame
  function animate() {

    // update light position
    var timer = Date.now() * 0.00025;

    particleLight.position.x = Math.sin(timer * 7) * 70;
    particleLight.position.y = Math.cos(timer * 5) * 80;
    particleLight.position.z = Math.cos(timer * 3) * 90;

    //update normal to look at particle
    var dir = new THREE.Vector3(
      particleLight.position.x - arrow.position.x,
      particleLight.position.y - arrow.position.y,
      particleLight.position.z - arrow.position.z
      ).normalize();
    arrow.direction.x = dir.x;
    arrow.direction.y = dir.y;
    arrow.direction.z = dir.z;

    updateGeometries();
        
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
  renderer.setClearColor(0x353535, 1);

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
  controls = new VJS.controls.orbitControls2D(camera, renderer.domElement);

  scene.add(new THREE.AmbientLight(0x444444));

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  particleLight = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), new THREE.MeshBasicMaterial({color: 0xFFF336}));
  scene.add(particleLight);

  var pointLight = new THREE.PointLight(0xffffff, 2, 200);
  particleLight.add(pointLight);

  animate();
}

window.onload = function() {
  // init threeJS...
  init();

  // make a box!
  var boxGeometry = new THREE.BoxGeometry(box.dimensions.x, box.dimensions.y, box.dimensions.z);
  var boxMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0x61F2F3
  });
  var boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
  scene.add(boxMesh);

  // make a slice!
  sliceMesh = createSliceMesh();
  scene.add(sliceMesh);

  // make an arrow
  arrowMesh = new THREE.ArrowHelper(arrow.direction, arrow.position, arrow.length, arrow.color);
  scene.add(arrowMesh);

  var gui = new dat.GUI({
    autoPlace: false
  });

  var customContainer = document.getElementById('my-gui-container');
  customContainer.appendChild(gui.domElement);

  var directionFolder = gui.addFolder('Plane direction');
  var frameIndexControllerDirectionI = directionFolder.add(arrow.direction, 'x', -1, 1).listen();
  var frameIndexControllerDirectionJ = directionFolder.add(arrow.direction, 'y', -1, 1).listen();
  var frameIndexControllerDirectionK = directionFolder.add(arrow.direction, 'z', -1, 1).listen();
  directionFolder.open();

  var positionFolder = gui.addFolder('Plane position');
  var frameIndexControllerOriginI = positionFolder.add(arrow.position, 'x', -61.5, 61.5).listen();
  var frameIndexControllerOriginJ = positionFolder.add(arrow.position, 'y', -22.5, 22.5).listen();
  var frameIndexControllerOriginK = positionFolder.add(arrow.position, 'z', -33.5, 33.5).listen();
  positionFolder.open();

  frameIndexControllerDirectionI.onChange(updateGeometries);
  frameIndexControllerDirectionJ.onChange(updateGeometries);
  frameIndexControllerDirectionK.onChange(updateGeometries);
  frameIndexControllerOriginI.onChange(updateGeometries);
  frameIndexControllerOriginJ.onChange(updateGeometries);
  frameIndexControllerOriginK.onChange(updateGeometries);
};
