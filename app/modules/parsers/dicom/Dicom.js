/*global Module, dcmjs, FS, $, fetch*/

'use strict';

var VJS = VJS || {};

/**
 * parsers namespace
 * @namespace parsers
 * @memberOf VJS
 */
VJS.parsers = VJS.parsers || {};

/**
 * Dicom parser is a combination of utilities to get a VJS image from dicom files.
 *
 * Relies on dcmjs, jquery, HTML5 fetch API, HTML5 promise API.
 *
 * @constructor
 * @class
 * @memberOf VJS.parsers
 * @public
 *
 * @param files {Array<string>} - List of files to be parsed. It is urls from which
 * VJS.parsers.dicom can pull the data from.
 */
VJS.parsers.dicom = function(files) {
    /**
     * @member
     * @type {Array<string>}
     */
    this.files = files;
};

/**
 * Promise convenience that will fetch and parse the data.
 * Use it for generic (but not cusotmizable) usage.
 *
 * @todo handle directory structure properly
 * @todo Last 4 calls should not be promises
 *
 *
 * @memberOf VJS.parsers
 * @public
 *
 * @param files {Array<string>} - List of files to be parsed. It is urls where
 * VJS.parsers.dicom can pull the data from.
 *
 * @return Array<VJS.image> An VJS image for each dicom file.
 *
 * @example
 * var files = ['/data/dcm/opecho-001.dcm', '/data/dcm/opecho-002.dcm', '/data/dcm/opecho-003.dcm'];
 * var dicomParser = VJS.parsers.dicom.(files);
 * Promise
        .all(dicomParser.loadAndParse())
        .then(function(images) {
            // all the data was successfully loaded and parsed!
            window.console.log(images);
            // now we could "merge" images, display it, etc.
        })
        .catch(function(error) {
            window.console.log(error);
        });
 */
VJS.parsers.dicom.prototype.loadAndParse = function() {
    var self = this;

    return self.files.map(function(url, i) {
        // fetch data
        return fetch(url)
            // get blob from URL
            .then(function(response) {
                return response.blob();
            })
            // blob to array buffer
            .then(function(blob) {
                return self.blobToArrayBuffer(blob);
            })
            // save on virutal FS
            .then(function(arrayBuffer) {
                return self.writeToFS(url, arrayBuffer, {
                    encoding: 'binary'
                });
            })
            // dump to XML
            .then(function() {
                return self.dumpToXML(url);
            })
            // XML to DOM (jQuery friendly)
            .then(function(xml) {
                // make a DOM to query and a DOM to update
                var $dicomDom = $.parseXML(xml);
                return $dicomDom;
            })
            .then(function(dom) {
                window.console.log(self.files[i], ' loaded and parsed!');
                // create viewer friendly object
                return self.domToImage(dom, url);
            });
    });

};

/**
 * Promise dump dicom file to xml.
 * Call dcm2xml over a file previously savedd on the virtual FS.
 * {@link http://support.dcmtk.org/docs-snapshot/dcm2xml.html}
 *
 * @todo Doesn't have to be a promise...
 *
 * @memberOf VJS.parsers
 *
 * @param url {string} - Name of the file to be dumped.
 *
 * @return string Xml dump from dicom file.
 */
VJS.parsers.dicom.prototype.dumpToXML = function(url) {
    var self = this;

    return new Promise(function(resolve) {
        // dcmudmp
        var dumpLines = [];
        Module.print = function(s) {
            dumpLines.push(s);
        };


        var filename = self.urlToFilename(url);
        var returnCode = dcmjs.utils.execute('dcm2xml', ['--native-format', filename]);
        Module.print = print;
        window.console.log(returnCode);

        //var xml = VJS.parsers.dicom.printToXML(dumpLines);
        var xml = dumpLines.join('\n');
        // also escape invalid characters!!!!!

        resolve(xml);
    });
};

/**
 * Helper to extract filename from url.
 *
 * @param url {string} - Url to be processed.
 *
 * @return string Filename.
 */
VJS.parsers.dicom.prototype.urlToFilename = function(url) {
    // not optimized at all
    var filename = url.substring(url.lastIndexOf('/') + 1);
    return filename;
};

/**
 * Promise dump dicom file to xml.
 * Call dcm2xml over a file previously savedd on the virtual FS.
 * {@link http://support.dcmtk.org/docs-snapshot/dcm2xml.html}
 *
 * @todo Doesn't have to be a promise...
 *
 * @memberOf VJS.parsers
 *
 * @param url {string} - Name of the file to be dumped.
 * @param url {ArrayBuffer} - Array Buffer.
 * @param url {string} - Name of the file to be dumped.
 *
 * @return string Xml dump from dicom file.
 */
