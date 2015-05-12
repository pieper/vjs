/*global Module, dcmjs, FS, $, fetch*/

'use strict';

var VJS = VJS || {};
VJS.Parsers = VJS.Parsers || {};

VJS.Parsers.Dicom = function(files) {
    this.files = files;
};

/**
 files is an array of URLs
*/
VJS.Parsers.Dicom.loadAndParse = function(files) {

    //var files = ['/data/dcm/fruit', '/data/dcm/US-RGB-8-esopecho'];
    //var names = ['fruit', 'US-RGB-8-esopecho', 'WRIX'];

    return files.map(function(url, i) {
        // fetch data
        return fetch(url)
            // get blob from URL
            .then(function(response) {
                return response.blob();
            })
            // blob to array buffer
            .then(function(blob) {
                return VJS.Parsers.Dicom.blobToArrayBuffer(blob);
            })
            // save on virutal FS
            .then(function(arrayBuffer) {
                return VJS.Parsers.Dicom.writeToFS(url, arrayBuffer, {
                    encoding: 'binary'
                });
            })
            // dump to XML
            .then(function() {
                return VJS.Parsers.Dicom.dumpToXML(url);
            })
            // XML to DOM (jQuery friendly)
            .then(function(xml) {
                // make a DOM to query and a DOM to update
                var $dicomDom = $.parseXML(xml);
                return $dicomDom;
            })
            .then(function(dom) {
                window.console.log(files[i], ' loaded and parsed!');
                // create viewer friendly object
                return VJS.Parsers.Dicom.domToImage(dom, url);
            });
    });

};

VJS.Parsers.Dicom.dumpToXML = function(url) {
    return new Promise(function(resolve) {
        // dcmudmp
        var dumpLines = [];
        Module.print = function(s) {
            dumpLines.push(s);
        };

        // http://support.dcmtk.org/docs-snapshot/dcm2xml.html
        var filename = VJS.Parsers.Dicom.urlToFilename(url);
        var returnCode = dcmjs.utils.execute('dcm2xml', ['--native-format', filename]);
        Module.print = print;
        window.console.log(returnCode);

        //var xml = VJS.Parsers.Dicom.printToXML(dumpLines);
        var xml = dumpLines.join('\n');
        // also escape invalid characters!!!!!

        resolve(xml);
    });
};

VJS.Parsers.Dicom.urlToFilename = function(url) {
    // not optimized at all
    var filename = url.substring(url.lastIndexOf('/') + 1);
    return filename;
};

VJS.Parsers.Dicom.writeToFS = function(url, arraybuffer, options) {
    return new Promise(function(resolve) {
        var uploadedObject = new Int8Array(arraybuffer);
        // should create the FS tree maybe rather than just using filename...
        var filename = VJS.Parsers.Dicom.urlToFilename(url);
        var output = FS.writeFile(filename, uploadedObject, options);
        resolve(output);
    });
};

VJS.Parsers.Dicom.blobToArrayBuffer = function(blob) {
    return new Promise(function(resolve) {
        var myReader = new FileReader();
        myReader.addEventListener('loadend', function(e) {
            resolve(e.srcElement.result);
        });
        myReader.readAsArrayBuffer(blob);
    });
};

