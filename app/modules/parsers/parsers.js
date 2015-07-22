'use strict';

var VJS = VJS || {};

/**
 * models namespace
 * @namespace parsers
 * @memberOf VJS
 * @public
 */
VJS.parsers = VJS.parsers || {};

/*** Imports ***/
VJS.parsers.dicom = VJS.parsers.dicom || require('./parsers.dicom');

/*** Exports ***/
var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS.parsers;
}