VJS.parsers.dicom.prototype.writeToFS = function(url, arraybuffer, options) {
    var self = this;
    return new Promise(function(resolve) {
        var uploadedObject = new Int8Array(arraybuffer);
        // should create the FS tree maybe rather than just using filename...
        var filename = self.urlToFilename(url);
        var output = FS.writeFile(filename, uploadedObject, options);
        resolve(output);
    });
};

/**
 * Convert blob to array buffer. Needed because fetch doesn't return array
 * buffer properly yet. (May 2015)
 *
 * @memberOf VJS.parsers
 *
 * @param blob {Blob} - Blob to be converted.
 *
 * @return ArrayBuffer Blob converted to Array Buffer.
 */
VJS.parsers.dicom.prototype.blobToArrayBuffer = function(blob) {
    return new Promise(function(resolve) {
        var myReader = new FileReader();
        myReader.addEventListener('loadend', function(e) {
            resolve(e.srcElement.result);
        });
        myReader.readAsArrayBuffer(blob);
    });
};


/**
 * Convert jQuery representation of XML dump to VJS image.
 * It creates VJS.image, VJS.stack and VJS.frame as needed and fills it.
 *
 * Also extracts the frame with robust (but slow) dcm2pnm.
 * {@link http://support.dcmtk.org/docs/dcm2pnm.html}
 *
 * @memberOf VJS.parsers
 *
 * @param dom {jQueryObj} - $.parseXML(xml) output.
 * @param url {string} - Target file url.
 *
 * @return VJS.Image VJS Image of target dicom.
 */
