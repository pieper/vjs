'use strict';

var VJS = VJS || {};
VJS.models = VJS.models || {};

/**
 * Define the image object here
 *
 * @constructor
 * @class
 * @memberOf VJS.models
 * @public
 */
VJS.models.image = function() {
    this._id = -1; // Always good to have an ID
    this._concatenationUID = -1;
    this._seriesUID = -1;
    this._seriesNumber = -1;
    this._dimensionIndexSequence = [];

    // should probably not be there
    this._rows = 0;
    this._columns = 0;
    this._photometricInterpretation = '';

    this._numberOfFrames = 0;
    this._instanceNumber = 0;

    this._stack = [];
};

VJS.models.image.prototype.merge = function(image) {
    // try to merge imageHelper with current image.
    // same image if same Series UID?
    // could use concatenation if available, to already know if image is complete!
    var sameSeriesUID = false;
    if (this._seriesUID === image._seriesUID) {
        window.console.log('stacks belong to same series!');
        sameSeriesUID = true;

        // Make sure image information is consisent?
        // re-compute it?
        var stack = image._stack;
        // Merge Stacks (N against N)
        // try to match all stack to current stacks, if not add it to stacks list!
        for (var i = 0; i < stack.length; i++) {
            // test stack against existing stack
            for (var j = 0; j < this._stack.length; j++) {
                if (this._stack[j].merge(stack[i])) {
                    // merged successfully
                    window.console.log('stacks merged successfully!');
                    break;
                } else if (j === this._stack.length - 1) {
                    // last merge was not successful
                    // this is a new stack
                    window.console.log('stacks added to the list!');
                    this._stack.push(stack[i]);
                }
            }

        }
    }

    return sameSeriesUID;
};

// export the frame module
module.exports = VJS.models.image;