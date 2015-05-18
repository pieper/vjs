'use strict';

var VJS = VJS || {};

var Stats = Stats || {};
// standard global variables
var controls, renderer, stats, scene, camera, sphere0, sphere1, sphere2;

// FUNCTIONS
function init() {

    // this function is executed on each animation frame
    function animate() {
        // update spheres positions
        var time = Date.now() * 0.0005;
        if (sphere0 && sphere1 && sphere2) {
            
            sphere0.position.x = Math.sin(time * 0.3) * 500;
            sphere0.position.y = Math.sin(time * 0.6) * 500;
            sphere0.position.z = Math.sin(time * 0.9) * 50;

            sphere1.position.x = Math.sin(time * 0.9) * 500;
            sphere1.position.y = Math.sin(time * 0.3) * 500;
            sphere1.position.z = Math.sin(time * 0.6) * 50;

            sphere2.position.x = Math.sin(time * 0.6) * 500;
            sphere2.position.y = Math.sin(time * 0.9) * 500;
            sphere2.position.z = Math.sin(time * 0.3) * 50;
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

            // make a box!
            var geometry = new THREE.BoxGeometry(896, 896, 60);
            //geometry.applyMatrix(new THREE.Matrix4().makeTranslation(448, 448, 30));
            var material = new THREE.MeshBasicMaterial({
                wireframe: true,
                color: 0x61F2F3
            });
            var cube = new THREE.Mesh(geometry, material);
            scene.add(cube);

            // prepare the texture!
            var stack = message[0]._stack[0];
            stack.prepare();

            var sliceShader = VJS.shaders.slice;
            var uniforms = sliceShader.parameters.uniforms;
            uniforms.uTextureSize.value = stack._textureSize; //this._sliceCore._volumeCore._textureSize;

            // create 16 luminance textures!
            var textures = [];
            for (var m = 0; m < stack._nbTextures; m++) {
                var tex = new THREE.DataTexture(stack._rawData[m], stack._textureSize, stack._textureSize, THREE.LuminanceFormat, THREE.UnsignedByteType, THREE.UVMapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.NearestFilter, THREE.NearestFilter);
                tex.needsUpdate = true;
                textures.push(tex);
            }

            // array of 16 textures
            uniforms.uTextureFrames.value = textures;
            // texture dimensions
            uniforms.uIJKDims.value = new THREE.Vector3(stack._columns, stack._rows, stack._nbFrames); //[stack._columns, stack._rows, stack._nbFrames];
            // world to model
            uniforms.uLPSToIJK.value = new THREE.Matrix4().makeTranslation(448, 448, 30); //new THREE.Matrix4(); //stack._lps2IJK;

            window.console.log(uniforms);

            var sliceMaterial = new THREE.ShaderMaterial({
                // 'wireframe': true,
                'side': THREE.DoubleSide,
                'transparency': true,
                'uniforms': uniforms,
                'vertexShader': sliceShader.parameters.vertexShader,
                'fragmentShader': sliceShader.parameters.fragmentShader,
            });


            // make some spheres!
            var sphereGeometry0 = new THREE.SphereGeometry(100, 32, 32);
            //sphereGeometry0.applyMatrix(new THREE.Matrix4().makeTranslation(448, 448, 30));
            sphere0 = new THREE.Mesh(sphereGeometry0, sliceMaterial);
            scene.add(sphere0);

            var sphereGeometry1 = new THREE.SphereGeometry(100, 32, 32);
            //sphereGeometry1.applyMatrix(new THREE.Matrix4().makeTranslation(60, 60, 30));
            sphere1 = new THREE.Mesh(sphereGeometry1, sliceMaterial);
            scene.add(sphere1);

            var sphereGeometry2 = new THREE.SphereGeometry(100, 32, 32);
            //sphereGeometry2.applyMatrix(new THREE.Matrix4().makeTranslation(836, 836, 30));
            sphere2 = new THREE.Mesh(sphereGeometry2, sliceMaterial);
            scene.add(sphere2);

        })
        .catch(function(error) {
            window.console.log(error);
        });
};
