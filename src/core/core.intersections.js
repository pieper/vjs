'use strict';

var VJS = VJS || {};
VJS.core = VJS.core || {};

/**
 * @constructor
 * @class
 * @memberOf VJS.core
 * @public
*/
VJS.core.intersections = VJS.core.intersections || {};

/**
 * Compute intersection between oriented bounding box and a plane.
 * Returns intersection in plane's space (toOBBSpaceInvert applied).
 * Should return at least 3 intersections. If not, the plane and the box do not
 * intersect.
 *
 * @memberOf VJS.core.intersections
 * @public
 *
 * @param {Object} obb - Oriented Bounding Box representation.
 * @param {THREE.Vector3} obb.halfDimensions - Half dimensions of the box.
 * @param {THREE.Vector3<THREE.Vector3>} obb.orientation - Orientation of the edges of the box.
 * @param {THREE.Vector3} obb.center - Center of the box.
 * @param {THREE.Matrix4} obb.toOBBSpace - Transform to go from plane space to box space.
 * @param {THREE.Matrix4} obb.toOBBSpaceInvert - Transform to go from box space to plane space.
 * @param {Object} plane - Plane representation
 * @param {THREE.Vector3} plane.position - position of normal which describes the plane.
 * @param {THREE.Vector3} plane.direction - Direction of normal which describes the plane.
 *
 * @returns {Array<THREE.Vector3>} List of all intersections, in plane's space.
 *
 * @todo toOBBSpace and toOBBSpaceInvert might be redundent.
 * @todo find best way to deal with different spaces.
 */

