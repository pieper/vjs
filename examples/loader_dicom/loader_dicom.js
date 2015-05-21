'use strict';

var VJS = VJS || {};

var Stats = Stats || {};
// standard global variables
var controls, renderer, stats, scene, camera, dat;

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

    var files = ['../../data/dcm/fruit'];

    window.console.log(dat);

    // let's load some dicoms!
    // instantiate a loader
    // todo: show progress somewhere!
    var loader = new VJS.loader.dicom();
    // load a resource
    loader.load(
        // resource URL
        files[0],
        // Function when resource is loaded
        function(object) {
            //scene.add( object );
            window.console.log(object);
        }
    );
};
