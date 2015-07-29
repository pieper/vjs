'use strict';

var VJS = VJS || {};

/**
 * extras namespace
 * @namespace extras
 * @memberOf VJS
 * @public
 */
VJS.extras = VJS.extras || {};

/*** Imports ***/
VJS.extras.lut = VJS.extras.lut || require('./extras.lut');

/*** Exports ***/
var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS.extras;
}