'use strict';

var VJS = VJS || {};

/**
 * geometry namespace
 * @namespace geometry
 * @memberOf VJS
 * @public
 */
VJS.geometries = VJS.geometries || {};

/**
 *
 * It is typically used for creating an irregular 3D planar shape given a box and the cut-plane.
 *
 * Demo: {@link https://fnndsc.github.io/vjs#geometry_slice}
 *
 * @constructor
 * @class
 * @memberOf VJS.geometries
 * @public
 *
 * @param {THREE.Vector3} halfDimensions - Half-dimensions of the box to be sliced.
 * @param {THREE.Vector3} center - Center of the box to be sliced.
 * @param {THREE.Vector3<THREE.Vector3>} orientation - Orientation of the box to be sliced. (might not be necessary..?)
 * @param {THREE.Vector3} position - Position of the cutting plane.
 * @param {THREE.Vector3} direction - Cross direction of the cutting plane.
 *
 * @example
 * // Define box to be sliced
 * var halfDimensions = new THREE.Vector(123, 45, 67);
 * var center = new THREE.Vector3(0, 0, 0);
 * var orientation = new THREE.Vector3(
 *   new THREE.Vector3(1, 0, 0),
 *   new THREE.Vector3(0, 1, 0),
 *   new THREE.Vector3(0, 0, 1)
 * );
 *
 * // Define slice plane
 * var position = center.clone();
 * var direction = new THREE.Vector3(-0.2, 0.5, 0.3);
 *
 * // Create the slice geometry & materials
 * var sliceGeometry = new VJS.geometries.slice(halfDimensions, center, orientation, position, direction);
 * var sliceMaterial = new THREE.MeshBasicMaterial({
 *   'side': THREE.DoubleSide,
 *   'color': 0xFF5722
 * });
 *
 *  // Create mesh and add it to the scene
 *  var slice = new THREE.Mesh(sliceGeometry, sliceMaterial);
 *  scene.add(slice);
 */
VJS.geometries.slice = function(halfDimensions, center, orientation, position, direction) {

  //
  // prepare data for the shape!
  //
  var obb = {
    'halfDimensions': halfDimensions,
    'center': center,
    'orientation': orientation,
    'toOBBSpace': new THREE.Matrix4(), // not necessary
    'toOBBSpaceInvert': new THREE.Matrix4() // not necessary
  };

  var plane = {
    'position': position,
    'direction': direction
  };

  // BOOM!
  var intersections = VJS.intersections.obbPlane(obb, plane);

  if (intersections.length < 3) {
    window.console.log('WARNING: Less than 3 intersections between OBB and Plane.');
    window.console.log('OBB');
    window.console.log(obb);
    window.console.log('Plane');
    window.console.log(plane);
    window.console.log('exiting...');
  }

  var centerOfMass = this.centerOfMass(intersections);
  var orderedIntersections = this.orderIntersections(intersections, centerOfMass, direction);

  // split for convenience
  var formatIntersections = [];
  var formatIntersectionsXY = [];
  for (var k = 0; k < orderedIntersections.length; k++) {
    formatIntersections.push(orderedIntersections[k].point);
    formatIntersectionsXY.push(orderedIntersections[k].xy);
  }

  //
  // Create Shape
  //
  var sliceShape = new THREE.Shape();
  // move to first point!
  sliceShape.moveTo(formatIntersectionsXY[0].x, formatIntersectionsXY[0].y);

  // loop through all points!
  for (var l = 1; l < formatIntersectionsXY.length; l++) {
    // project each on plane!
    sliceShape.lineTo(formatIntersectionsXY[l].x, formatIntersectionsXY[l].y);
  }

  // close the shape!
  sliceShape.lineTo(formatIntersectionsXY[0].x, formatIntersectionsXY[0].y);

  //
  // Generate Geometry from shape
  // It does triangulation for us!
  //
  THREE.ShapeGeometry.call(this, sliceShape);
  this.type = 'SliceGeometry';

  // update real position of each vertex! (not in 2d)
  this.vertices = formatIntersections;
  this.verticesNeedUpdate = true;
};

VJS.geometries.slice.prototype = Object.create(THREE.ShapeGeometry.prototype);
VJS.geometries.slice.prototype.constructor = VJS.geometries.slice;

/**
 *
 * Convenience function to extract center of mass from list of points.
 *
 * @private
 *
 * @param {Array<THREE.Vector3>} points - Set of points from which we want to extract the center of mass.
 *
 * @returns {THREE.Vector3} Center of mass from given points.
 */
VJS.geometries.slice.prototype.centerOfMass = function(points) {
  var centerOfMass = new THREE.Vector3(0, 0, 0);
  for (var i = 0; i < points.length; i++) {
    centerOfMass.x += points[i].x;
    centerOfMass.y += points[i].y;
    centerOfMass.z += points[i].z;
  }
  centerOfMass.divideScalar(points.length);

  return centerOfMass;
};

/**
 *
 * Order 3D planar points around a refence point.
 *
 * @private
 *
 * @param {Array<THREE.Vector3>} points - Set of planar 3D points to be ordered.
 * @param {THREE.Vector3} reference - Reference point for ordering.
 * @param {THREE.Vector3} direction - Direction of the plane in which points and reference are sitting.
 *
 * @returns {Array<Object>} Set of object representing the ordered points.
 */
VJS.geometries.slice.prototype.orderIntersections = function(points, reference, direction) {

  var a0 = points[0].x;
  var b0 = points[0].y;
  var c0 = points[0].z;
  var x0 = points[0].x - reference.x;
  var y0 = points[0].y - reference.y;
  var z0 = points[0].z - reference.z;
  var l0 = {
    origin: new THREE.Vector3(a0, b0, c0),
    direction: new THREE.Vector3(x0, y0, z0).normalize()
  };

  var base = new THREE.Vector3(0, 0, 0)
      .crossVectors(l0.direction, direction)
      .normalize();

  var orderedpoints = [];

  // other lines // if inter, return location + angle
  for (var j = 0; j < points.length; j++) {

    var a1 = points[j].x;
    var b1 = points[j].y;
    var c1 = points[j].z;
    var x1 = points[j].x - reference.x;
    var y1 = points[j].y - reference.y;
    var z1 = points[j].z - reference.z;

    var l1 = {
      origin: new THREE.Vector3(a1, b1, c1),
      direction: new THREE.Vector3(x1, y1, z1).normalize()
    };

    var x = l0.direction.dot(l1.direction);
    var y = base.dot(l1.direction);

    var thetaAngle = Math.atan2(y, x);
    var theta = thetaAngle * (180 / Math.PI);
    orderedpoints.push({
      'angle': theta,
      'point': l1.origin,
      'xy': {
        'x': x,
        'y': y
      }
    });
  }

  orderedpoints.sort(function(a, b) {
    return a.angle - b.angle;
  });

  return orderedpoints;
};
