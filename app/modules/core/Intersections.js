'use strict';

var VJS = VJS || {};

/**
 * intersections namespace
 * @namespace intersections
 * @memberOf VJS
 */
VJS.intersections = VJS.intersections || {};


/**
 * Compute intersection between oriented bounding box and a plane.
 * Returns intersection in plane's space (toOBBSpaceInvert applied).
 * Should return at least 3 intersections. If not, the plane and the box do not
 * intersect.
 *
 * @memberOf VJS.intersections
 * @public
 *
 * @param {Object} obb - Oriented Bounding Box representation.
 * @param {THREE.Vector3} obb.halfDimensions - Half dimensions of the box.
 * @param {THREE.Vector3<THREE.Vector3>} obb.orientation - Orientation of the edges of the box.
 * @param {THREE.Vector3} obb.center - Center of the box.
 * @param {THREE.Matrix4} obb.toOBBSpace - Transform to go from plane space to box space.
 * @param {THREE.Matrix4} obb.toOBBSpaceInvert - Transform to go from box space to plane space.
 * @param {Object} plane - Plane representation
 * @param {THREE.Vector3} plane.origin - Origin of normal which describes the plane.
 * @param {THREE.Vector3} plane.direction - Direction of normal which describes the plane.
 *
 * @returns {Array<THREE.Vector3>} List of all intersections, in plane's space.
 *
 * @todo toOBBSpace and toOBBSpaceInvert might be redundent.
 * @todo find best way to deal with different spaces.
 */

VJS.intersections.obbPlane = function(obb, plane) {

    window.console.log('obbPlane', this);
    //
    // obb = { halfDimensions, orientation, center, toOBBSpace }
    // plane = { origin, direction }
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
    // 1- Move Plane origin and orientation in IJK space
    // 2- Test Edges/ IJK Plane intersections
    // 3- Return intersection Edge/ IJK Plane if it touches the Oriented BBox

    var intersections = [];

    var t1 = plane.direction.clone().applyMatrix4(obb.toOBBSpace);
    var t0 = new THREE.Vector3(0, 0, 0).applyMatrix4(obb.toOBBSpace);

    var planeOBB = {
        origin: plane.origin.clone().applyMatrix4(obb.toOBBSpace),
        direction: new THREE.Vector3(t1.x - t0.x, t1.y - t0.y, t1.z - t0.z).normalize()
    };

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
        'origin': new THREE.Vector3(obb.center.x - obb.halfDimensions.x, obb.center.y - obb.halfDimensions.y, obb.center.z - obb.halfDimensions.z),
        'direction': obb.orientation.x
    };

    var intersection = this.rayPlane(ray, planeOBB);
    if (intersection && intersection.x >= 0 && intersection.y >= 0 && intersection.z >= 0 &&
        intersection.x <= 2 * obb.halfDimensions.x &&
        intersection.y <= 2 * obb.halfDimensions.y &&
        intersection.z <= 2 * obb.halfDimensions.z) {
        intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
    }

    ray.direction = obb.orientation.y;
    intersection = this.rayPlane(ray, planeOBB);
    if (intersection && intersection.x >= 0 && intersection.y >= 0 && intersection.z >= 0 &&
        intersection.x <= 2 * obb.halfDimensions.x &&
        intersection.y <= 2 * obb.halfDimensions.y &&
        intersection.z <= 2 * obb.halfDimensions.z) {
        intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
    }

    ray.direction = obb.orientation.z;
    intersection = this.rayPlane(ray, planeOBB);
    if (intersection && intersection.x >= 0 && intersection.y >= 0 && intersection.z >= 0 &&
        intersection.x <= 2 * obb.halfDimensions.x &&
        intersection.y <= 2 * obb.halfDimensions.y &&
        intersection.z <= 2 * obb.halfDimensions.z) {
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
        'origin': new THREE.Vector3(obb.center.x + obb.halfDimensions.x, obb.center.y + obb.halfDimensions.y, obb.center.z + obb.halfDimensions.z),
        'direction': obb.orientation.x
    };

    intersection = this.rayPlane(ray, planeOBB);
    if (intersection && intersection.x >= 0 && intersection.y >= 0 && intersection.z >= 0 &&
        intersection.x <= 2 * obb.halfDimensions.x &&
        intersection.y <= 2 * obb.halfDimensions.y &&
        intersection.z <= 2 * obb.halfDimensions.z) {
        intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
    }

    ray.direction = obb.orientation.y;
    intersection = this.rayPlane(ray, planeOBB);
    if (intersection && intersection.x >= 0 && intersection.y >= 0 && intersection.z >= 0 &&
        intersection.x <= 2 * obb.halfDimensions.x &&
        intersection.y <= 2 * obb.halfDimensions.y &&
        intersection.z <= 2 * obb.halfDimensions.z) {
        intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
    }

    ray.direction = obb.orientation.z;
    intersection = this.rayPlane(ray, planeOBB);
    if (intersection && intersection.x >= 0 && intersection.y >= 0 && intersection.z >= 0 &&
        intersection.x <= 2 * obb.halfDimensions.x &&
        intersection.y <= 2 * obb.halfDimensions.y &&
        intersection.z <= 2 * obb.halfDimensions.z) {
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
        'origin': new THREE.Vector3(obb.center.x + obb.halfDimensions.x, obb.center.y - obb.halfDimensions.y, obb.center.z - obb.halfDimensions.z),
        'direction': obb.orientation.y
    };

    intersection = this.rayPlane(ray, planeOBB);
    if (intersection && intersection.x >= 0 && intersection.y >= 0 && intersection.z >= 0 &&
        intersection.x <= 2 * obb.halfDimensions.x &&
        intersection.y <= 2 * obb.halfDimensions.y &&
        intersection.z <= 2 * obb.halfDimensions.z) {
        intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
    }

    ray.direction = obb.orientation.z;
    intersection = this.rayPlane(ray, planeOBB);
    if (intersection && intersection.x >= 0 && intersection.y >= 0 && intersection.z >= 0 &&
        intersection.x <= 2 * obb.halfDimensions.x &&
        intersection.y <= 2 * obb.halfDimensions.y &&
        intersection.z <= 2 * obb.halfDimensions.z) {
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
        'origin': new THREE.Vector3(obb.center.x - obb.halfDimensions.x, obb.center.y + obb.halfDimensions.y, obb.center.z - obb.halfDimensions.z),
        'direction': obb.orientation.x
    };

    intersection = this.rayPlane(ray, planeOBB);
    if (intersection && intersection.x >= 0 && intersection.y >= 0 && intersection.z >= 0 &&
        intersection.x <= 2 * obb.halfDimensions.x &&
        intersection.y <= 2 * obb.halfDimensions.y &&
        intersection.z <= 2 * obb.halfDimensions.z) {
        intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
    }

    ray.direction = obb.orientation.z;
    intersection = this.rayPlane(ray, planeOBB);
    if (intersection && intersection.x >= 0 && intersection.y >= 0 && intersection.z >= 0 &&
        intersection.x <= 2 * obb.halfDimensions.x &&
        intersection.y <= 2 * obb.halfDimensions.y &&
        intersection.z <= 2 * obb.halfDimensions.z) {
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
        'origin': new THREE.Vector3(obb.center.x - obb.halfDimensions.x, obb.center.y - obb.halfDimensions.y, obb.center.z + obb.halfDimensions.z),
        'direction': obb.orientation.x
    };

    intersection = this.rayPlane(ray, planeOBB);
    if (intersection && intersection.x >= 0 && intersection.y >= 0 && intersection.z >= 0 &&
        intersection.x <= 2 * obb.halfDimensions.x &&
        intersection.y <= 2 * obb.halfDimensions.y &&
        intersection.z <= 2 * obb.halfDimensions.z) {
        intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
    }

    ray.direction = obb.orientation.y;
    intersection = this.rayPlane(ray, planeOBB);
    if (intersection && intersection.x >= 0 && intersection.y >= 0 && intersection.z >= 0 &&
        intersection.x <= 2 * obb.halfDimensions.x &&
        intersection.y <= 2 * obb.halfDimensions.y &&
        intersection.z <= 2 * obb.halfDimensions.z) {
        intersections.push(intersection.applyMatrix4(obb.toOBBSpaceInvert));
    }

    return intersections;
};

