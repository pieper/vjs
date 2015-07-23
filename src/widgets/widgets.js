'use strict';

var VJS = VJS || {};

/**
 * models namespace
 * @namespace widgets
 * @memberOf VJS
 * @public
 */
VJS.widgets = VJS.widgets || {};

/*** Imports ***/
VJS.widgets.orientation = VJS.widgets.orientation || require('./widgets.orientation');
VJS.widgets.pixelProbe = VJS.widgets.pixelProbe || require('./widgets.pixelProbe');
VJS.widgets.squareProbe = VJS.widgets.squareProbe || require('./widgets.squareProbe');

/*** Exports ***/
var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS.widgets;
}