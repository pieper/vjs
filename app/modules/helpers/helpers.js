'use strict';

var VJS = VJS || {};

/**
 * helpers namespace
 * @namespace helpers
 * @memberOf VJS
 * @public
 */
VJS.helpers = VJS.helpers || {};



/*** Imports ***/

VJS.helpers.frame = VJS.helpers.frame || require('./helpers.slice');



/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS.helpers;
}