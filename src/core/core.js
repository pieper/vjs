'use strict';

var VJS = VJS || {};

/**
 * core namespace
 * @namespace core
 * @memberOf VJS
 * @public
 */
VJS.core = VJS.core || {};

/*** Imports ***/
VJS.core.intersections = VJS.core.intersections || require('./core.intersections');

/*** Exports ***/
var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS.core;
}