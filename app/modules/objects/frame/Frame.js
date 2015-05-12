'use strict';

var VJS = VJS || {};
/**v
 * @namespace
 */
VJS.frame = VJS.frame || {};

/**
 * Define the model of a frame here
 */
VJS.frame.model = function() {
    this._id = -1;
    this._stackID = -1;
    this._rows = 0;
    this._columns = 0;
    this._temporalPositionIndex = null;
    this._inStackPosition = -1;
    this._dimensionIndexValues = [];
    this._imagePositionPatient = {
        'x': 0,
        'y': 0,
        'z': 0
    };
    this._imageOrientationPatient = {
        'row': {
            'x': 0,
            'y': 0,
            'z': 0
        },
        'column': {
            'x': 0,
            'y': 0,
            'z': 0
        }
    };

    this._sliceThickness = 1;
    this._pixelSpacing = {
        'row': 1,
        'column': 1
    };

    this._pixelData = null;
};
