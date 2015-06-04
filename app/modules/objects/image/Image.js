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


VJS.image.model.prototype.merge = function(image){
  // try to merge imageHelper with current image.
  // same image if same Series UID?
  var sameSeriesUID = false;
  if(this._seriesUID === image._seriesUID){
    sameSeriesUID = true;

    // Make sure image information is consisent?
    // re-compute it?

    // Merge Stacks (N against N)
    // try to match all stack to current stacks, if not add it to stacks list!
  }
  
  return sameSeriesUID;
};