VJS.Parsers.Dicom.domToImage = function(dom, url) {

    // First we generate all frames
    var filename = VJS.Parsers.Dicom.urlToFilename(url);
    var imageFilePath = filename + '-raw.8b';
    // no... save all frame only 1 time..!
    dcmjs.utils.execute('dcm2pnm', ['--verbose', '--all-frames', '--write-raw-pnm', filename, imageFilePath]);

    var $dom = $(dom);

    // Create an image
    var imageModel = new VJS.image.model();

    imageModel._concatenationUID = VJS.Parsers.Dicom.getImageConcatenationUID($dom);
    imageModel._seriesUID = VJS.Parsers.Dicom.getImageSeriesUID($dom);
    imageModel._seriesNumber = VJS.Parsers.Dicom.getImageSeriesNumber($dom);

    // all dim uids in this SOP
    //var dimensionOrganizationSequence = $dom.find('[tag="00209221"]').text();

    // list of dims with more info...
    imageModel._dimensionIndexSequence = VJS.Parsers.Dicom.getImageDimensionIndexSequence($dom);

    imageModel._rows = VJS.Parsers.Dicom.getImageRows($dom);
    imageModel._columns = VJS.Parsers.Dicom.getImageColumns($dom);
    imageModel._photometricInterpretation = VJS.Parsers.Dicom.getImagePhotometricInterpretation($dom);

    //var $sharedFunctionalGroupsSequence = $dom.find('[tag="52009229"]');
    imageModel._numberOfFrames = VJS.Parsers.Dicom.getImageNumberOfFrames($dom);

    for (var i = 0; i < imageModel._numberOfFrames; i++) {
        // run in //

        // get frame specific information
        var frameIndex = i + 1;
        var $perFrameFunctionalGroupsSequence = VJS.Parsers.Dicom.getImagePerFrameFunctionalGroupSequence(frameIndex, $dom);

        var stackID = VJS.Parsers.Dicom.getFrameStackID($perFrameFunctionalGroupsSequence, $dom);
        var inStackPositionNumber = VJS.Parsers.Dicom.getFrameInStackPositionNumber($perFrameFunctionalGroupsSequence, $dom);
        var temporalPositionIndex = VJS.Parsers.Dicom.getFrameTemporalPostionIndex($perFrameFunctionalGroupsSequence, $dom);

        var currentStack = null;
        var stackByID = imageModel._stack.filter(VJS.Parsers.Dicom.filterByStackID, stackID);

        // Create stack object and add it to image if necessary
        if (stackByID.length === 0) {
            //window.console.log('+++ stack');
            var stackModel = new VJS.stack.model();
            stackModel._stackID = stackID;
            imageModel._stack.push(stackModel);
            currentStack = stackModel;
        } else {
            //window.console.log('= stack');
            currentStack = stackByID[0];
        }

        currentStack._rows = imageModel._rows;
        currentStack._columns = imageModel._columns;

        // Add frame to Stack
        var currentFrame = null;

        // use dimension instead to know if already there!
        var frameByPositionAndTime = currentStack._frame.filter(VJS.Parsers.Dicom.positionAndTime, {
            '_inStackPositionNumber': inStackPositionNumber,
            '_temporalPositionIndex': temporalPositionIndex
        });

        // Create frame object and add it to image if necessary
        if (frameByPositionAndTime.length === 0) {
            //window.console.log('+++ frame');
            var frameModel = new VJS.frame.model();
            frameModel._inStackPositionNumber = inStackPositionNumber;
            frameModel._temporalPositionIndex = temporalPositionIndex;
            currentStack._frame.push(frameModel);
            currentFrame = frameModel;
        } else {
            //window.console.log('= frame');
            currentFrame = frameByPositionAndTime[0];
        }

        // Fill content of a frame

        //
        // General Information
        //
        currentFrame._rows = currentStack._rows;
        currentFrame._columns = currentStack._columns;

        //
        // Frame Content Sequence
        //
        currentFrame._stackID = stackID;
        currentFrame._inStackPositionNumber = inStackPositionNumber;
        currentFrame._temporalPositionIndex = temporalPositionIndex;
        currentFrame._dimensionIndexValues = VJS.Parsers.Dicom.getFrameDimensionIndexValues($perFrameFunctionalGroupsSequence, $dom);
        currentFrame._imagePositionPatient = VJS.Parsers.Dicom.getFrameImagePositionPatient($perFrameFunctionalGroupsSequence, $dom);
        currentFrame._imageOrientationPatient = VJS.Parsers.Dicom.getFrameImageOrientationPatient($perFrameFunctionalGroupsSequence, $dom);

        //
        // Pixel Measure Sequence
        //
        currentFrame._sliceThickness = VJS.Parsers.Dicom.getFrameSliceThickness($perFrameFunctionalGroupsSequence, $dom);
        currentFrame._pixelSpacing = VJS.Parsers.Dicom.getFramePixelSpacing($perFrameFunctionalGroupsSequence, $dom);

        // use dimension!!

        // currentFrame.pixelData = pnmBuffer;
        // pixel type? (to guess file extension)
        var ppmExtension = 'pgm';
        currentFrame.nbChannels = 1;
        if (imageModel._photometricInterpretation === 'RGB' ||
            imageModel._photometricInterpretation === 'PALETTE COLOR' ||
            imageModel._photometricInterpretation === 'YBR_FULL' ||
            imageModel._photometricInterpretation === 'YBR_FULL_422' ||
            imageModel._photometricInterpretation === 'YBR_PARTIAL_422' ||
            imageModel._photometricInterpretation === 'YBR_PARTIAL_420' ||
            imageModel._photometricInterpretation === 'YBR_RCT') {
            ppmExtension = 'ppm';
            currentFrame._nbChannels = 3;
        }
        var stat = FS.stat(imageFilePath + '.' + i + '.' + ppmExtension);
        var stream = FS.open(imageFilePath + '.' + i + '.' + ppmExtension);
        var pnmBuffer = new Uint8Array(stat.size);
        FS.read(stream, pnmBuffer, 0, stat.size);
        FS.close(stream);

        // // // https://www.branah.com/ascii-converter
        // // // dec to ascii
        // always 15 bits header?
        var pixelData = pnmBuffer.subarray(15);
        currentFrame._pixelData = pixelData;

        // mailing list for DICOM?
    }

    // for each frame, get info of interest
    //var perFrame = $dom.find('[tag="52009230"] [tag="00289110"] [tag="00180050"]');
    //window.console.log(perFrame);

    // starts at 1
    //var $frame1 = $dom.find('[tag="52009230"] > [number="1"]');
    //window.console.log($frame1);
    // how do we get pixel data from there...?
    // where does time fit?
    return imageModel;
};