VJS.core.intersections.obbPlane = function(obb, plane) {

  //
  // obb = { halfDimensions, orientation, center, toOBBSpace }
  // plane = { position, direction }
  //
  //
  // LOGIC:
  //
  // Test intersection of each edge of the Oriented Bounding Box with the Plane
  // 
  // ALL EDGES 
  //
  //      .+-------+  
  //    .' |     .'|  
  //   +---+---+'  |  
  //   |   |   |   |  
  //   |  ,+---+---+  
  //   |.'     | .'   
  //   +-------+'     
  //
  // SPACE ORIENTATION
  //
  //       +
  //     j |
  //       |
  //       |   i 
  //   k  ,+-------+  
  //    .'
  //   +
  //
  //
  // 1- Move Plane position and orientation in IJK space
  // 2- Test Edges/ IJK Plane intersections
  // 3- Return intersection Edge/ IJK Plane if it touches the Oriented BBox

  var intersections = [];

  var t1 = plane.direction.clone().applyMatrix4(obb.toOBBSpace);
  var t0 = new THREE.Vector3(0, 0, 0).applyMatrix4(obb.toOBBSpace);

  var planeOBB = {
    position: plane.position.clone().applyMatrix4(obb.toOBBSpace),
    direction: new THREE.Vector3(t1.x - t0.x, t1.y - t0.y, t1.z - t0.z).normalize()
  };

  var bboxMin = new THREE.Vector3(
      obb.center.x - obb.halfDimensions.x,
      obb.center.y - obb.halfDimensions.y,
      obb.center.z - obb.halfDimensions.z);
  var bboxMax = new THREE.Vector3(
      obb.center.x + obb.halfDimensions.x,
      obb.center.y + obb.halfDimensions.y,
      obb.center.z + obb.halfDimensions.z);

  // 12 edges (i.e. ray)/plane intersection tests

  // RAYS STARTING FROM THE FIRST CORNER (0, 0, 0)
  //
  //       +
  //       |
  //       |
  //       | 
  //      ,+---+---+
  //    .'   
  //   +   

  var ray = {
    'position': new THREE.Vector3(obb.center.x - obb.halfDimensions.x, obb.center.y - obb.halfDimensions.y, obb.center.z - obb.halfDimensions.z),
    'direction': obb.orientation.x
  };

  var intersection = this.rayPlane(ray, planeOBB);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
  }

  ray.direction = obb.orientation.y;
  intersection = this.rayPlane(ray, planeOBB);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
  }

  ray.direction = obb.orientation.z;
  intersection = this.rayPlane(ray, planeOBB);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
  }

  // RAYS STARTING FROM THE LAST CORNER
  //
  //               +
  //             .'
  //   +-------+'
  //           |
  //           |
  //           |
  //           +
  //

  ray = {
    'position': new THREE.Vector3(obb.center.x + obb.halfDimensions.x, obb.center.y + obb.halfDimensions.y, obb.center.z + obb.halfDimensions.z),
    'direction': obb.orientation.x
  };

  intersection = this.rayPlane(ray, planeOBB);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
  }

  ray.direction = obb.orientation.y;
  intersection = this.rayPlane(ray, planeOBB);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
  }

  ray.direction = obb.orientation.z;
  intersection = this.rayPlane(ray, planeOBB);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
  }

  // RAYS STARTING FROM THE SECOND CORNER
  //
  //               +
  //               |
  //               |
  //               |
  //               +
  //             .'
  //           +'

  ray = {
    'position': new THREE.Vector3(obb.center.x + obb.halfDimensions.x, obb.center.y - obb.halfDimensions.y, obb.center.z - obb.halfDimensions.z),
    'direction': obb.orientation.y
  };

  intersection = this.rayPlane(ray, planeOBB);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
  }

  ray.direction = obb.orientation.z;
  intersection = this.rayPlane(ray, planeOBB);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
  }

  // RAYS STARTING FROM THE THIRD CORNER
  //
  //      .+-------+  
  //    .'
  //   +
  //   
  //   
  //   
  //   

  ray = {
    'position': new THREE.Vector3(obb.center.x - obb.halfDimensions.x, obb.center.y + obb.halfDimensions.y, obb.center.z - obb.halfDimensions.z),
    'direction': obb.orientation.x
  };

  intersection = this.rayPlane(ray, planeOBB);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
  }

  ray.direction = obb.orientation.z;
  intersection = this.rayPlane(ray, planeOBB);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
  }

  // RAYS STARTING FROM THE FOURTH CORNER
  //
  //   
  //   
  //   +
  //   |
  //   |  
  //   |
  //   +-------+

  ray = {
    'position': new THREE.Vector3(obb.center.x - obb.halfDimensions.x, obb.center.y - obb.halfDimensions.y, obb.center.z + obb.halfDimensions.z),
    'direction': obb.orientation.x
  };

  intersection = this.rayPlane(ray, planeOBB);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
  }

  ray.direction = obb.orientation.y;
  intersection = this.rayPlane(ray, planeOBB);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
  }

  return intersections;
};

/**
 * Compute intersection between a ray and a plane.
 *
 * @memberOf VJS.core.intersections
 * @public
 *
 * @param {Object} ray - Ray representation.
 * @param {THREE.Vector3} ray.position - position of normal which describes the ray.
 * @param {THREE.Vector3} ray.direction - Direction of normal which describes the ray.
 * @param {Object} plane - Plane representation
 * @param {THREE.Vector3} plane.position - position of normal which describes the plane.
 * @param {THREE.Vector3} plane.direction - Direction of normal which describes the plane.
 *
 * @returns {THREE.Vector3|null} Intersection between ray and plane or null.
 */
