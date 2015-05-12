'use strict';

var VJS = VJS || {};
VJS.intersections = VJS.intersections || {};

VJS.intersections.obbPlane = function(obb, plane) {

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
    // NOTE: Return intersection in direction's space (toOBBSpaceInvert applied...)


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

    return;

};
