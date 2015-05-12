'use strict';

var VJS = VJS || {};
/**
 * @namespace
 */
VJS.image = VJS.image || {};

/**
 * Define the structure of an image here
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
