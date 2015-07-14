/* globals Stats, dat*/
'use strict';

var vjsSliceGeometry = require('../../modules/geometries/geometries.slice');
var vjsOrbitControl2D = require('../../modules/controls/OrbitControls2D');
var vjsLoaderDicom = require('../../modules/loaders/loaders.dicom');
var vjsShadersData = require('../../modules/shaders/shaders.data');
var glslify = require('glslify');

// standard global variables
var controls, renderer, scene, camera, statsyay;

// FUNCTIONS
function init() {

  // this function is executed on each animation frame
  function animate() {
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
  renderer.setClearColor(0xFFFFFF, 1);

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

  animate();
}

window.onload = function() {

  // init threeJS...
  init();

  // function readSingleFile(evt) {
  //   //Retrieve the first (and only!) File from the FileList object
  //   window.console.log(evt.target.files.length);
  //   var f = evt.target.files[0]; 

  //   if (f) {
  //     var r = new FileReader();
  //     r.onload = function(e) { 
  //       var contents = e.target.result;
  //       alert('Got the file.n' + 'name: ' + f.name + 'n' + 'type: ' + f.type + 'n' + 'size: ' + f.size + ' bytesn' +
  //             'starts with: ' + contents.substr(1, contents.indexOf('n'))
  //       );  
  //     }
  //     r.readAsText(f);
  //   } else { 
  //     alert('Failed to load file');
  //   }
  // }
  // // hook up file input listener
  // document.getElementById('fileinput').addEventListener('change', readSingleFile, false);

  var seriesHelper = [];
  var manager = new THREE.LoadingManager();
  manager.onProgress = function(item, loaded, total) {
    window.console.log('manager progress ----');
    window.console.log(item);
    var fileContainer = document.getElementById(item);
    if (fileContainer) {
      fileContainer.innerHTML = ' ' + item + ' is ready! ' + '(' + loaded + '/' + total + ')';
    }

    if (loaded === total) {
      window.console.log(seriesHelper);
      var mergedHelpers = [seriesHelper[0]];
      // if all files loaded
      for (var i = 0; i < seriesHelper.length; i++) {
        // test image against existing imagess
        for (var j = 0; j < mergedHelpers.length; j++) {
          if (mergedHelpers[j].merge(seriesHelper[i])) {
            // merged successfully
            break;
          } else if (j === mergedHelpers.length - 1) {
            // last merge was not successful
            // this is a new image
            mergedHelpers.push(seriesHelper[i]);
          }
        }
      }

      mergedHelpers[0].prepare();
      scene.add(mergedHelpers[0]);
      var stack = mergedHelpers[0]._series._stack[0];

      var gui = new dat.GUI({
            autoPlace: false
          });

      var customContainer = document.getElementById('my-gui-container');
      customContainer.appendChild(gui.domElement);

      var stackFolder = gui.addFolder('Stack');
      var windowWidthUpdate = stackFolder.add(stack, '_windowWidth', 1, stack._minMax[1]).step(1);
      windowWidthUpdate.onChange(function(value) {
            var windowLevel = stack._windowLevel;
            windowLevel[1] = value;
            mergedHelpers[0]._uniforms.uWindowLevel.value = windowLevel;
          });
      var windowCenterUpdate = stackFolder.add(stack, '_windowCenter', stack._minMax[0], stack._minMax[1]).step(1);
      windowCenterUpdate.onChange(function(value) {
            var windowLevel = stack._windowLevel;
            windowLevel[0] = value;
            mergedHelpers[0]._uniforms.uWindowLevel.value = windowLevel;
          });

      var invertUpdate = stackFolder.add(stack, '_invert', 0, 1).step(1);
      invertUpdate.onChange(function(value) {
            mergedHelpers[0]._uniforms.uInvert.value = value;
          });
      window.console.log(mergedHelpers[0]);
      var frameIndex = stackFolder.add(mergedHelpers[0], '_frameIndex', 0, stack._dimensions.z - 1).step(1);
      frameIndex.onChange(function(value) {
        mergedHelpers[0].updateSliceGeometry();
        mergedHelpers[0].updateBorderGeometry();
      });

      window.console.log(mergedHelpers[0]);
      window.console.log(stack);

      stackFolder.open();
    }
  };

  var filenames = [
      '36444280', '36444294', '36444308', '36444322', '36444336', '36444350',
      '36444364', '36444378', '36444392', '36444406', '36444420', '36444434',
      '36444448', '36444462', '36444476', '36444490', '36444504', '36444518'
      // '36444532', '36746856', '36746870', '36746884', '36746898', '36746912',
      // '36746926', '36746940', '36746954', '36746968', '36746982', '36746996',
      // '36747010', '36747024', '36747043', '36747062', '36747136', '36747150',
      // '36747164', '36747178', '36747192', '36747206', '36747220', '36747234',
      // '36747248', '36747262', '36747276', '36747290', '36747304', '36747318',
      // '36747332', '36747346', '36747360', '36747374', '36747388', '36747402',
      // '36747416', '36747430', '36747444', '36747458', '36747472', '36747486',
      // '36747500', '36747514', '36747528', '36747542', '36747556', '36747570',
      // '36747584', '36747598', '36747612', '36747626', '36747640', '36747654',
      // '36747668', '36747682', '36747696', '36747710', '36747724', '36747738',
      // '36747752', '36747766', '36747780', '36747794', '36747808', '36747822',
      // '36747836', '36747850', '36747864', '36747878', '36747892', '36747906',
      // '36747920', '36747934', '36747948', '36747962', '36747976', '36747990',
      // '36748004', '36748018', '36748032', '36748046', '36748060', '36748074',
      // '36748088', '36748102', '36748116', '36748130', '36748144', '36748158',
      // '36748172', '36748186', '36748200', '36748214', '36748228', '36748242',
      // '36748256', '36748270', '36748284', '36748298', '36748312', '36748326',
      // '36748340', '36748354', '36748368', '36748382', '36748396', '36748410',
      // '36748424', '36748438', '36748452', '36748466', '36748480', '36748494',
      // '36748508', '36748522', '36748578', '36748592', '36748606', '36748620',
      // '36748634', '36748648', '36748662', '36748676', '36748690', '36748704',
      // '36748718', '36748732', '36748746', '36748760', '36748774', '36748788',
      // '36748802', '36748816', '36748830', '36748844', '36748858', '36748872',
      // '36748886', '36748900', '36748914', '36748928', '36748942', '36748956',
      // '36748970', '36748984', '36748998', '36749012', '36749026', '36749040',
      // '36749054', '36749068', '36749082', '36749096', '36749110', '36749124',
      // '36749138', '36749152', '36749166', '36749180', '36749194', '36749208',
      // '36749222', '36749236', '36749250', '36749264', '36749278', '36749292',
      // '36749306', '36749320', '36749334', '36749348', '36749362', '36749376',
      // '36749390', '36749404', '36749418', '36749432', '36749446', '36749460',
      // '36749474', '36749488', '36749502', '36749516', '36749530', '36749544',
      // '36749558', '36749572', '36749586', '36749600', '36749614', '36749628',
      // '36749642', '36749656', '36749670', '36749684', '36749698', '36749712',
      // '36749726', '36749740', '36749754', '36749768', '36749782', '36749796',
      // '36749810', '36749824', '36749838', '36749852', '36749866', '36749880',
      // '36749894', '36749908', '36749922', '36749936', '36749950', '36749964'
  ];

  var files = filenames.map(function(v) {
    return '../../data/dcm/adi/' + v;
  });

  // var files = ['../../data/dcm/fruit.dcm'];

  // window.console.log(files);

  function loadClosure(filename) {
    var loader = new vjsLoaderDicom(manager);
    loader.load(
        filename,
        // on load
            function(imageHelper) {
              // should it just return an image model?
              // add image helper to scene
              seriesHelper.push(imageHelper);
            },
            // progress
            function() {
              window.console.log(filename);
              //onProgressCallback(event, filename);
            },
            // error
            function(message) {
              window.console.log('error: ', message);
            }
        );
  }

  for (var k = 0; k < files.length; k++) {
    loadClosure(files[k]);
  }

};
