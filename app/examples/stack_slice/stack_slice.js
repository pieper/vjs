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
    var dcmParser = new VJS.parsers.dicom(files);

    // all set....
    // GO!
    Promise
    // all data downloaded and parsed
        .all(dcmParser.loadAndParse())
        // then...
        .then(function(message) {

            // float textures to shaders
            //http://jsfiddle.net/greggman/upZ7V/
            //http://jsfiddle.net/greggman/LMbhk/

            // merge images if needed!
            // prepare images (generate convenience vars at all image/stack/frame levels)
            // view the stack (N slices to start...)
            window.console.log('all parsed');

            // those operations could be async too!

            // make a box!
            var geometry = new THREE.BoxGeometry(896, 896, 60);
            geometry.applyMatrix(new THREE.Matrix4().makeTranslation(448, 448, 30));
            var material = new THREE.MeshBasicMaterial({
                wireframe: true,
                color: 0x61F2F3
            });
            var cube = new THREE.Mesh(geometry, material);
            scene.add(cube);


            var stack = message[0]._stack[0];
            stack.prepare();
            var stackView = new VJS.stack.view(stack);
            // direction coordinates in which space?
            var direction = new THREE.Vector3(0, 0, 1);
            stackView.directionI = direction.x;
            stackView.directionJ = direction.y;
            stackView.directionK = direction.z;

            var origin = new THREE.Vector3(448, 448, 32);
            stackView.originI = origin.x;
            stackView.originJ = origin.y;
            stackView.originK = origin.z;
            stackView.threejsslice(origin, direction);
            scene.add(stackView);

            // make the direction!!
            var length = 80;
            var hex = 0xff5722;

            var arrowHelper = new THREE.ArrowHelper(direction, origin, length, hex);
            scene.add(arrowHelper);

            var gui = new dat.GUI({
                autoPlace: false
            });

            var customContainer = document.getElementById('my-gui-container');
            customContainer.appendChild(gui.domElement);

            var frameIndexControllerDirectionI = gui.add(stackView, 'directionI', -1, 1);
            var frameIndexControllerDirectionJ = gui.add(stackView, 'directionJ', -1, 1);
            var frameIndexControllerDirectionK = gui.add(stackView, 'directionK', -1, 1);
            var frameIndexControllerOriginI = gui.add(stackView, 'originI', 0, 896).step(1);
            var frameIndexControllerOriginJ = gui.add(stackView, 'originJ', 0, 896).step(1);
            var frameIndexControllerOriginK = gui.add(stackView, 'originK', 0, 60).step(1);

            frameIndexControllerDirectionI.onChange(function(value) {
                var direction = new THREE.Vector3(value, stackView.directionJ, stackView.directionK);
                direction.normalize();
                var origin = new THREE.Vector3(stackView.originI, stackView.originJ, stackView.originK);

                stackView.directionI = value;

                stackView.threejssliceUpdate(origin, direction);

                arrowHelper.setDirection(direction);
            });

            frameIndexControllerDirectionJ.onChange(function(value) {
                var direction = new THREE.Vector3(stackView.directionI, value, stackView.directionK);
                direction.normalize();
                var origin = new THREE.Vector3(stackView.originI, stackView.originJ, stackView.originK);

                stackView.directionJ = value;

                stackView.threejssliceUpdate(origin, direction);

                arrowHelper.setDirection(direction);
            });

            frameIndexControllerDirectionK.onChange(function(value) {
                var direction = new THREE.Vector3(stackView.directionI, stackView.directionJ, value);
                direction.normalize();
                var origin = new THREE.Vector3(stackView.originI, stackView.originJ, stackView.originK);

                stackView.directionK = value;

                stackView.threejssliceUpdate(origin, direction);

                arrowHelper.setDirection(direction);
            });

            frameIndexControllerOriginI.onChange(function(value) {
                var direction = new THREE.Vector3(stackView.directionI, stackView.directionJ, stackView.directionK);
                direction.normalize();
                var origin = new THREE.Vector3(value, stackView.originJ, stackView.originK);

                stackView.originI = value;

                stackView.threejssliceUpdate(origin, direction);

                scene.remove(arrowHelper);
                arrowHelper = new THREE.ArrowHelper(direction, origin, length, hex);
                scene.add(arrowHelper);
            });

            frameIndexControllerOriginJ.onChange(function(value) {
                var direction = new THREE.Vector3(stackView.directionI, stackView.directionJ, stackView.directionK);
                direction.normalize();
                var origin = new THREE.Vector3(stackView.originI, value, stackView.originK);

                stackView.originJ = value;

                stackView.threejssliceUpdate(origin, direction);

                scene.remove(arrowHelper);
                arrowHelper = new THREE.ArrowHelper(direction, origin, length, hex);
                scene.add(arrowHelper);
            });

            frameIndexControllerOriginK.onChange(function(value) {
                var direction = new THREE.Vector3(stackView.directionI, stackView.directionJ, stackView.directionK);
                direction.normalize();
                var origin = new THREE.Vector3(stackView.originI, stackView.originJ, value);

                stackView.originK = value;

                stackView.threejssliceUpdate(origin, direction);

                scene.remove(arrowHelper);
                arrowHelper = new THREE.ArrowHelper(direction, origin, length, hex);
                scene.add(arrowHelper);
            });

            // IJK TO LPS SWITCH



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
