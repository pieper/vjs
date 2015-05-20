'use strict';

var VJS = VJS || {};

var Stats = Stats || {};
// standard global variables
var controls, renderer, stats, scene, camera, bbox, bboxMin, bboxMax, nbSpheres, spheres, directions, steps;

// FUNCTIONS
function init() {

    nbSpheres = 13;

    // this function is executed on each animation frame
    function animate() {
        // update spheres positions
        if (spheres && spheres.length === nbSpheres) {


            for (var i = 0; i < nbSpheres; i++) {

                if (spheres[i].position.x >= bbox[1].x) {
                    directions[i].x = -1;
                } else if (spheres[i].position.x <= bbox[0].x) {
                    directions[i].x = 1;
                }

                if (spheres[i].position.y >= bbox[1].y) {
                    directions[i].y = -1;
                } else if (spheres[i].position.y <= bbox[0].y) {
                    directions[i].y = 1;
                }

                if (spheres[i].position.z >= bbox[1].z) {
                    directions[i].z = -1;
                } else if (spheres[i].position.z <= bbox[0].z) {
                    directions[i].z = 1;
                }

                spheres[i].position.x += directions[i].x * steps[i].x;
                spheres[i].position.y += directions[i].y * steps[i].y;
                spheres[i].position.z += directions[i].z * steps[i].z;

            }
        }

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

    var files = ['../../data/dcm/fruit'];

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
            // prepare the texture!
            var stack = message[0]._stack[0];
            stack.prepare();

            // make a box!
            var geometry = new THREE.BoxGeometry(896, 896, 60);
            geometry.applyMatrix(new THREE.Matrix4().makeTranslation(448, 448, 30));
            geometry.applyMatrix(stack._ijk2LPS);
            var material = new THREE.MeshBasicMaterial({
                wireframe: true,
                color: 0x61F2F3
            });
            var cube = new THREE.Mesh(geometry, material);
            scene.add(cube);

            // create 16 luminance textures!
            var textures = [];
            for (var m = 0; m < stack._nbTextures; m++) {
                var tex = new THREE.DataTexture(stack._rawData[m], stack._textureSize, stack._textureSize, THREE.LuminanceFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
                tex.needsUpdate = true;
                textures.push(tex);
            }

            var dataShader = VJS.shaders.data;
            var uniforms = dataShader.parameters.uniforms;
            uniforms.uTextureSize.value = stack._textureSize; //this._sliceCore._volumeCore._textureSize;
            // array of 16 textures
            uniforms.uTextureContainer.value = textures;
            // texture dimensions
            uniforms.uDataDimensions.value = new THREE.Vector3(stack._columns, stack._rows, stack._nbFrames); //[stack._columns, stack._rows, stack._nbFrames];
            // world to model
            uniforms.uWorldToData.value = stack._lps2IJK; //new THREE.Matrix4().makeTranslation(448, 448, 30); //new THREE.Matrix4(); //stack._lps2IJK;


            var sliceMaterial = new THREE.ShaderMaterial({
                // 'wireframe': true,
                'side': THREE.DoubleSide,
                'transparency': true,
                'uniforms': uniforms,
                'vertexShader': dataShader.parameters.vertexShader,
                'fragmentShader': dataShader.parameters.fragmentShader,
            });

            bboxMax = new THREE.Vector3(896, 896, 60).applyMatrix4(stack._ijk2LPS);
            bboxMin = new THREE.Vector3(0, 0, 0).applyMatrix4(stack._ijk2LPS);
            bbox = [
                new THREE.Vector3(Math.min(bboxMin.x, bboxMax.x), Math.min(bboxMin.y, bboxMax.y), Math.min(bboxMin.z, bboxMax.z)),
                new THREE.Vector3(Math.max(bboxMin.x, bboxMax.x), Math.max(bboxMin.y, bboxMax.y), Math.max(bboxMin.z, bboxMax.z))
            ];

            spheres = [];
            directions = [];
            steps = [];
            for (var i = 0; i < nbSpheres; i++) {
                // make some spheres!
                var direction = new THREE.Vector3(Math.random() < 0.5 ? -1 : 1, Math.random() < 0.5 ? -1 : 1, Math.random() < 0.5 ? -1 : 1);
                var step = new THREE.Vector3(Math.random(), Math.random(), Math.random());
                var radius = Math.floor((Math.random() * 30) + 1);
                var sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
                var sphere = new THREE.Mesh(sphereGeometry, sliceMaterial);
                sphere.position.x = bbox[0].x + (bbox[1].x - bbox[0].x) / 2;
                sphere.position.y = bbox[0].y + (bbox[1].y - bbox[0].y) / 2;
                sphere.position.z = bbox[0].z + (bbox[1].z - bbox[0].z) / 2;

                spheres.push(sphere);
                directions.push(direction);
                steps.push(step);

                scene.add(sphere);
            }

        })
        .catch(function(error) {
            window.console.log(error);
        });
};