VJS.parsers.dicom.prototype.domToImage = function(dom, url) {

    window.console.log('domToImage', this);
    window.console.log(this);

    // First we generate all frames
    var filename = this.urlToFilename(url);
    var imageFilePath = filename + '-raw.8b';
    // no... save all frame only 1 time..!
    dcmjs.utils.execute('dcm2pnm', ['--verbose', '--all-frames', '--write-raw-pnm', filename, imageFilePath]);

    var $dom = $(dom);

    // Create the image
    var imageModel = new VJS.image.model();

    imageModel._concatenationUID = this.imageConcatenationUID($dom);
    imageModel._seriesUID = this.imageSeriesUID($dom);
    imageModel._seriesNumber = this.imageSeriesNumber($dom);

    // all dim uids in this SOP
    //var dimensionOrganizationSequence = $dom.find('[tag="00209221"]').text();

    // list of dims with more info...
    imageModel._dimensionIndexSequence = this.imageDimensionIndexSequence($dom);

    imageModel._rows = this.imageRows($dom);
    imageModel._columns = this.imageColumns($dom);
    imageModel._photometricInterpretation = this.imagePhotometricInterpretation($dom);

    //var $sharedFunctionalGroupsSequence = $dom.find('[tag="52009229"]');
    imageModel._numberOfFrames = this.imageNumberOfFrames($dom);

    for (var i = 0; i < imageModel._numberOfFrames; i++) {
        // run in //

        // get frame specific information
        var frameIndex = i + 1;
        var $perFrameFunctionalGroupsSequence = this.imagePerFrameFunctionalGroupSequence(frameIndex, $dom);

        var stackID = this.getFrameStackID($perFrameFunctionalGroupsSequence, $dom);
        var inStackPositionNumber = this.getFrameInStackPositionNumber($perFrameFunctionalGroupsSequence, $dom);
        var temporalPositionIndex = this.getFrameTemporalPostionIndex($perFrameFunctionalGroupsSequence, $dom);

        var currentStack = null;
        var stackByID = imageModel._stack.filter(this.filterByStackID, stackID);

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
        var frameByPositionAndTime = currentStack._frame.filter(this.positionAndTime, {
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
        currentFrame._dimensionIndexValues = this.getFrameDimensionIndexValues($perFrameFunctionalGroupsSequence, $dom);
        currentFrame._imagePositionPatient = this.getFrameImagePositionPatient($perFrameFunctionalGroupsSequence, $dom);
        currentFrame._imageOrientationPatient = this.getFrameImageOrientationPatient($perFrameFunctionalGroupsSequence, $dom);

        //
        // Pixel Measure Sequence
        //
        currentFrame._sliceThickness = this.getFrameSliceThickness($perFrameFunctionalGroupsSequence, $dom);
        currentFrame._pixelSpacing = this.getFramePixelSpacing($perFrameFunctionalGroupsSequence, $dom);

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

/**
 * Get number of frames in the image.
 *
 * @memberOf VJS.parsers
 *
 * @param imageJqueryDom {jQueryObj} - jQueryRepresentation of the whole image.
 *
 * @return number Number of frames in the target image.
 */
VJS.parsers.dicom.prototype.imageNumberOfFrames = function(imageJqueryDom) {
    // try to access number of frames through its DICOM tag
    var numberOfFrames = imageJqueryDom.find('[tag="00280008"]').text();

    // if not available, assume we only have 1 frame
    if (numberOfFrames === '') {
        numberOfFrames = 1;
    }
    return numberOfFrames;
};

/**
 * Get concatenationID in the image.
 *
 * @memberOf VJS.parsers
 *
 * @param imageJqueryDom {jQueryObj} - jQueryRepresentation of the whole image.
 *
 * @return number Concatenation ID of the target image.
 */
VJS.parsers.dicom.prototype.imageConcatenationUID = function(imageJqueryDom) {
    // try to access concatenationUID through its DICOM tag
    var concatenationUID = imageJqueryDom.find('[tag="00209161"]').text();

    // if not available, assume we only have 1 frame
    if (concatenationUID === '') {
        concatenationUID = 1;
    }
    return concatenationUID;
};

/**
 * Get SeriesUID of the image.
 *
 * @memberOf VJS.parsers
 *
 * @param imageJqueryDom {jQueryObj} - jQueryRepresentation of the whole image.
 *
 * @return number Series UID of the target image.
 */
VJS.parsers.dicom.prototype.imageSeriesUID = function(imageJqueryDom) {
    // try to access seriesUID through its DICOM tag
    var seriesUID = imageJqueryDom.find('[tag="0020000E"]').text();

    // if not available, assume we only have 1 frame
    if (seriesUID === '') {
        seriesUID = 1;
    }
    return seriesUID;
};

/**
 * Get Series Number of the image.
 *
 * @memberOf VJS.parsers
 *
 * @param imageJqueryDom {jQueryObj} - jQueryRepresentation of the whole image.
 *
 * @return number Series Number of the target image.
 */
VJS.parsers.dicom.prototype.imageSeriesNumber = function(imageJqueryDom) {
    // try to access seriesNumber through its DICOM tag
    var seriesNumber = imageJqueryDom.find('[tag="00200011"]').text();

    // if not available, assume we only have 1 frame
    if (seriesNumber === '') {
        seriesNumber = 1;
    }
    return seriesNumber;
};

/**
 * Get Dimension Index Sequence of the image.
 *
 * @memberOf VJS.parsers
 *
 * @param imageJqueryDom {jQueryObj} - jQueryRepresentation of the whole image.
 *
 * @return Array<Object> List dimensions in the Image.
 */
VJS.parsers.dicom.prototype.imageDimensionIndexSequence = function(imageJqueryDom) {
    var dimensionIndexSequence = imageJqueryDom.find('[tag="00209222"]');
    var data = [];
    // pass it an array!
    dimensionIndexSequence.children().each(this.fillDimensionIndexSequence(data));
    return data;
};

/**
 * Convenience function to get dimension index sequence from jQuery each callback.
 *
 * @memberOf VJS.parsers
 *
 * @param data {Array} - Array to be filled.
 */
VJS.parsers.dicom.prototype.fillDimensionIndexSequence = function(data) {
    return function() {
        data.push({
            'dimensionDescriptionLabel': $(this).find('[tag="00209421"] Value').text()
        });
    };
};

/**
 * Get Rows of the image.
 *
 * @memberOf VJS.parsers
 *
 * @param imageJqueryDom {jQueryObj} - jQueryRepresentation of the whole image.
 *
 * @return number Rows in the image.
 */
VJS.parsers.dicom.prototype.imageRows = function(imageJqueryDom) {
    var rows = parseInt(imageJqueryDom.find('[tag="00280010"]').text(), 10);
    return rows;
};

/**
 * Get Columns of the image.
 *
 * @memberOf VJS.parsers
 *
 * @param imageJqueryDom {jQueryObj} - jQueryRepresentation of the whole image.
 *
 * @return number Columns in the image.
 */
VJS.parsers.dicom.prototype.imageColumns = function(imageJqueryDom) {
    var columns = parseInt(imageJqueryDom.find('[tag="00280011"]').text(), 10);
    return columns;
};


/**
 * Get Photometric Interpretation of the image.
 *
 * @memberOf VJS.parsers
 *
 * @param imageJqueryDom {jQueryObj} - jQueryRepresentation of the whole image.
 *
 * @return string Photometric interpretation of the image.
 */
VJS.parsers.dicom.prototype.imagePhotometricInterpretation = function(imageJqueryDom) {
    var photometricInterpretation = imageJqueryDom.find('[tag="00280004"] Value').text();
    return photometricInterpretation;
};

VJS.parsers.dicom.prototype.imagePerFrameFunctionalGroupSequence = function(frameIndex, imageJqueryDom) {
    var $perFrameFunctionalGroupSequence = imageJqueryDom.find('[tag="52009230"] > [number="' + frameIndex + '"]');
    return $perFrameFunctionalGroupSequence;
};

VJS.parsers.dicom.prototype.filterByStackID = function(obj) {
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
VJS.parsers.dicom.prototype.getFrameStackID = function(frameJqueryPreFrameDom, imageJqueryDom) {
    var stackID = parseInt(frameJqueryPreFrameDom.find('[tag="00209111"] [tag="00209056"] Value').text(), 10);

    // or look for it in the imageJqueryDom?
    if (stackID === 'NaN') {
        window.console.log('stackID', stackID);
        window.console.log('imageJqueryDom', imageJqueryDom);
        stackID = 1;
    }

    return stackID;
};

VJS.parsers.dicom.prototype.getFrameInStackPositionNumber = function(frameJqueryPreFrameDom, imageJqueryDom) {
    var inStackPositionNumber = parseInt(frameJqueryPreFrameDom.find('[tag="00209111"] [tag="00209057"] Value').text(), 10);

    // or look for it in the imageJqueryDom?
    if (inStackPositionNumber === 'NaN') {
        window.console.log('inStackPositionNumber', inStackPositionNumber);
        window.console.log('imageJqueryDom', imageJqueryDom);
        inStackPositionNumber = 1;
    }

    return inStackPositionNumber;
};

VJS.parsers.dicom.prototype.getFrameTemporalPostionIndex = function(frameJqueryPreFrameDom, imageJqueryDom) {
    var temporalPositionIndex = parseInt(frameJqueryPreFrameDom.find('[tag="00209111"] [tag="00209128"] Value').text(), 10);

    // or look for it in the imageJqueryDom?
    if (temporalPositionIndex === 'NaN') {
        window.console.log('temporalPositionIndex', temporalPositionIndex);
        window.console.log('imageJqueryDom', imageJqueryDom);
        temporalPositionIndex = 1;
    }

    return temporalPositionIndex;
};


VJS.parsers.dicom.prototype.getFrameDimensionIndexValues = function(frameJqueryPreFrameDom, imageJqueryDom) {
    var $perFrameDimension = frameJqueryPreFrameDom.find('[tag="00209111"] [tag="00209157"]');
    var dimensionIndexValues = [];
    $perFrameDimension.children().each(this.fillDimensionIndexValues(dimensionIndexValues));

    // or look for it in the imageJqueryDom?
    if (!$perFrameDimension) {
        window.console.log('$perFrameDimension', $perFrameDimension);
        window.console.log('imageJqueryDom', imageJqueryDom);
    }

    return dimensionIndexValues;
};

VJS.parsers.dicom.prototype.fillDimensionIndexValues = function(container) {
    return function() {
        container.push($(this).text());
    };
};


VJS.parsers.dicom.prototype.positionAndTime = function(obj) {
    /*jshint validthis:true*/
    if ('_temporalPositionIndex' in obj && '_inStackPositionNumber' in obj && obj._temporalPositionIndex === this._temporalPositionIndex && obj._inStackPositionNumber === this._inStackPositionNumber) {
        return true;
    } else {
        return false;
    }
};

VJS.parsers.dicom.prototype.getFrameImagePositionPatient = function(frameJqueryPreFrameDom, imageJqueryDom) {
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

VJS.parsers.dicom.prototype.getFrameImageOrientationPatient = function(frameJqueryPreFrameDom, imageJqueryDom) {
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

VJS.parsers.dicom.prototype.getFrameSliceThickness = function(frameJqueryPreFrameDom, imageJqueryDom) {
    var sliceThickness = parseFloat(frameJqueryPreFrameDom.find('[tag="00289110"] [tag="00180050"] Value').text(), 10);
    // or look for it in the imageJqueryDom?
    if (sliceThickness === 'NaN') {
        window.console.log('sliceThickness', sliceThickness);
        window.console.log('imageJqueryDom', imageJqueryDom);
        sliceThickness = 1;
    }

    return sliceThickness;
};

VJS.parsers.dicom.prototype.getFramePixelSpacing = function(frameJqueryPreFrameDom, imageJqueryDom) {
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
// image ...

// merge!
