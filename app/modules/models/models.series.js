'use strict';

var VJS = VJS || {};
VJS.models = VJS.models || {};

/**
 * Define the series object here
 *
 * @constructor
 * @class
 * @memberOf VJS.models
 * @public
 */
VJS.models.series = function() {
    this._id = -1; // Always good to have an ID
    this._concatenationUID = -1;
    this._seriesInstanceUID = -1;
    this._seriesNumber = -1;
    this._dimensionIndexSequence = [];

    // should probably not be there
    this._rows = 0;
    this._columns = 0;
    this._photometricInterpretation = '';

    this._numberOfFrames = 0;
    this._numberOfChannels = 1;
    this._instanceNumber = 0;

    this._stack = [];
};

// it is a helper!
VJS.models.series.prototype.merge = function(series) {
    // try to merge seriesHelper with current series.
    // same series if same Series UID?
    // could use concatenation if available, to already know if series is complete!
    var sameSeriesUID = false;
    if (this._seriesInstanceUID === series._seriesInstanceUID) {
        window.console.log('stacks belong to same series!');
        sameSeriesUID = true;

        // Make sure series information is consisent?
        // re-compute it?
        var stack = series._stack;
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
module.exports = VJS.models.series;