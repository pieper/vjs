'use strict';

var VJS = VJS || {};
VJS.cameras = VJS.cameras || {};

VJS.cameras.camera2d = function(left, right, top, bottom, near, far, position) {
    this._Camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far);
    this._Camera.position.x = position.x;
    this._Camera.position.y = position.y;
    this._Camera.position.z = position.z;

};

VJS.cameras.camera2d.prototype.Orientation = function(orientation) {
    switch (orientation) {
        case 'SAGITTAL':
            this._Camera.position.x = -400;
            this._Camera.position.y = 0;
            this._Camera.position.z = 0;
            this._Camera.up.set(0, 0, 1);
            break;

        case 'CORONAL':
            break;

        case 'AXIAL':
            this._Camera.position.x = 0;
            this._Camera.position.y = 0;
            this._Camera.position.z = -400;
            this._Camera.up.set(0, 1, 0);
            break;

        default:
        // ACQUISITION DIRECTION
            break;

    }

    // update lookat!

};

VJS.cameras.camera2d.prototype.set = function(position, up) {
    this._Camera.position = position;
    this._Camera.up = up;
};

VJS.cameras.camera2d.prototype.GetCamera = function() {
    return this._Camera;
};


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS.cameras.camera2d;
}