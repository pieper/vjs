'use strict';

/**
 * @namespace
 */

var VJS = VJS || {};

/*** Imports ***/

VJS.cameras = VJS.cameras || require('./cameras/cameras');
VJS.core = VJS.core || require('./core/core');
VJS.geometries = VJS.geometries || require('./geometries/geometries');
VJS.helpers = VJS.helpers || require('./helpers/helpers');
VJS.loaders = VJS.loaders || require('./loaders/loaders');
VJS.models = VJS.models || require('./models/models');
VJS.parsers = VJS.parsers || require('./parsers/parsers');
VJS.widgets = VJS.widgets || require('./widgets/widgets');


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS;
}