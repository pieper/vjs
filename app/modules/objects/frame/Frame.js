'use strict';

var VJS = VJS || {};

/**
 * frame namespace
 * @namespace frame
 * @memberOf VJS
 */
VJS.frame = VJS.frame || {};

/**
 * Base frame model.
 *
 * @constructor
 * @class
 * @memberOf VJS.frame
 */
VJS.frame.model = function() {
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
     * @type {number}
     */
    this._temporalPositionIndex = null;
    /**
     * @member
     * @type {number}
     */
    this._inStackPosition = -1;
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
    /**
     * @member
     * @type {Array}
     */
    this._pixelData = null;
};

VJS.frame.model.prototype.constructor = VJS.frame.model;
