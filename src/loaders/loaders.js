'use strict';

var VJS = VJS || {};

/**
 * loaders namespace
 * @namespace loaders
 * @memberOf VJS
 * @public
 */
VJS.loaders = VJS.loaders || {};

/*** Imports ***/
// DAIKON OVER KILL?
// || ((typeof require !== 'undefined') ? require('./tag.js') : null);
VJS.loaders.dicom = VJS.loaders.dicom || require('./loaders.dicom');
VJS.loaders.trk = VJS.loaders.trk || require('./loaders.trk');

/*** Exports ***/
var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS.loaders;
}