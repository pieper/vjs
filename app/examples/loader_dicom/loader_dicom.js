'use strict';

var VJS = VJS || {};

var Stats = Stats || {};
// standard global variables
var controls, renderer, stats, scene, camera, dat;

// FUNCTIONS
function onProgressCallback(evt, filename) {
    var percentComplete = Math.round((evt.loaded / evt.total) * 100);

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

    var files = ['/data/dcm/corn', '/data/dcm/tomato'];

    window.console.log(dat);

    // create loader manager (to support multiple files)
    var manager = new THREE.LoadingManager();
    manager.onProgress = function(item, loaded, total) {
        var fileContainer = document.getElementById(item);
        fileContainer.innerHTML = ' ' + item + ' is ready! ' + '(' + loaded + '/' + total + ')';
        // merge images!
        // add it to the scene!
    };

    // let's load some dicoms!
    // instantiate a loader
    // todo: show progress somewhere!
    var loader = new VJS.loader.dicom(manager);
    // load a resource
    loader.load(
        // resource URL
        files[1],
        // Function when resource is loaded
        function(object) {
            //scene.add( object );
            window.console.log(object);
        },
        function() {
            onProgressCallback(event, files[1]);
        }

    );

    var loader2 = new VJS.loader.dicom(manager);
    // load a resource
    loader2.load(
        // resource URL
        files[0],
        // Function when resource is loaded
        function(object) {
            //scene.add( object );
            // should merge all images!

            window.console.log(object);
        },
        function() {
            onProgressCallback(event, files[0]);
        }
    );
};
