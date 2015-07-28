'use strict';

var VJS = VJS || {};
VJS.models = VJS.models || {};

/**
 * Base frame object.
 *
 * @constructor
 * @class
 * @memberOf VJS.models
 */
VJS.models.frame = function() {
    /**
     * @member
     * @type {string}
     */
    this._id = '-1';
    /**
     * @member
     * @type {number}
     */
    this._stackID = -1;
    /**
     * @member
     * @type {number}
     */
    this._rows = 0;
    /**
     * @member
     * @type {number}
     */
    this._columns = 0;
    /**
     * @member
     * @type {Array.number}
     */
    this._dimensionIndexValues = [];
    /**
     * @member
     * @type {Object}
     * @property {number} x
     * @property {number} y
     * @property {number} z
     */
    this._imagePositionPatient = {
        'x': 0,
        'y': 0,
        'z': 0
    };
    /**
     * @member
     * @type {Object}
     * @property {Object} row
     * @property {number} row.x
     * @property {number} row.y
     * @property {number} row.z
     * @property {Object} column
     * @property {number} column.x
     * @property {number} column.y
     * @property {number} column.z
     */
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
    /**
     * @member
     * @type {number}
     */
    this._sliceThickness = 1;
    /**
     * @member
     * @type {Object}
     * @property {number} row
     * @property {number} column
     */
    this._pixelSpacing = {
        'row': 1,
        'column': 1
    };
    this._spacingBetweenSlices = null;
    /**
     * @member
     * @type {Array}
     */
    this._pixelData = null;

    this._instanceNumber = null;
    this._windowCenter = null;
    this._windowWidth = null;

    this._minMax = null;
};

VJS.models.frame.prototype.constructor = VJS.models.frame;



/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
    module.exports = VJS.models.frame;
}
