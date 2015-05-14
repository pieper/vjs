'use strict';

var VJS = VJS || {};

var Stats = Stats || {};
// standard global variables
var controls, renderer, stats, scene;

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
    var renderer = new THREE.WebGLRenderer({
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
    var camera = vjsCamera.GetCamera();
    // controls
    controls = new THREE.OrbitControls2D(camera, renderer.domElement);
    controls.noRotate = true;

    animate();
}

window.onload = function() {

    // init threeJS...
    init();

    //var files = ['https://googledrive.com/host/0B8u7h0aKnydhfmluNDZHeHhYLVdudEpCcG5JTnI5ZzRYNUJOQnY0LWszWDJVdk1fdXl5MzQ/US-RGB-8-esopecho', 'https://googledrive.com/host/0B8u7h0aKnydhfmluNDZHeHhYLVdudEpCcG5JTnI5ZzRYNUJOQnY0LWszWDJVdk1fdXl5MzQ/US-RGB-8-esopecho'];
    var files = ['/data/dcm/US-RGB-8-esopecho'];
    var dcmParser = new VJS.parsers.dicom(files);

    // all set....
    // GO!
    Promise
    // all data downloaded and parsed
        .all(dcmParser.loadAndParse())
        // then...
        .then(function(message) {
            //
            // merge images if needed!
            //

            //
            // create threeJS friendly frame
            //
            var frame = message[0]._stack[0]._frame[0];
            var frameView = new VJS.frame.view(frame);
            // maybe this one should be in the constructor and we should have a new parameter which specifies the type of view...
            frameView.threejsframe();
            // should be able to call
            // frameView.space('IJK'); // or LPS, or WORLD, etc.
            scene.add(frameView);
        })
        .catch(function(error) {
            window.console.log(error);
        });
};
