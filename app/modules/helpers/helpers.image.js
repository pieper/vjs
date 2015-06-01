'use strict';

var VJS = VJS || {};

/**
 * helpers namespace
 * @namespace helpers
 * @memberOf VJS
 * @public
 */
VJS.helpers = VJS.helpers || {};

//
// https://en.wikipedia.org/wiki/Immediately-invoked_function_expression
VJS.helpers.image = function() {

  THREE.Object3D.call(this);

  // ...
  this._stacks = [];

};

VJS.helpers.image.prototype = Object.create(THREE.Object3D.prototype);

VJS.helpers.image.prototype.constructor = VJS.helpers.image;

VJS.helpers.image.prototype.getStack = function(stackIndex) {
  return stackIndex;
};
