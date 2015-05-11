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
    var camera = new THREE.PerspectiveCamera(45, threeD.offsetWidth / threeD.offsetHeight, 1, 10000000);
    camera.position.x = 400;
    camera.position.y = 400;
    camera.position.z = 400;
    camera.lookAt(scene.position);
    // controls
    controls = new THREE.OrbitControls2D(camera, renderer.domElement);

    animate();
}

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

            // float textures to shaders
            //http://jsfiddle.net/greggman/upZ7V/
            //http://jsfiddle.net/greggman/LMbhk/

            // merge images if needed!
            // prepare images (generate convenience vars at all image/stack/frame levels)
            // view the stack (N slices to start...)
            window.console.log('all parsed');

            var stack = message[0].stack[0];
            stack.prepare();
            var stackView = new VJS.stack.view(stack);
            // normal coordinates in which space?
            var normal = new THREE.Vector3(1, 1, 0.5);
            var origin = new THREE.Vector3(20, 20, 30);
            stackView.threejsslice(origin, normal);
            scene.add(stackView);

            // var gui = new dat.GUI({
            //     autoPlace: false
            // });
            // var customContainer = document.getElementById('my-gui-container');
            // customContainer.appendChild(gui.domElement);

            // var frameIndexController = gui.add(stackView, 'frameIndex', 0, stack.frame.length - 1).step(1);

            // frameIndexController.onChange(function(value) {
            //     stackView.frame(value);
            // });

        })
        .catch(function(error) {
            window.console.log(error);
        });
};
