"use strict";
var Promise = require("bluebird");
/**
 * Whether the current environment supports FileReader. Module cannot be used if this value is false.
 */
exports.Supported = typeof FileReader !== "undefined";
/**
 * Gets the image element and dimensions for a base64 string.
 */
function getImageData(base64) {
    return new Promise(function (resolve, reject) {
        var image = new Image();
        image.onload = function (event) {
            var dimensions = {
                height: image.naturalHeight,
                width: image.naturalWidth,
            };
            return resolve({
                dimensions: dimensions,
                image: image,
            });
        };
        image.onabort = function (event) { return reject(event); };
        image.src = base64;
    });
}
/**
 * Gets all image blobs from the given HTML file input.
 */
function getFileBlobs(input) {
    var files = [];
    for (var i = 0; i < input.files.length; i++) {
        files.push(input.files.item(i));
    }
    // Promisified for consistency with the rest of the lib.
    return Promise.resolve(files);
}
exports.getFileBlobs = getFileBlobs;
/**
 * Gets the base64 string and dimension details for an image file blob.
 */
function getBase64(file) {
    return new Promise(function (resolve, reject) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(file);
        fileReader.onload = function (event) {
            var base64 = event.target.result;
            var output = getImageData(base64).then(function (imageData) {
                var details = {
                    base64: base64,
                    filename: file.name,
                    dimensions: imageData.dimensions,
                };
                return details;
            });
            return resolve(output);
        };
        fileReader.onabort = function (err) {
            return reject(err);
        };
    });
}
exports.getBase64 = getBase64;
/**
 * Scales a base64 string to the given dimensions, preserving aspect ratio by default.
 */
function scaleBase64(base64, options) {
    if (typeof options.height !== "number" && typeof options.width !== "number") {
        throw new Error("scaleBase64() did not receive valid scaling options. options.height or options.width must be a number.");
    }
    //Get the image element and its full dimensions
    return getImageData(base64).then(function (imageData) {
        var fullDimensions = imageData.dimensions;
        var dimensions = {
            height: fullDimensions.height,
            width: fullDimensions.width
        };
        if (options.preserveRatio === false) {
            dimensions.height = options.height || dimensions.height;
            dimensions.width = options.width || dimensions.width;
        }
        else {
            var scaleDown = (options.height && fullDimensions.height > options.height) || (options.width && fullDimensions.width > options.width);
            if (!scaleDown) {
                var result_1 = {
                    scaledBase64: base64,
                    scaledDimensions: dimensions,
                };
                return result_1;
            }
            var largerDimension = fullDimensions.height > fullDimensions.width ? fullDimensions.height : fullDimensions.width;
            var percentage = 1;
            if (options.height > 0 && options.width > 0) {
                // Scale the largest dimension
                var dimension = fullDimensions.height > fullDimensions.width ? options.height : options.width;
                percentage = dimension / largerDimension;
            }
            else if (options.height > 0) {
                percentage = options.height / largerDimension;
            }
            else if (options.width > 0) {
                percentage = options.width / largerDimension;
            }
            dimensions.height = fullDimensions.height * percentage;
            dimensions.width = fullDimensions.width * percentage;
        }
        var canvas = document.createElement("canvas");
        var context = canvas.getContext('2d');
        canvas.height = dimensions.height;
        canvas.width = dimensions.width;
        context.drawImage(imageData.image, 0, 0, fullDimensions.width, fullDimensions.height, 0, 0, dimensions.width, dimensions.height);
        var result = {
            scaledBase64: canvas.toDataURL(),
            scaledDimensions: dimensions
        };
        return result;
    });
}
exports.scaleBase64 = scaleBase64;
;
