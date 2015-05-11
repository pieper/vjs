/*global Module, dcmjs, FS, $, fetch*/

'use strict';

var VJS = VJS || {};
VJS.Parsers = VJS.Parsers || {};

VJS.Parsers.Dicom = function(files) {
    this.files = files;
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

function filterByID(obj) {
    /*jshint validthis:true*/
    if ('uid' in obj && typeof(obj.uid) === 'number' && !isNaN(obj.uid) && obj.uid === this) {
        return true;
    } else {
        return false;
    }
}

function positionAndTime(obj) {
    /*jshint validthis:true*/
    if ('temporalPositionIndex' in obj && 'inStackPositionNumber' in obj && obj.temporalPositionIndex === this.temporalPositionIndex && obj.inStackPositionNumber === this.inStackPositionNumber) {
        return true;
    } else {
        return false;
    }
}

VJS.Parsers.Dicom.fillDimensionIndexSequence = function(imageModel) {
    return function() {
        imageModel.dimensionIndexSequence.push({
            'dimensionDescriptionLabel': $(this).find('[tag="00209421"] Value').text()
        });
    };
};

VJS.Parsers.Dicom.fillDimensionIndexValues = function(frameModel) {
    return function() {
        frameModel.dimensionIndexValues.push($(this).text());
    };
};

VJS.Parsers.Dicom.domToImage = function(dom, url) {

    var filename = VJS.Parsers.Dicom.urlToFilename(url);

    // Create an image
    var imageModel = new VJS.image.model();

    var $dom = $(dom);

    var numberOfFrames = $dom.find('[tag="00280008"]').text();
    window.console.log('numberOfFrames', numberOfFrames);
    if (numberOfFrames === '') {
        numberOfFrames = 1;
    }

    var concatenationUID = $dom.find('[tag="00209161"]').text();
    imageModel.concatenationUID = concatenationUID;

    var seriesUID = $dom.find('[tag="0020000E"]').text();
    imageModel.seriesUID = seriesUID;

    var seriesNumber = $dom.find('[tag="00200011"]').text();
    imageModel.seriesNumber = seriesNumber;
    // all dim uids in this SOP
    //var dimensionOrganizationSequence = $dom.find('[tag="00209221"]').text();

    // list of dims with more info...
    var $dimensionIndexSequence = $dom.find('[tag="00209222"]');
    imageModel.dimensionIndexSequence = [];
    $dimensionIndexSequence.children().each(VJS.Parsers.Dicom.fillDimensionIndexSequence(imageModel));

    var rows = parseInt($dom.find('[tag="00280010"]').text(), 10);
    imageModel._rows = rows;

    var columns = parseInt($dom.find('[tag="00280011"]').text(), 10);
    imageModel.columns = columns;

    var photometricInterpretation = $dom.find('[tag="00280004"] Value').text();
    imageModel.photometricInterpretation = photometricInterpretation;

    // generate the frames!


    // get the pixel data for this frame!
    var imageFilePath = filename + '-raw.8b';
    // no... save all frame only 1 time..!
    dcmjs.utils.execute('dcm2pnm', ['--verbose', '--all-frames', '--write-raw-pnm', filename, imageFilePath]);

    //var $sharedFunctionalGroupsSequence = $dom.find('[tag="52009229"]');

    for (var i = 0; i < numberOfFrames; i++) {
        // run in //

        // get frame specific information
        var frameIndex = i + 1;
        var $perFrameFunctionalGroupsSequence = $dom.find('[tag="52009230"] > [number="' + frameIndex + '"]');

        var stackID = parseInt($perFrameFunctionalGroupsSequence.find('[tag="00209111"] [tag="00209056"] Value').text(), 10);
        var inStackPositionNumber = parseInt($perFrameFunctionalGroupsSequence.find('[tag="00209111"] [tag="00209057"] Value').text(), 10);
        var temporalPositionIndex = parseInt($perFrameFunctionalGroupsSequence.find('[tag="00209111"] [tag="00209128"] Value').text(), 10);

        window.console.log('stackID', stackID);
        if (stackID === 'NaN') {
            stackID = 1;
            inStackPositionNumber = 1;
            temporalPositionIndex = 1;
        }

        var currentStack = null;
        var stackByID = imageModel.stack.filter(filterByID, stackID);

        // Create stack object and add it to image if necessary
        if (stackByID.length === 0) {
            //window.console.log('+++ stack');
            var stackModel = new VJS.stack.model();
            stackModel.uid = stackID;
            imageModel.stack.push(stackModel);
            currentStack = stackModel;
        } else {
            //window.console.log('= stack');
            currentStack = stackByID[0];
        }

        currentStack._rows = rows;
        currentStack._columns = columns;

        // Add frame to Stack
        var currentFrame = null;

        // use dimension instead to know if already there!
        var frameByPositionAndTime = currentStack.frame.filter(positionAndTime, {
            'inStackPositionNumber': inStackPositionNumber,
            'temporalPositionIndex': temporalPositionIndex
        });

        // Create frame object and add it to image if necessary
        if (frameByPositionAndTime.length === 0) {
            //window.console.log('+++ frame');
            var frameModel = new VJS.frame.model();
            frameModel.inStackPositionNumber = inStackPositionNumber;
            frameModel.temporalPositionIndex = temporalPositionIndex;
            currentStack.frame.push(frameModel);
            currentFrame = frameModel;
        } else {
            //window.console.log('= frame');
            currentFrame = frameByPositionAndTime[0];
        }

        // Fill content of a frame

        //
        // General Information
        //
        currentFrame._rows = rows;
        currentFrame._columns = columns;

        //
        // Frame Content Sequence
        //
        currentFrame.stackID = stackID;
        currentFrame.inStackPositionNumber = inStackPositionNumber;
        currentFrame.temporalPositionIndex = temporalPositionIndex;
        // get values from dimension! = Onject vale / label
        var $perFrameDimension = $perFrameFunctionalGroupsSequence.find('[tag="00209111"] [tag="00209157"]');
        currentFrame.dimensionIndexValues = [];
        $perFrameDimension.children().each(VJS.Parsers.Dicom.fillDimensionIndexValues(currentFrame));

        //
        // Plane Position Sequence
        //
        currentFrame.imagePositionPatient.x = parseFloat($perFrameFunctionalGroupsSequence.find('[tag="00209113"] [tag="00200032"] Value[number="1"]').text(), 10);
        currentFrame.imagePositionPatient.y = parseFloat($perFrameFunctionalGroupsSequence.find('[tag="00209113"] [tag="00200032"] Value[number="2"]').text(), 10);
        currentFrame.imagePositionPatient.z = parseFloat($perFrameFunctionalGroupsSequence.find('[tag="00209113"] [tag="00200032"] Value[number="3"]').text(), 10);

        //
        // Plane Orientation Sequence
        //
        currentFrame.imageOrientationPatient.row.x = parseFloat($perFrameFunctionalGroupsSequence.find('[tag="00209116"] [tag="00200037"] Value[number="1"]').text(), 10);
        currentFrame.imageOrientationPatient.row.y = parseFloat($perFrameFunctionalGroupsSequence.find('[tag="00209116"] [tag="00200037"] Value[number="2"]').text(), 10);
        currentFrame.imageOrientationPatient.row.z = parseFloat($perFrameFunctionalGroupsSequence.find('[tag="00209116"] [tag="00200037"] Value[number="3"]').text(), 10);
        currentFrame.imageOrientationPatient.column.x = parseFloat($perFrameFunctionalGroupsSequence.find('[tag="00209116"] [tag="00200037"] Value[number="4"]').text(), 10);
        currentFrame.imageOrientationPatient.column.y = parseFloat($perFrameFunctionalGroupsSequence.find('[tag="00209116"] [tag="00200037"] Value[number="5"]').text(), 10);
        currentFrame.imageOrientationPatient.column.z = parseFloat($perFrameFunctionalGroupsSequence.find('[tag="00209116"] [tag="00200037"] Value[number="6"]').text(), 10);

        //
        // Pixel Measure Sequence
        //
        currentFrame.sliceThickness = parseFloat($perFrameFunctionalGroupsSequence.find('[tag="00289110"] [tag="00180050"] Value').text(), 10);

        currentFrame.pixelSpacing.row = parseFloat($perFrameFunctionalGroupsSequence.find('[tag="00289110"] [tag="00280030"] Value[number="1"]').text(), 10);
        currentFrame.pixelSpacing.column = parseFloat($perFrameFunctionalGroupsSequence.find('[tag="00289110"] [tag="00280030"] Value[number="2"]').text(), 10);

        // use dimension!!

        // currentFrame.pixelData = pnmBuffer;
        // pixel type? (to guess file extension)
        var ppmExtension = 'pgm';
        currentFrame.nbChannels = 1;
        if (imageModel.photometricInterpretation === 'RGB' ||
            imageModel.photometricInterpretation === 'PALETTE COLOR' ||
            imageModel.photometricInterpretation === 'YBR_FULL' ||
            imageModel.photometricInterpretation === 'YBR_FULL_422' ||
            imageModel.photometricInterpretation === 'YBR_PARTIAL_422' ||
            imageModel.photometricInterpretation === 'YBR_PARTIAL_420' ||
            imageModel.photometricInterpretation === 'YBR_RCT') {
            ppmExtension = 'ppm';
            currentFrame.nbChannels = 3;
        }
        var stat = FS.stat(imageFilePath + '.' + i + '.' + ppmExtension);
        var stream = FS.open(imageFilePath + '.' + i + '.' + ppmExtension);
        var pnmBuffer = new Uint8Array(stat.size);
        FS.read(stream, pnmBuffer, 0, stat.size);
        FS.close(stream);

        // // // https://www.branah.com/ascii-converter
        // // // dec to ascii
        // use rows*cols
        var pixelData = pnmBuffer.subarray(15);
        currentFrame.pixelData = pixelData;

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
