'use strict';

var VJS = VJS || {};
VJS.widgets = VJS.widgets || {};

/**
 *
 * It is typically used to get information about an image from the mouse cursor.
 *
 * Demo: {@link https://fnndsc.github.io/vjs#widget_pixelProbe}
 *
 * @constructor
 * @class
 * @memberOf VJS.widgets
 * @public
 *
 */
VJS.widgets.pixelProbe = function(image, imageMeshes) {
  // it is an object 3D that we can add to the scene :)
  THREE.Object3D.call(this);

  this.domElement = null;
  this.rasContainer = null;
  this.ijkContainer = null;
  this.valueContainer = null;

  this.imageMeshes = imageMeshes;
  this.image = image;

  this.volumeCore = null;

  this.marks = [];

  this.createDomElement();

  this._worldCoordinate = null;  //LPS
  this._dataCoordinate = null; //IJK
  this._dataValue = null;        //
  this._labelValue = null;       //
};

VJS.widgets.pixelProbe.prototype = Object.create(THREE.Object3D.prototype);
VJS.widgets.pixelProbe.prototype.constructor = VJS.widgets.pixelProbe;

VJS.widgets.pixelProbe.prototype.createDomElement = function() {

  // RAS
  this.rasContainer = document.createElement('div');
  this.rasContainer.setAttribute('id', 'VJSProbeRAS');

  // IJK
  this.ijkContainer = document.createElement('div');
  this.ijkContainer.setAttribute('id', 'VJSProbeIJK');

  // Value
  this.valueContainer = document.createElement('div');
  this.valueContainer.setAttribute('id', 'VJSProbeValue');

  this.domElement = document.createElement('div');
  this.domElement.setAttribute('id', 'VJSProbe');
  this.domElement.appendChild(this.rasContainer);
  this.domElement.appendChild(this.ijkContainer);
  this.domElement.appendChild(this.valueContainer);
};

VJS.widgets.pixelProbe.prototype.computeValues = function() {
  // convert point to IJK
  if (this.image) {
    var worldToData = this.image._stack[0]._lps2IJK;

    var dataCoordinate = new THREE.Vector3().copy(this._worldCoordinate).applyMatrix4(worldToData);
    var temp = dataCoordinate.clone();
    
    // same rounding in the shaders
    dataCoordinate.x = Math.floor(dataCoordinate.x + 0.5);
    dataCoordinate.y = Math.floor(dataCoordinate.y + 0.5);
    dataCoordinate.z = Math.floor(dataCoordinate.z + 0.5);
    this._dataCoordinate = dataCoordinate;

    if (dataCoordinate.x >= 0 &&
      dataCoordinate.y >= 0 &&
      dataCoordinate.z >= 0) {
      var textureSize = this.image._stack[0]._textureSize;
      var rows = this.image._stack[0]._rows;
      var columns = this.image._stack[0]._columns;

      var index = this._dataCoordinate.x + columns * this._dataCoordinate.y + rows * columns * this._dataCoordinate.z;

      var textureIndex = Math.floor(index / (textureSize * textureSize));
      var inTextureIndex = index % (textureSize * textureSize);

      this._dataValue = this.image._stack[0]._rawData[textureIndex][inTextureIndex];
    } else {
      window.console.log('something funny happening in compute value');
      window.console.log(dataCoordinate);
      window.console.log(temp);
    }
  }
};

VJS.widgets.pixelProbe.prototype.updateUI = function(mouse) {
  var rasContent = this._worldCoordinate.x.toFixed(2) + ' : ' + this._worldCoordinate.y.toFixed(2) + ' : ' + this._worldCoordinate.z.toFixed(2);
  this.rasContainer.innerHTML = 'LPS: ' + rasContent;

  var ijkContent = this._dataCoordinate.x + ' : ' + this._dataCoordinate.y + ' : ' + this._dataCoordinate.z;
  this.ijkContainer.innerHTML = 'IJK: ' + ijkContent;

  var valueContent = this._dataValue;
  this.valueContainer.innerHTML = 'Value: ' + valueContent;

  // position of the div...
  // need a mode to track the mouse
  document.getElementById('VJSProbe').style.display = 'block';
  document.getElementById('VJSProbe').style.top = mouse.clientY + 10;
  document.getElementById('VJSProbe').style.left = mouse.clientX + 10;
  
};

VJS.widgets.pixelProbe.prototype.update = function(raycaster, mouse, camera, canvas) {

  if (!this.imageMeshes) {
    return;
  }

  this.updateMarkDom(raycaster, mouse, camera, canvas);

  // calculate image intersecting the picking ray
  var intersects = raycaster.intersectObjects(this.imageMeshes);

  for (var intersect in intersects) {
    var worldCoordinates = new THREE.Vector3().copy(intersects[intersect].point);
    
    // if we intersect an image with a ShaderMaterial
    // TODO: review that
    if (intersects[intersect].object.material.type === 'ShaderMaterial') {
      this._worldCoordinate = worldCoordinates;
      // window.console.log(this._worldCoordinate);
      this.computeValues();
      this.updateUI(mouse);
      return;
    }
  }

  // hide UI if not intersecting the planne
  this.hideUI();
};

VJS.widgets.pixelProbe.prototype.hideUI = function() {
  document.getElementById('VJSProbe').style.display = 'none';
};

