/* globals Stats, dat*/
'use strict';

var vjsSliceGeometry = require('../../src/geometries/geometries.slice');
var vjsOrbitControl2D = require('../../src/controls/OrbitControls2D');

// standard global variables
var controls, renderer, scene, camera, statsyay, particleLight, slice, arrowHelper;
var arrowUpdate = {
    'direction': {
      'i': 0,
      'j': 0,
      'k': 0
    },
    'position': {
      'i': 0,
      'j': 0,
      'k': 0
    }
  };
var dimensions = new THREE.Vector3(123, 45, 67);
var halfDimensions = dimensions.clone().divideScalar(2);
var center = new THREE.Vector3(0, 0, 0);
var orientation = new THREE.Vector3(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1));

// make the direction!!
var arrowLength = 20;
var arrowColor = 0xF44336;

function updateGeometries() {
  if (arrowHelper && slice) {
    var newDirection = new THREE.Vector3(arrowUpdate.direction.i, arrowUpdate.direction.j, arrowUpdate.direction.k);
    newDirection.normalize();
    var newPosition = new THREE.Vector3(arrowUpdate.position.i, arrowUpdate.position.j, arrowUpdate.position.k);

    scene.remove(arrowHelper);
    arrowHelper = new THREE.ArrowHelper(newDirection, newPosition, arrowLength, arrowColor);
    scene.add(arrowHelper);

    // is memory leaking???
    var newSliceGeometry = new vjsSliceGeometry(halfDimensions, center, orientation, newPosition, newDirection);
    slice.geometry = newSliceGeometry;
    slice.geometry.verticesNeedUpdate = true;
  }
}

// FUNCTIONS
function init() {

  // this function is executed on each animation frame
  function animate() {

    // update light position
    var timer = Date.now() * 0.00025;

    particleLight.position.x = Math.sin(timer * 7) * 80;
    particleLight.position.y = Math.cos(timer * 5) * 90;
    particleLight.position.z = Math.cos(timer * 3) * 100;

    //update normal to look at particle
    var  newDirection = new THREE.Vector3(
      particleLight.position.x - arrowUpdate.position.i,
      particleLight.position.y - arrowUpdate.position.j,
      particleLight.position.z - arrowUpdate.position.k
      ).normalize();

    arrowUpdate.direction.i = newDirection.x;
    arrowUpdate.direction.j = newDirection.y;
    arrowUpdate.direction.k = newDirection.z;

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
  controls = new vjsOrbitControl2D(camera, renderer.domElement);

  scene.add(new THREE.AmbientLight(0x444444));

  var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  particleLight = new THREE.Mesh(new THREE.SphereGeometry(2, 8, 8), new THREE.MeshBasicMaterial({color: 0xffffff}));
  scene.add(particleLight);

  var pointLight = new THREE.PointLight(0xffffff, 2, 200);
  particleLight.add(pointLight);

  animate();
}

window.onload = function() {
  // init threeJS...
  init();

  // make a box!

  var boxGeometry = new THREE.BoxGeometry(dimensions.x, dimensions.y, dimensions.z);
  var boxMaterial = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0x61F2F3
  });
  var box = new THREE.Mesh(boxGeometry, boxMaterial);
  scene.add(box);

  // make a slice!
  var position = center.clone();
  var direction = new THREE.Vector3(-0.2, 0.5, 0.3);

  var sliceGeometry = new vjsSliceGeometry(halfDimensions, center, orientation, position, direction);
  // var shininess = 50, specular = 0x333333, bumpScale = 1, shading = THREE.SmoothShading;
  // new THREE.MeshPhongMaterial( { color: 0xdddddd, specular: 0x009900, shininess: 30, shading: THREE.FlatShading }
  var sliceMaterial = new THREE.MeshLambertMaterial({
    color: 0x03A9F4,
    emissive: 0x000000,
    shininess: 30,
    shading: THREE.SmoothShading,
    'side': THREE.DoubleSide
  });
  // new THREE.MeshBasicMaterial({
  //   'side': THREE.DoubleSide,
  //   'color': 0x03A9F4
  // });
  slice = new THREE.Mesh(sliceGeometry, sliceMaterial);
  scene.add(slice);

  arrowHelper = new THREE.ArrowHelper(direction, position, arrowLength, arrowColor);
  arrowUpdate = {
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
  var frameIndexControllerDirectionI = directionFolder.add(arrowUpdate.direction, 'i', -1, 1).listen();
  var frameIndexControllerDirectionJ = directionFolder.add(arrowUpdate.direction, 'j', -1, 1).listen();
  var frameIndexControllerDirectionK = directionFolder.add(arrowUpdate.direction, 'k', -1, 1).listen();
  directionFolder.open();

  var positionFolder = gui.addFolder('Plane position');
  var frameIndexControllerOriginI = positionFolder.add(arrowUpdate.position, 'i', -61.5, 61.5).listen();
  var frameIndexControllerOriginJ = positionFolder.add(arrowUpdate.position, 'j', -22.5, 22.5).listen();
  var frameIndexControllerOriginK = positionFolder.add(arrowUpdate.position, 'k', -33.5, 33.5).listen();
  positionFolder.open();

  frameIndexControllerDirectionI.onChange(function() {
    updateGeometries();
  });

  frameIndexControllerDirectionJ.onChange(function() {
    updateGeometries();
  });

  frameIndexControllerDirectionK.onChange(function() {
    updateGeometries();
  });

  frameIndexControllerOriginI.onChange(function() {
    updateGeometries();
  });

  frameIndexControllerOriginJ.onChange(function() {
    updateGeometries();
  });

  frameIndexControllerOriginK.onChange(function() {
    updateGeometries();
  });
};
