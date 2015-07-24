'use strict';

var VJS = VJS || {};

/**
 * cameras namespace
 * @namespace cameras
 * @memberOf VJS
 * @public
 */
VJS.cameras = VJS.cameras || {};

/*** Imports ***/
VJS.cameras.camera2d = VJS.cameras.camera2d || require('./cameras.camera2d');

/*** Exports ***/
var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS.cameras;
}