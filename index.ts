export interface Dimensions {
	height: number;

	width: number;
}

export interface BlobData {
	/**
	 * The base64 image.
	 */
	base64: string;

	/**
	 * The image's dimensions.
	 */
	dimensions: Dimensions;
}

export interface BlobDetails extends BlobData {
	/**
	 * The image's filename as it is on the user's machine.
	 */
	filename: string;
}

export interface ScaleOptions {
	/**
	 * The maximum height allowed for a scaled image. Optional, but options must include either a height or width.
	 */
	height?: number;

	/**
	 * The maximum width allowed for a scaled image. Optional, but options must include either a height or width.
	 */
	width?: number;

	/**
	 * Whether aspect ratio should be preserved. If true, image will be scaled to an aspect ratio that satisfies both `height` and `width`. Default true.
	 */
	preserveRatio?: boolean;
}

/**
 * Whether the current environment supports FileReader. Module cannot be used if this value is false.
 */
export const Supported = typeof FileReader !== "undefined";

/**
 * Gets the image element and dimensions for a base64 string.
 */
function getImageData(base64: string) {
	return new Promise<{ dimensions: Dimensions; image: HTMLImageElement }>((resolve, reject) => {
		const image = new Image();

		image.onload = event => {
			const dimensions: Dimensions = {
				height: image.naturalHeight,
				width: image.naturalWidth
			};

			return resolve({
				dimensions: dimensions,
				image: image
			});
		};

		image.onabort = event => reject(event);

		image.src = base64;
	});
}

/**
 * Gets all image blobs from the given HTML file input.
 */
export function getFileBlobs(input: HTMLInputElement): Promise<File[]> {
	const files: File[] = [...(input.files || [])];

	// Promisified for consistency with the rest of the lib.
	return Promise.resolve(files);
}

/**
 * Gets the base64 string and dimension details for an image file blob.
 */
export function getBase64(file: File): Promise<BlobDetails> {
	return new Promise<BlobDetails>((resolve, reject) => {
		const fileReader = new FileReader();

		fileReader.readAsDataURL(file);

		fileReader.onload = event => {
			const base64 = (event.target as any).result as string;
			const output = getImageData(base64).then(imageData => {
				const details: BlobDetails = {
					base64: base64,
					filename: file.name,
					dimensions: imageData.dimensions
				};

				return details;
			});

			return resolve(output);
		};

		fileReader.onabort = err => {
			return reject(err);
		};
	});
}

/**
 * Scales a base64 string to the given dimensions, preserving aspect ratio by default.
 */
export function scaleBase64(base64: string, options: ScaleOptions): Promise<BlobData> {
	if (typeof options.height !== "number" && typeof options.width !== "number") {
		throw new Error(
			"scaleBase64() did not receive valid scaling options. options.height or options.width must be a number."
		);
	}

	//Get the image element and its full dimensions
	return getImageData(base64).then(imageData => {
		const fullDimensions = imageData.dimensions;
		let dimensions = {
			height: fullDimensions.height,
			width: fullDimensions.width
		};

		if (options.preserveRatio === false) {
			dimensions.height = options.height || dimensions.height;
			dimensions.width = options.width || dimensions.width;
		} else {
			const scaleDown =
				(options.height && fullDimensions.height > options.height) ||
				(options.width && fullDimensions.width > options.width);

			if (!scaleDown) {
				const result: BlobData = {
					base64: base64,
					dimensions: dimensions
				};

				return result;
			}

			const largerDimension =
				fullDimensions.height > fullDimensions.width ? fullDimensions.height : fullDimensions.width;
			const chosenHeight = options.height || 0;
			const chosenWidth = options.width || 0;
			let percentage: number = 1;

			if (chosenHeight > 0 && chosenWidth > 0) {
				// Scale the largest dimension
				const dimension = fullDimensions.height > fullDimensions.width ? chosenHeight : chosenWidth;

				percentage = dimension / largerDimension;
			} else if (chosenHeight > 0) {
				percentage = chosenHeight / largerDimension;
			} else if (chosenWidth > 0) {
				percentage = chosenWidth / largerDimension;
			}

			dimensions.height = fullDimensions.height * percentage;
			dimensions.width = fullDimensions.width * percentage;
		}

		const canvas = document.createElement("canvas") as HTMLCanvasElement;
		const context = canvas.getContext("2d");

		if (!context) {
			throw new Error("image-blobber package failed to get canvas context.");
		}

		canvas.height = dimensions.height;
		canvas.width = dimensions.width;

		context.drawImage(
			imageData.image,
			0,
			0,
			fullDimensions.width,
			fullDimensions.height,
			0,
			0,
			dimensions.width,
			dimensions.height
		);

		const result: BlobData = {
			base64: canvas.toDataURL(),
			dimensions: dimensions
		};

		return result;
	});
}
