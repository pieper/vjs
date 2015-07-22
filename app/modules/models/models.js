'use strict';

var VJS = VJS || {};

/**
 * models namespace
 * @namespace models
 * @memberOf VJS
 * @public
 */
VJS.models = VJS.models || {};



/*** Imports ***/

VJS.models.frame = VJS.models.frame || require('./models.frame');
VJS.models.stack = VJS.models.stack || require('./models.stack');
VJS.models.series = VJS.models.series || require('./models.series');



/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS.models;
}