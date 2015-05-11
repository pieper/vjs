/*global dat*/

'use strict';

var VJS = VJS || {};

var Stats = Stats || {};
// standard global variables
var controls, renderer, stats, scene, camera;

// FUNCTIONS
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
    var position = new THREE.Vector3(400, 0, 0);
    var vjsCamera = new VJS.Cameras.Camera2D(threeD.offsetWidth / -2, threeD.offsetWidth / 2, threeD.offsetHeight / 2, threeD.offsetHeight / -2, 1, 10000000, position);
    vjsCamera.Orientation('AXIAL');
    camera = vjsCamera.GetCamera();
    // controls
    controls = new THREE.OrbitControls2D(camera, renderer.domElement);
    controls.noRotate = true;

    animate();
}

function onWindowResize() {
    camera.left = window.innerWidth / -2;
    camera.right = window.innerWidth / 2;
    camera.top = window.innerHeight / 2;
    camera.bottom = window.innerHeight / -2;

    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

window.onload = function() {

    // init threeJS...
    init();

    var files = ['/data/dcm/fruit'];

    // build loading + parsing sequence
    var loadAndParse = VJS.Parsers.Dicom.loadAndParse(files);

    // all set....
    // GO!
    Promise
    // all data downloaded and parsed
        .all(loadAndParse)
        // then...
        .then(function(message) {
            // merge images if needed!
            // prepare images (generate convenience vars at all image/stack/frame levels)
            // view the stack (N slices to start...)
            window.console.log('all parsed');

            var stack = message[0].stack[0];
            var stackView = new VJS.stack.view(stack);
            stackView.threejsframe(30);
            scene.add(stackView);

            var gui = new dat.GUI({
                autoPlace: false
            });
            var customContainer = document.getElementById('my-gui-container');
            customContainer.appendChild(gui.domElement);

            var frameIndexController = gui.add(stackView, 'frameIndex', 0, stack.frame.length - 1).step(1);

            frameIndexController.onChange(function(value) {
                stackView.frame(value);
            });

        })
        .catch(function(error) {
            window.console.log(error);
        });
};