// 
//IMAGE RELATED CONVENIENCE METHODS
//
VJS.Parsers.Dicom.getImageNumberOfFrames = function(imageJqueryDom) {
    // try to access number of frames through its DICOM tag
    var numberOfFrames = imageJqueryDom.find('[tag="00280008"]').text();

    // if not available, assume we only have 1 frame
    if (numberOfFrames === '') {
        numberOfFrames = 1;
    }
    return numberOfFrames;
};

VJS.Parsers.Dicom.getImageConcatenationUID = function(imageJqueryDom) {
    // try to access concatenationUID through its DICOM tag
    var concatenationUID = imageJqueryDom.find('[tag="00209161"]').text();

    // if not available, assume we only have 1 frame
    if (concatenationUID === '') {
        concatenationUID = 1;
    }
    return concatenationUID;
};

VJS.Parsers.Dicom.getImageSeriesUID = function(imageJqueryDom) {
    // try to access seriesUID through its DICOM tag
    var seriesUID = imageJqueryDom.find('[tag="0020000E"]').text();

    // if not available, assume we only have 1 frame
    if (seriesUID === '') {
        seriesUID = 1;
    }
    return seriesUID;
};

VJS.Parsers.Dicom.getImageSeriesNumber = function(imageJqueryDom) {
    // try to access seriesNumber through its DICOM tag
    var seriesNumber = imageJqueryDom.find('[tag="00200011"]').text();

    // if not available, assume we only have 1 frame
    if (seriesNumber === '') {
        seriesNumber = 1;
    }
    return seriesNumber;
};

VJS.Parsers.Dicom.getImageDimensionIndexSequence = function(imageJqueryDom) {
    var dimensionIndexSequence = imageJqueryDom.find('[tag="00209222"]');
    var data = [];
    // pass it an array!
    dimensionIndexSequence.children().each(VJS.Parsers.Dicom.fillDimensionIndexSequence(data));
    return data;
};

VJS.Parsers.Dicom.fillDimensionIndexSequence = function(data) {
    return function() {
        data.push({
            'dimensionDescriptionLabel': $(this).find('[tag="00209421"] Value').text()
        });
    };
};

VJS.Parsers.Dicom.getImageRows = function(imageJqueryDom) {
    var rows = parseInt(imageJqueryDom.find('[tag="00280010"]').text(), 10);
    return rows;
};

VJS.Parsers.Dicom.getImageColumns = function(imageJqueryDom) {
    var columns = parseInt(imageJqueryDom.find('[tag="00280011"]').text(), 10);
    return columns;
};

VJS.Parsers.Dicom.getImagePhotometricInterpretation = function(imageJqueryDom) {
    var photometricInterpretation = imageJqueryDom.find('[tag="00280004"] Value').text();
    return photometricInterpretation;
};

VJS.Parsers.Dicom.getImagePerFrameFunctionalGroupSequence = function(frameIndex, imageJqueryDom) {
    var $perFrameFunctionalGroupSequence = imageJqueryDom.find('[tag="52009230"] > [number="' + frameIndex + '"]');
    return $perFrameFunctionalGroupSequence;
};

