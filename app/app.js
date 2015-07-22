'use strict';

/**
 * @namespace
 */

var VJS = VJS || {};

/*** Imports ***/

VJS.core = VJS.core || require('./modules/core/core');
VJS.geometries = VJS.geometries || require('./modules/geometries/geometries');
VJS.helpers = VJS.helpers || require('./modules/helpers/helpers');
VJS.loaders = VJS.loaders || require('./modules/loaders/loaders');
VJS.models = VJS.models || require('./modules/models/models');
VJS.parsers = VJS.parsers || require('./modules/parsers/parsers');
VJS.widgets = VJS.widgets || require('./modules/widgets/widgets');


/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS;
}