VJS.core.intersections.rayPlane = function(ray, plane) {
  // ray: {position, direction}
  // plane: {position, direction}

  if (ray.direction.dot(plane.direction) !== 0) {
    //
    // not parallel, move forward
    //
    // LOGIC:
    //
    // Ray equation: P = P0 + tV
    // P = <Px, Py, Pz>
    // P0 = <ray.position.x, ray.position.y, ray.position.z>
    // V = <ray.direction.x, ray.direction.y, ray.direction.z>
    //
    // Therefore:
    // Px = ray.position.x + t*ray.direction.x
    // Py = ray.position.y + t*ray.direction.y
    // Pz = ray.position.z + t*ray.direction.z
    //
    //
    //
    // Plane equation: ax + by + cz + d = 0
    // a = plane.direction.x
    // b = plane.direction.y
    // c = plane.direction.z
    // d = -( plane.direction.x*plane.position.x +
    //        plane.direction.y*plane.position.y +
    //        plane.direction.z*plane.position.z )
    //
    //
    // 1- in the plane equation, we replace x, y and z by Px, Py and Pz
    // 2- find t
    // 3- replace t in Px, Py and Pz to get the coordinate of the intersection
    //
    var t = (plane.direction.x * (plane.position.x - ray.position.x) + plane.direction.y * (plane.position.y - ray.position.y) + plane.direction.z * (plane.position.z - ray.position.z)) /
        (plane.direction.x * ray.direction.x + plane.direction.y * ray.direction.y + plane.direction.z * ray.direction.z);

    var intersection = new THREE.Vector3(
        ray.position.x + t * ray.direction.x,
        ray.position.y + t * ray.direction.y,
        ray.position.z + t * ray.direction.z);

    return intersection;

  }

  return null;

};

VJS.core.intersections.rayBox = function(ray, box) {
  // ray: {position, direction}
  // box: {halfDimensions, center}

  var intersections = [];
  var plane = {
    position: null,
    direction: null
  };

  var bboxMin = new THREE.Vector3(
    box.center.x - box.halfDimensions.x,
    box.center.y - box.halfDimensions.y,
    box.center.z - box.halfDimensions.z);
  var bboxMax = new THREE.Vector3(
      box.center.x + box.halfDimensions.x,
      box.center.y + box.halfDimensions.y,
      box.center.z + box.halfDimensions.z);

  // X min
  plane.direction = new THREE.Vector3(-1, 0, 0);
  plane.position = new THREE.Vector3(
    bboxMin.x,
    box.center.y,
    box.center.z);
  var intersection = this.rayPlane(ray, plane);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection);
  }

  // X max
  plane.direction = new THREE.Vector3(1, 0, 0);
  plane.position = new THREE.Vector3(
    bboxMax.x,
    box.center.y,
    box.center.z);
  intersection = this.rayPlane(ray, plane);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection);
  }

  // Y min
  plane.direction = new THREE.Vector3(0, -1, 0);
  plane.position = new THREE.Vector3(
    box.center.x,
    bboxMin.y,
    box.center.z);
  intersection = this.rayPlane(ray, plane);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection);
  }

  // Y max
  plane.direction = new THREE.Vector3(0, 1, 0);
  plane.position = new THREE.Vector3(
    box.center.x,
    bboxMax.y,
    box.center.z);
  intersection = this.rayPlane(ray, plane);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection);
  }

  // Z min
  plane.direction = new THREE.Vector3(0, 0, -1);
  plane.position = new THREE.Vector3(
    box.center.x,
    box.center.y,
    bboxMin.z);
  intersection = this.rayPlane(ray, plane);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection);
  }

  // Z max
  plane.direction = new THREE.Vector3(0, 0, 1);
  plane.position = new THREE.Vector3(
    box.center.x,
    box.center.y,
    bboxMax.z);
  intersection = this.rayPlane(ray, plane);
  if (this.inBBox(intersection, bboxMin, bboxMax)) {
    intersections.push(intersection);
  }
  
  return intersections;
};

VJS.core.intersections.inBBox = function(point, bboxMin, bboxMax) {
  if (point &&
  point.x >= bboxMin.x && point.y >= bboxMin.y && point.z >= bboxMin.z &&
  point.x <= bboxMax.x && point.y <= bboxMax.y && point.z <= bboxMax.z) {
    return true;
  }
  return false;
};

/*** Exports ***/

var moduleType = typeof module;
if ((moduleType !== 'undefined') && module.exports) {
  module.exports = VJS.core.intersections;
}