VJS.Parsers.Dicom.filterByStackID = function(obj) {
    /*jshint validthis:true*/
    if ('_stackID' in obj && typeof(obj._stackID) === 'number' && !isNaN(obj._stackID) && obj._stackID === this) {
        return true;
    } else {
        return false;
    }
};

//
//STACK RELATED CONVENIENCE METHODS
//
// SHOULD WE PASS FRAME INDEX + IMAGE DOM INSTEAD OF FRAME DOM?
//
//FRAME RELATED CONVENIENCE METHODS
//
VJS.Parsers.Dicom.getFrameStackID = function(frameJqueryPreFrameDom, imageJqueryDom) {
    var stackID = parseInt(frameJqueryPreFrameDom.find('[tag="00209111"] [tag="00209056"] Value').text(), 10);

    // or look for it in the imageJqueryDom?
    if (stackID === 'NaN') {
        window.console.log('stackID', stackID);
        window.console.log('imageJqueryDom', imageJqueryDom);
        stackID = 1;
    }

    return stackID;
};

VJS.Parsers.Dicom.getFrameInStackPositionNumber = function(frameJqueryPreFrameDom, imageJqueryDom) {
    var inStackPositionNumber = parseInt(frameJqueryPreFrameDom.find('[tag="00209111"] [tag="00209057"] Value').text(), 10);

    // or look for it in the imageJqueryDom?
    if (inStackPositionNumber === 'NaN') {
        window.console.log('inStackPositionNumber', inStackPositionNumber);
        window.console.log('imageJqueryDom', imageJqueryDom);
        inStackPositionNumber = 1;
    }

    return inStackPositionNumber;
};

VJS.Parsers.Dicom.getFrameTemporalPostionIndex = function(frameJqueryPreFrameDom, imageJqueryDom) {
    var temporalPositionIndex = parseInt(frameJqueryPreFrameDom.find('[tag="00209111"] [tag="00209128"] Value').text(), 10);

    // or look for it in the imageJqueryDom?
    if (temporalPositionIndex === 'NaN') {
        window.console.log('temporalPositionIndex', temporalPositionIndex);
        window.console.log('imageJqueryDom', imageJqueryDom);
        temporalPositionIndex = 1;
    }

    return temporalPositionIndex;
};


VJS.Parsers.Dicom.getFrameDimensionIndexValues = function(frameJqueryPreFrameDom, imageJqueryDom) {
    var $perFrameDimension = frameJqueryPreFrameDom.find('[tag="00209111"] [tag="00209157"]');
    var dimensionIndexValues = [];
    $perFrameDimension.children().each(VJS.Parsers.Dicom.fillDimensionIndexValues(dimensionIndexValues));

    // or look for it in the imageJqueryDom?
    if (!$perFrameDimension) {
        window.console.log('$perFrameDimension', $perFrameDimension);
        window.console.log('imageJqueryDom', imageJqueryDom);
    }

    return dimensionIndexValues;
};

VJS.Parsers.Dicom.fillDimensionIndexValues = function(container) {
    return function() {
        container.push($(this).text());
    };
};


VJS.Parsers.Dicom.positionAndTime = function(obj) {
    /*jshint validthis:true*/
    if ('_temporalPositionIndex' in obj && '_inStackPositionNumber' in obj && obj._temporalPositionIndex === this._temporalPositionIndex && obj._inStackPositionNumber === this._inStackPositionNumber) {
        return true;
    } else {
        return false;
    }
};

VJS.Parsers.Dicom.getFrameImagePositionPatient = function(frameJqueryPreFrameDom, imageJqueryDom) {
    var imagePositionPatient = {
        'x': 0,
        'y': 0,
        'z': 0
    };
    imagePositionPatient.x = parseFloat(frameJqueryPreFrameDom.find('[tag="00209113"] [tag="00200032"] Value[number="1"]').text(), 10);
    imagePositionPatient.y = parseFloat(frameJqueryPreFrameDom.find('[tag="00209113"] [tag="00200032"] Value[number="2"]').text(), 10);
    imagePositionPatient.z = parseFloat(frameJqueryPreFrameDom.find('[tag="00209113"] [tag="00200032"] Value[number="3"]').text(), 10);

    // or look for it in the imageJqueryDom?
    if (imagePositionPatient.x === 'NaN' || imagePositionPatient.y === 'NaN' || imagePositionPatient.z === 'NaN') {
        window.console.log('imagePositionPatient', imagePositionPatient);
        window.console.log('imageJqueryDom', imageJqueryDom);
        imagePositionPatient = {
            'x': 0,
            'y': 0,
            'z': 0
        };
    }

    return imagePositionPatient;
};

