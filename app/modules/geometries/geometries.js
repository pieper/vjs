'use strict';

var VJS = VJS || {};

/**
 * geometries namespace
 * @namespace geometries
 * @memberOf VJS
 * @public
 */
VJS.geometries = VJS.geometries || {};

/*** Imports ***/
VJS.geometries.slice = VJS.geometries.slice || require('./geometries.slice');

/*** Exports ***/
var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS.geometries;
}