VJS.widgets.pixelProbe.prototype.mark = function(raycaster, mouse) {
  // calculate image intersecting against itself (ideally N spheres)
  // no all good yet, because we can click on Shader Materail and still
  // intersect another voxel if looking at plane from the side
  // do we intersect a cube of the probe (in front of the plane not detected yet...)
  var intersects = raycaster.intersectObjects(this.children);
  var worldCoordinates = null;
  // Look for a pixelProbeMark
  // for (var intersect in intersects) {
  //   worldCoordinates = new THREE.Vector3().copy(intersects[intersect].point);
    
  //   // if on a mark, do not do anything
  //   if (intersects[intersect].object.name === 'pixelProbeMark') {
  //     window.console.log('intersect pixelProbeMark!');

  //     return null;
  //   }
  // }

  // Look for intersection against image
  window.console.log(this);
  intersects = raycaster.intersectObjects(this.imageMeshes);
  for (var intersect2 in intersects) {
    worldCoordinates = new THREE.Vector3().copy(intersects[intersect2].point);

    // might be better to re-loop
    // if we intersect an image with a ShaderMaterial
    // TODO: review that
    if (intersects[intersect2].object.material.type === 'ShaderMaterial') {
      window.console.log('intersect shader material!');
      this._worldCoordinate = worldCoordinates;
      this.computeValues();

      // make sure this IJK mark is not already shown...
      for(var i=0; i<this.marks.length; i++){
        if(this.marks[i].ijk.x === this._dataCoordinate.x &&
          this.marks[i].ijk.y === this._dataCoordinate.y &&
          this.marks[i].ijk.z === this._dataCoordinate.z){
          return;
        }
      }

      // create the geometry for it!
      // var sphereGeometry = new THREE.SphereGeometry(1);
      // var material = new THREE.MeshBasicMaterial({
      //     // not selected: amber? #FFC107
      //     // orange? #FF9800
      //     // selected: deep orange? #FF5722
      //     color: 0xFF5722
      //   });
      // var sphere = new THREE.Mesh(sphereGeometry, material);
      // sphere.applyMatrix(new THREE.Matrix4().makeTranslation(
      //   worldCoordinates.x, worldCoordinates.y, worldCoordinates.z));
      
      // position against World Voxel Center! Not against the mouse!!
      var dataToWorld = this.image._stack[0]._ijk2LPS;
      var worldCenterCoordinate = new THREE.Vector3()
      .copy(this._dataCoordinate)
      .applyMatrix4(dataToWorld);

      var voxDataCoord = this._dataCoordinate.clone();

      var voxelGeometry = new THREE.BoxGeometry(1, 1, 1);
      voxelGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(
        this._dataCoordinate.x,
        this._dataCoordinate.y,
        this._dataCoordinate.z));
      voxelGeometry.applyMatrix(this.image._stack[0]._ijk2LPS);
      var voxelMaterial = new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0xFFC107
      });
      var voxel = new THREE.Mesh(voxelGeometry, voxelMaterial);
      // move to world space!
      // voxel.applyMatrix(new THREE.Matrix4().makeTranslation(
      //   worldCoordinates.x, worldCoordinates.y, worldCoordinates.z));
      voxel.name = 'pixelProbeMark';
      this.add(voxel);

      // store mark
      var mark = {id: voxel.id, position: worldCenterCoordinate, ijk: voxDataCoord};
      this.marks.push(mark);
      window.console.log(this.marks);

      var domElement = this.markDom(mark, mouse);

      return domElement;
    }
  }
};

// do not need mouse in theory...
VJS.widgets.pixelProbe.prototype.markDom = function(mark, mouse) {

  // that could be a web-component!
  // RAS
  var rasContainer = document.createElement('div');
  rasContainer.setAttribute('class', 'VJSProbeRAS');

  var rasContent = this._worldCoordinate.x.toFixed(2) + ' : ' + this._worldCoordinate.y.toFixed(2) + ' : ' + this._worldCoordinate.z.toFixed(2);
  rasContainer.innerHTML = 'LPS: ' + rasContent;

  // IJK
  var ijkContainer = document.createElement('div');
  ijkContainer.setAttribute('class', 'VJSProbeIJK');

  var ijkContent = this._dataCoordinate.x + ' : ' + this._dataCoordinate.y + ' : ' + this._dataCoordinate.z;
  ijkContainer.innerHTML = 'IJK: ' + ijkContent;

  // Value
  var valueContainer = document.createElement('div');
  valueContainer.setAttribute('class', 'VJSProbeValue');

  var valueContent = this._dataValue;
  valueContainer.innerHTML = 'Value: ' + valueContent;

  // Package everything
  var domElement = document.createElement('div');
  domElement.setAttribute('id', 'mark' + mark.id);
  domElement.setAttribute('class', 'mark');
  domElement.appendChild(rasContainer);
  domElement.appendChild(ijkContainer);
  domElement.appendChild(valueContainer);

  domElement.style.display = 'block';
  domElement.style.top = mouse.clientY + 10;
  domElement.style.left = mouse.clientX + 10;

  return domElement;
};

// do not need mouse in theory...
VJS.widgets.pixelProbe.prototype.updateMarkDom = function(raycaster, mouse, camera, canvas) {

  for (var i = 0; i < this.marks.length; i++) {
    // find element in DOM!
    // world coordinates to screen
    var screenCoordinates = this.marks[i].position.clone();
    screenCoordinates.project(camera);

    screenCoordinates.x = Math.round((screenCoordinates.x + 1) * canvas.offsetWidth  / 2);
    screenCoordinates.y = Math.round((-screenCoordinates.y + 1) * canvas.offsetHeight / 2);
    screenCoordinates.z = 0;

    // update div position
    // window.console.log(document.getElementById('mark' + this.marks[i].id));
    document.getElementById('mark' + this.marks[i].id).style.top = screenCoordinates.y + 10;
    document.getElementById('mark' + this.marks[i].id).style.left = screenCoordinates.x + 10;

  }
  
};