/**
 * Compute intersection between a ray and a plane.
 *
 * @memberOf VJS.intersections
 * @public
 *
 * @param {Object} ray - Ray representation.
 * @param {THREE.Vector3} ray.origin - Origin of normal which describes the ray.
 * @param {THREE.Vector3} ray.direction - Direction of normal which describes the ray.
 * @param {Object} plane - Plane representation
 * @param {THREE.Vector3} plane.origin - Origin of normal which describes the plane.
 * @param {THREE.Vector3} plane.direction - Direction of normal which describes the plane.
 *
 * @returns {THREE.Vector3|null} Intersection between ray and plane or null.
 */
VJS.intersections.rayPlane = function(ray, plane) {
    // ray: {origin, direction}
    // plane: {origin, direction}

    if (ray.direction.dot(plane.direction) !== 0) {
        //
        // not parallel, move forward
        //
        // LOGIC:
        //
        // Ray equation: P = P0 + tV
        // P = <Px, Py, Pz>
        // P0 = <ray.origin.x, ray.origin.y, ray.origin.z>
        // V = <ray.direction.x, ray.direction.y, ray.direction.z>
        //
        // Therefore:
        // Px = ray.origin.x + t*ray.direction.x
        // Py = ray.origin.y + t*ray.direction.y
        // Pz = ray.origin.z + t*ray.direction.z
        //
        //
        //
        // Plane equation: ax + by + cz + d = 0
        // a = plane.direction.x
        // b = plane.direction.y
        // c = plane.direction.z
        // d = -( plane.direction.x*plane.origin.x +
        //        plane.direction.y*plane.origin.y +
        //        plane.direction.z*plane.origin.z )
        //
        //
        // 1- in the plane equation, we replace x, y and z by Px, Py and Pz
        // 2- find t
        // 3- replace t in Px, Py and Pz to get the coordinate of the intersection
        //
        var t = (plane.direction.x * (plane.origin.x - ray.origin.x) + plane.direction.y * (plane.origin.y - ray.origin.y) + plane.direction.z * (plane.origin.z - ray.origin.z)) /
            (plane.direction.x * ray.direction.x + plane.direction.y * ray.direction.y + plane.direction.z * ray.direction.z);

        var intersection = new THREE.Vector3(
            ray.origin.x + t * ray.direction.x,
            ray.origin.y + t * ray.direction.y,
            ray.origin.z + t * ray.direction.z);

        return intersection;

    }

    return null;

};
