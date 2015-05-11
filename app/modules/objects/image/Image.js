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
    this.id = -1; // Always good to have an ID
    this.concatenationID = -1; // concatenation ID -> (0020, 9161)
    this.stack = [];
};
