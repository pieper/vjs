'use strict';

var VJS = VJS || {};
/**
 * @namespace
 */
VJS.frame = VJS.frame || {};

/**
 * Define the model of a frame here
 */
VJS.frame.model = function() {
    this.uid = null;


    // Frame Content Sequence
    this.stackID = -1;
    this.temporalPositionIndex = null;
    this.inStackPosition = -1;
    this.dimensionIndexValues = {
        'temporalPositionIndex': -1,
        'inStackPositionNumber': -1
    };

    // Plane Position Sequence

    /*
     * The x, y and z coordinatesof the upper left hand voxel of the image,
     * in mm.
     */
    this.imagePositionPatient = {
        'x': 0,
        'y': 0,
        'z': 0
    };

    // Plane Orientation Sequence

    /*
     * The direction cosine s of the first row and the first colum with respect
     * to the patient
     */
    this.imageOrientationPatient = {
        'row': {
            'x': 1,
            'y': 1,
            'z': 1
        },
        'column': {
            'x': 1,
            'y': 1,
            'z': 1
        }
    };

    // Pixel Measure Sequence

    this.sliceThickness = 1;
    this.pixelSpacing = {
        'row': 1,
        'column': 1
    };
    // return {
    //     'x00289110' : {         // pixel measures sequence
    //         'x00280030' : null, //pixel spacing
    //         'x00180050' : null  //slice thickness
    //     },
    //     'x00209111' : {         // frame content sequence
    //         'x00209128' : null, // temporal position index
    //     }
    // 'frameID' : null,
    // 'stackPosition1': null,
    // 'pixelData': null

    // };
};
