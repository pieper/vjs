'use strict';

var VJS = VJS || {};
VJS.extras = VJS.extras || {};

/**
 * @constructor
 * @class
 * @memberOf VJS.extras
 * @public
*/
VJS.extras.lut = VJS.extras.lut || {};

VJS.extras.lut.luts = function() {
  // we have 'none' and 'grayscale'
  // in order to compare it
  // it should be the same result
  return [
  'none',
  'spectrum',
  'hotandcold',
  'gold',
  'red',
  'green',
  'blue',
  'grayscale'
  ];
};

VJS.extras.lut.toIRGB = function(rawLUT) {
  var i = new Array(16);
  var r = new Array(16);
  var g = new Array(16);
  var b = new Array(16);
  for (var l = 0; l < rawLUT.length; l++) {
    i[l] = rawLUT[l][0];
    r[l] = rawLUT[l][1];
    g[l] = rawLUT[l][2];
    b[l] = rawLUT[l][3];
  }

  return [i, r, g, b];
};

VJS.extras.lut.spectrum = function() {
  return {
    label: 'Spectrum',
    data: [[0, 0, 0, 0], [0.1, 0, 0, 1], [0.33, 0, 1, 1], [0.5, 0, 1, 0], [0.66, 1, 1, 0], [0.9, 1, 0, 0], [1, 1, 1, 1]]
  };
};

VJS.extras.lut.hotandcold = function() {
  return {
    label: 'Hot and cold',
    data: [[0, 0, 0, 1], [0.15, 0, 1, 1], [0.3, 0, 1, 0], [0.45, 0, 0, 0], [0.5, 0, 0, 0], [0.55, 0, 0, 0], [0.7, 1, 1, 0], [0.85, 1, 0, 0], [1, 1, 1, 1]]
  };
};

VJS.extras.lut.gold = function() {
  return {
    label: 'Gold',
    data: [[0, 0, 0, 0], [0.13, 0.19, 0.03, 0], [0.25, 0.39, 0.12, 0], [0.38, 0.59, 0.26, 0], [0.50, 0.80, 0.46, 0.08], [0.63, 0.99, 0.71, 0.21], [0.75, 0.99, 0.88, 0.34], [0.88, 0.99, 0.99, 0.48], [1, 0.90, 0.95, 0.61]]
  };
};

VJS.extras.lut.red = function() {
  return {
    label: 'Red',
    data: [[0, 0.75, 0, 0], [0.5, 1, 0.5, 0], [0.95, 1, 1, 0], [1, 1, 1, 1]]
  };
};

VJS.extras.lut.green = function() {
  return {
    label: 'Green',
    data: [[0, 0, 0.75, 0], [0.5, 0.5, 1, 0], [0.95, 1, 1, 0], [1, 1, 1, 1]]
  };
};

VJS.extras.lut.blue = function() {
  return {
    label: 'Blue',
    data: [[0, 0, 0, 1], [0.5, 0, 0.5, 1], [0.95, 0, 1, 1], [1, 1, 1, 1]]
  };
};

VJS.extras.lut.grayscale = function() {
  return {
    label: 'Gray Scale',
    data: [[0, 0, 0, 0], [1, 1, 1, 1]]
  };
};

/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
  module.exports = VJS.extras.lut;
}