VJS.Parsers.Dicom.getFrameImageOrientationPatient = function(frameJqueryPreFrameDom, imageJqueryDom) {
    var imageOrientationPatient = {
        'row': {
            'x': 0,
            'y': 0,
            'z': 0
        },
        'column': {
            'x': 0,
            'y': 0,
            'z': 0
        }
    };
    imageOrientationPatient.row.x = parseFloat(frameJqueryPreFrameDom.find('[tag="00209116"] [tag="00200037"] Value[number="1"]').text(), 10);
    imageOrientationPatient.row.y = parseFloat(frameJqueryPreFrameDom.find('[tag="00209116"] [tag="00200037"] Value[number="2"]').text(), 10);
    imageOrientationPatient.row.z = parseFloat(frameJqueryPreFrameDom.find('[tag="00209116"] [tag="00200037"] Value[number="3"]').text(), 10);
    imageOrientationPatient.column.x = parseFloat(frameJqueryPreFrameDom.find('[tag="00209116"] [tag="00200037"] Value[number="4"]').text(), 10);
    imageOrientationPatient.column.y = parseFloat(frameJqueryPreFrameDom.find('[tag="00209116"] [tag="00200037"] Value[number="5"]').text(), 10);
    imageOrientationPatient.column.z = parseFloat(frameJqueryPreFrameDom.find('[tag="00209116"] [tag="00200037"] Value[number="6"]').text(), 10);


    // or look for it in the imageJqueryDom?
    if (imageOrientationPatient.row.x === 'NaN' || imageOrientationPatient.row.y === 'NaN' || imageOrientationPatient.row.z === 'NaN' || imageOrientationPatient.column.x === 'NaN' || imageOrientationPatient.column.y === 'NaN' || imageOrientationPatient.column.z === 'NaN') {
        window.console.log('imageOrientationPatient', imageOrientationPatient);
        window.console.log('imageJqueryDom', imageJqueryDom);
        imageOrientationPatient = {
            'row': {
                'x': 0,
                'y': 0,
                'z': 0
            },
            'column': {
                'x': 0,
                'y': 0,
                'z': 0
            }
        };
    }

    return imageOrientationPatient;
};

VJS.Parsers.Dicom.getFrameSliceThickness = function(frameJqueryPreFrameDom, imageJqueryDom) {
    var sliceThickness = parseFloat(frameJqueryPreFrameDom.find('[tag="00289110"] [tag="00180050"] Value').text(), 10);
    // or look for it in the imageJqueryDom?
    if (sliceThickness === 'NaN') {
        window.console.log('sliceThickness', sliceThickness);
        window.console.log('imageJqueryDom', imageJqueryDom);
        sliceThickness = 1;
    }

    return sliceThickness;
};

VJS.Parsers.Dicom.getFramePixelSpacing = function(frameJqueryPreFrameDom, imageJqueryDom) {
    var pixelSpacing = {
        'row': 1,
        'column': 1
    };

    pixelSpacing.row = parseFloat(frameJqueryPreFrameDom.find('[tag="00289110"] [tag="00280030"] Value[number="1"]').text(), 10);
    pixelSpacing.column = parseFloat(frameJqueryPreFrameDom.find('[tag="00289110"] [tag="00280030"] Value[number="2"]').text(), 10);

    // or look for it in the imageJqueryDom?
    if (pixelSpacing.row === 'NaN' || pixelSpacing.column === 'NaN') {
        window.console.log('pixelSpacing', pixelSpacing);
        window.console.log('imageJqueryDom', imageJqueryDom);
        pixelSpacing = {
            'row': 1,
            'column': 1
        };
    }

    return pixelSpacing;
};




//
// Plane Orientation Sequence
//

//
// getFrame
// getFrameSpacing
// getFrame...
// getStach
// getStack...
// getImage ...

// merge!
