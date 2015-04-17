/*global dicomParser, JpxImage, fetch*/

'use strict';

var VJS = VJS || {};
VJS.Loaders = VJS.Loaders || {};

VJS.Loaders.Dicom = function(files) {
    this.files = files;
};

VJS.Loaders.Dicom.prototype.loadFiles = function() {
    function createVolumeObject(byteArray, dataset, id, frame) {
        frame = 0;
        id = 'uniqueID';

        //
        // nb of channels
        //
        window.console.log('==== nb of channels (i.e. color) ====');
        var nbChannels = -1;
        var photometricInterpretation = dataset.string('x00280004');

        // color?
        if (photometricInterpretation === 'RGB' ||
            photometricInterpretation === 'PALETTE COLOR' ||
            photometricInterpretation === 'YBR_FULL' ||
            photometricInterpretation === 'YBR_FULL_422' ||
            photometricInterpretation === 'YBR_PARTIAL_422' ||
            photometricInterpretation === 'YBR_PARTIAL_420' ||
            photometricInterpretation === 'YBR_RCT') {
            nbChannels = 3;
        } else {
            nbChannels = 1;
        }

        window.console.log('nbChannels:', nbChannels);

        //
        // spacing
        //
        window.console.log('==== pixel spacing ====');
        var pixelSpacing = {
            row: undefined,
            column: undefined,
            z: undefined
        };

        var pixelSpacingRaw = dataset.string('x00280030');
        if (pixelSpacingRaw && pixelSpacingRaw.length > 0) {
            var split = pixelSpacingRaw.split('\\');
            pixelSpacing = {
                row: parseFloat(split[0]),
                column: parseFloat(split[1]),
                z: undefined
            };
        } else {
            pixelSpacing = {
                row: undefined,
                column: undefined,
                z: undefined
            };
        }

        window.console.log('pixelSpacing:', pixelSpacing);

        //
        // spacing
        //
        window.console.log('==== rows and columns ====');
        var rows = dataset.uint16('x00280010');
        var height = rows;
        var columns = dataset.uint16('x00280011');
        var width = columns;
        var numPixels = rows * columns;

        window.console.log('rows:', rows);
        window.console.log('columns:', columns);
        window.console.log('numPixels:', numPixels);


        //
        // rescale slope and intercept
        //
        window.console.log('==== rescale slope and intercept ====');
        var rescaleSlopeIntercept = {
            intercept: 0.0,
            slope: 1.0
        };

        var rescaleIntercept = dataset.floatString('x00281052');
        var rescaleSlope = dataset.floatString('x00281053');

        if (rescaleIntercept) {
            rescaleSlopeIntercept.intercept = rescaleIntercept;
        }
        if (rescaleSlope) {
            rescaleSlopeIntercept.slope = rescaleSlope;
        }

        window.console.log('rescaleSlopeIntercept:', rescaleSlopeIntercept);

        //
        // bytes per pixel
        //
        window.console.log('==== bytes per pixel ====');

        function getPixelFormat(dataset) {
            var pixelRepresentation = dataset.uint16('x00280103');
            var bitsAllocated = dataset.uint16('x00280100');
            if (pixelRepresentation === 0 && bitsAllocated === 8) {
                return 1; // unsigned 8 bit
            } else if (pixelRepresentation === 0 && bitsAllocated === 16) {
                return 2; // unsigned 16 bit
            } else if (pixelRepresentation === 1 && bitsAllocated === 16) {
                return 3; // signed 16 bit data
            }
        }

        var bytesPerPixel = -1;
        var pixelFormat = -1;
        if (nbChannels === 1) {
            pixelFormat = getPixelFormat(dataset);
            if (pixelFormat === 1) {
                bytesPerPixel = 1;
            } else if (pixelFormat === 2 || pixelFormat === 3) {
                bytesPerPixel = 2;
            } else {
                throw 'unknown pixel format';
            }
        } else {
            bytesPerPixel = 4;
        }

        var sizeInBytes = numPixels * bytesPerPixel;

        window.console.log('bytesPerPixel:', bytesPerPixel);
        window.console.log('sizeInBytes:', sizeInBytes);

        //
        // window width and center
        //
        window.console.log('==== window width and center ====');
        var windowWidthCenter = {
            windowCenter: undefined,
            windowWidth: undefined
        };

        var windowCenter = dataset.floatString('x00281050');
        var windowWidth = dataset.floatString('x00281051');

        if (windowCenter) {
            windowWidthCenter.windowCenter = windowCenter;
        }
        if (windowWidth) {
            windowWidthCenter.windowWidth = windowWidth;
        }

        window.console.log('windowWidthCenter:', windowWidthCenter);

        //
        // extract pixels
        //
        window.console.log('==== extract pixels (use promise) ====');
        var pixelDataElement = dataset.elements.x7fe00010;
        var pixelDataOffset = pixelDataElement.dataOffset;
        var transferSyntax = dataset.string('x00020010');
        var frameSize = width * height * 3;
        var frameOffset = pixelDataOffset + frame * frameSize;
        //var encodedPixelData;// = new Uint8Array(byteArray.buffer, frameOffset);

        window.console.log('pixelDataElement:', pixelDataElement);
        window.console.log('pixelDataOffset:', pixelDataOffset);
        window.console.log('transferSyntax:', transferSyntax);
        window.console.log('frameSize:', frameSize);
        window.console.log('frameOffset:', frameOffset);

        // EXTRACT PIXEL!!!!
        // N channels support...?
        // JPEG COMPRESSED
        // go parse!
        //rename to rawData
        var pixelData = null;

        var textureData = null;
        // nb channels...?
        if (photometricInterpretation === 'RGB') {
            pixelData = new Uint8Array(byteArray.buffer, frameOffset, frameSize);
            window.console.log('rgb not decoded');
            // to rgba for texting purpose
            // (data to fill the texture)
            textureData = new Uint8Array(width * height * 4);
            if (pixelData === undefined) {
                throw 'decodeRGB: pixelData must not be undefined';
            }
            if (pixelData.length % 3 !== 0) {
                throw 'decodeRGB: pixelData length must be divisble by 3';
            }

            var rgbIndex = 0;
            var rgbaIndex = 0;
            for (var i = 0; i < numPixels; i++) {
                textureData[rgbaIndex++] = pixelData[rgbIndex++]; // red
                textureData[rgbaIndex++] = pixelData[rgbIndex++]; // green
                textureData[rgbaIndex++] = pixelData[rgbIndex++]; // blue
                textureData[rgbaIndex++] = 255; //alpha
            }

            window.console.log(textureData);

            // to rgba
            // encodedPixelData = new Uint8Array(byteArray.buffer, frameOffset, frameSize);
            // cornerstoneWADOImageLoader.decodeRGB(encodedPixelData, imageData.data);
            // deferred.resolve(imageData);
            // return deferred;
        } else if (photometricInterpretation === 'YBR_FULL') {
            pixelData = new Uint8Array(byteArray.buffer, frameOffset, frameSize);
            window.console.log('ybr not decoded');
            // to rgba
            // need to shuffle pixels
            // encodedPixelData = new Uint8Array(byteArray.buffer, frameOffset, frameSize);
            // cornerstoneWADOImageLoader.decodeYBRFull(encodedPixelData, imageData.data);
            // deferred.resolve(imageData);
            // return deferred;
        } else if (photometricInterpretation === 'YBR_FULL_422' &&
            transferSyntax === '1.2.840.10008.1.2.4.50') {
            window.console.log(photometricInterpretation, transferSyntax, 'not supported');
            //pixelData = new Uint8Array(byteArray.buffer, frameOffset, frameSize);
        } else {
            if (transferSyntax === '1.2.840.10008.1.2.4.90' || // JPEG 2000 lossless
                transferSyntax === '1.2.840.10008.1.2.4.91') { // JPEG 2000 lossy

                var compressedPixelData = dicomParser.readEncapsulatedPixelData(dataset, dataset.elements.x7fe00010, frame);
                var jpxImage = new JpxImage();
                jpxImage.parse(compressedPixelData);

                var j2kWidth = jpxImage.width;
                var j2kHeight = jpxImage.height;
                if (j2kWidth !== width) {
                    throw 'JPEG2000 decoder returned width of ' + j2kWidth + ', when ' + width + ' is expected';
                }
                if (j2kHeight !== height) {
                    throw 'JPEG2000 decoder returned width of ' + j2kHeight + ', when ' + height + ' is expected';
                }
                var componentsCount = jpxImage.componentsCount;
                if (componentsCount !== 1) {
                    throw 'JPEG2000 decoder returned a componentCount of ' + componentsCount + ', when 1 is expected';
                }
                var tileCount = jpxImage.tiles.length;
                if (tileCount !== 1) {
                    throw 'JPEG2000 decoder returned a tileCount of ' + tileCount + ', when 1 is expected';
                }
                var tileComponents = jpxImage.tiles[0];
                pixelData = tileComponents.items;
            } else {
                if (pixelFormat === 1) {
                    frameOffset = pixelDataOffset + frame * numPixels;
                    pixelData = new Uint8Array(dataset.byteArray.buffer, frameOffset, numPixels);
                } else if (pixelFormat === 2) {
                    frameOffset = pixelDataOffset + frame * numPixels * 2;
                    pixelData = new Uint16Array(dataset.byteArray.buffer, frameOffset, numPixels);
                } else if (pixelFormat === 3) {
                    frameOffset = pixelDataOffset + frame * numPixels * 2;
                    pixelData = new Int16Array(dataset.byteArray.buffer, frameOffset, numPixels);
                }
            }

        }

        // GET MIN-MAX
        window.console.log('multi frame support + get min and max...?');
    }

    //    // fetch to load...
    var list = [];
    var urls = this.files;
    // var results = [];

    urls.forEach(function(url, i) {
        list.push(
            fetch(url).then(function(response) {
                response.blob().then(function(buffer) {

                    var promise = new Promise(
                        function(resolve) {
                            window.console.log('all requests finished!');
                            // parse only 1 dcm yet...
                            window.console.log(buffer.size);
                            window.console.log('index: ', i);

                            var myReader = new FileReader();
                            myReader.addEventListener('loadend', function(e) {
                                var byteArray = new Uint8Array(e.srcElement.result);
                                var kb = byteArray.length / 1024;
                                var mb = kb / 1024;
                                var byteStr = mb > 1 ? mb.toFixed(3) + ' MB' : kb.toFixed(0) + ' KB';
                                window.console.log(byteStr);

                                var dataset = dicomParser.parseDicom(byteArray);
                                createVolumeObject(byteArray, dataset, 0, 0);
                                window.console.log('yo');
                                resolve('yo');
                            });
                            //start the reading process.
                            myReader.readAsArrayBuffer(buffer);
                            window.console.log('end of promise...');
                        });

                    promise.then(function() {
                        window.console.log('smoooth');
                        return 'smooth';
                    });

                });
            })
        );
    });

    return Promise
        .all(list)
        .then(function(message){
            window.console.log('so what...?');
        })
        .catch(function(error) {
            window.console.log(error);
        });
};
