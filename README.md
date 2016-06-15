# image-blobber

A small module for reading image file blob dimensions and scaling them to a max height or width.

## Installation

image-blobber can be installed from [npm](https://npmjs.com/package/image-blobber).

```bash
npm install --save image-blobber
```

```js
//ES6
import * as imageblobber from "image-blobber";

//Node-style require
const imageblobber = require("image-blobber");
```

## Usage

All image-blobber functions are promisified.

### Supported: boolean

An exported boolean that indicates whether the current environment supports the [FileReader](https://developer.mozilla.org/en-US/docs/Web/API/FileReader) needed by the `getFileBlobs` function. If `false`, `getFileBlobs` will throw an error. 

```ts
import {Supported} from "image-blobber";

if (!Supported)
{
    throw new Error("Your browser does not support the FileReader API.");
}
```

### getFileBlobs(input: HtmlInputElement): Promise\<File[]\>

Gets all file blobs for an HTML5 file input element.

```ts
import {getFileBlobs} from "image-blobber";

const input = document.getElementById("my-file-input");

getFileBlobs(input).then((blobs) =>
{
    console.log(blobs.length); // 3
});
```

### getBase64(file: File): Promise\<BlobDetails\>

Gets the base64 string, filename and dimensions for the given image file. See [below](#interfaces) for the `BlobDetails` interface.

```ts
import {getBase64} from "image-blobber";

const file: File = ...;

getBase64(file).then((details) =>
{
    console.log(details.filename);   // "my-file.png"
    console.log(details.base64);     // "data:image/png;base64,..."
    console.log(details.dimensions); // { height: 150, width: 75 }
});
```

### scaleBase64(base64: string, options: ScaleOptions): Promise\<ScaleResult\>

Scales a base64 image string according to the options passed in. See [below](#interfaces) for the `ScaleOptions` and `ScaleResult` interfaces.

```ts
import {scaleBase64} from "image-blobber";

const base64: string = ...;

scaleBase64(base64, {height: 400, width: 400, preserveRatio: true}).then((scaledImage) =>
{
    console.log(scaledImage.scaledBase64);     // "data:image/png;base64,..."
    console.log(scaledImage.scaledDimensions); // { height: 150, width: 75 }
});
```

### Tie it all together

```ts
import * as Promise from "bluebird";
import * as blobber from "file-blobber";

const input = document.querySelector("input") as HTMLInputElement;

blobber.getFileBlobs(input)
    .then((blobs) =>
    {
        return Promise.all(blobs.map(blob => blobber.getBase64(blob)));
    })
    .then((images) =>
    {
        return Promise.all(images.map(i => blobber.scaleBase64(i.base64, {height: 400, width: 400, preserveRatio: true})));
    })
    .then((scaledImages) =>
    {
        // Do something with the scaled images.
    })
```

## Interfaces

The following interfaces are used or returned at some point by image-blobber. If you're using Typescript, the compiler should automatically pick up these definitions when image-blobber is installed.

### Dimensions

| Property | Type | Comments |
| -------- | ---- | -------- |
| height | number | The image's height. |
| width  | number | The image's width. |

### BlobDetails

| Property | Type | Comments |
| -------- | ---- | -------- |
| filename | string | The name of the file as it appears on the user's machine. |
| base64 | string | A base64 string representing the image. Can be set as an `<img />` element's `src`. |
| dimensions | [Dimensions](#dimensions) | The image's height and width dimensions. |

### ScaleResult

| Property | Type | Comments |
| -------- | ---- | -------- |
| scaledBase64 | string | A base64 string representing the scaled image. Can be set as an `<img />` element's `src`. |
| scaledDimensions | [Dimensions](#dimensions) | The scaled image's new height and width dimensions. |

### ScaleOptions

| Property | Type | Comments |
| -------- | ---- | -------- |
| height | number | The maximum height allowed for a scaled image. Optional, but options must include either a height or width. |
| width | number | The maximum width allowed for a scaled image. Optional, but options must include either a height or width. |
| preserveRation | boolean | Whether aspect ratio should be preserved. If true, image will be scaled to an aspect ratio that satisfies both `height` and `width`. Default true. |