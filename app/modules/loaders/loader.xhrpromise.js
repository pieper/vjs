'use strict';

var VJS = VJS || {};

/**
 * loader namespace
 * @namespace loader
 * @memberOf VJS
 * @public
 */

VJS.loader = VJS.loader || {};

VJS.loader.xhrpromise = function(manager) {

  this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;

};

VJS.loader.xhrpromise.prototype = {

  constructor: VJS.loader.xhrpromise,

  load: function(url, onProgress) {

    var scope = this;

    return new Promise(function(resolve, reject) {

      var request = new XMLHttpRequest();
      request.open('GET', url, true);

      request.onload = function(event) {
        scope.manager.itemEnd(url);

        // This is called even on 404 etc
        // so check the status
        if (request.status === 200) {
          // Resolve the promise with the response text
          resolve(request.response);
        } else {
          // Otherwise reject with the status text
          // which will hopefully be a meaningful error
          reject(Error(request.statusText + ' ' + event));
        }
      };

      if (onProgress !== undefined) {
        request.onprogress = function(event) {
          onProgress(event, url);
        };
      }

      request.onerror = function(event) {
        reject(Error('Network Error: ' + event));
      };

      if (scope.crossOrigin !== undefined) {
        request.crossOrigin = scope.crossOrigin;
      }
      if (scope.responseType !== undefined) {
        request.responseType = scope.responseType;
      }

      request.send();

      scope.manager.itemStart(url);

    });

  },

  setResponseType: function(value) {

    this.responseType = value;

  },

  setCrossOrigin: function(value) {

    this.crossOrigin = value;

  }

};
