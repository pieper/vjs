'use strict';

var VJS = VJS || {};
/**
 * image namespace
 * @namespace image
 * @memberOf VJS
 */
VJS.image = VJS.image || {};

/**
 * Define the model of a image here
 *
 * @constructor
 * @class
 * @memberOf VJS.image
 * @public
 */
VJS.image.model = function() {
    this._id = -1; // Always good to have an ID
    this._concatenationUID = -1;
    this._seriesUID = -1;
    this._seriesNumber = -1;
    this._dimensionIndexSequence = [];

    this._rows = 0;
    this._columns = 0;
    this._photometricInterpretation = '';

    this._numberOfFrames = 0;

    this._stack = [];
};
