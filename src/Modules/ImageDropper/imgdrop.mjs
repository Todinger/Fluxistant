import { ModuleClient } from "/common/moduleClient.mjs";
import { randomInt, applyDefaults } from "/common/clientUtils.mjs";

const DEFAULTS = {
	minDuration: 500,
	maxDuration: 6000,
	width: 50,
	height: 50,
	count: 30,
};

class ImageDropper extends ModuleClient {
	constructor() {
		super('Image Dropper');
	}
	
	launchImage(image, startPositionY, stepAction) {
		// We use double this duration along with double the distance
		// to avoid the slowing at the end of the default easing
		let duration = randomInt(image.minDuration, image.maxDuration);
		let jImage = $(`<img class="faller" src="${image.url}" alt="">`);
		jImage
		.width(image.width).height(image.height)
		.css({
			position: "absolute",
			marginLeft: 0, marginTop: startPositionY,
		})
		.css({
			left: Math.floor(
				Math.random() * (window.innerWidth - 2 * image.width))
		})
		.animate(
			{ top: `${stepAction}=${2 * (window.innerHeight + image.height)}px` },
			duration * 2,
			function() {
				$(this).remove();
			})
		.appendTo("#imageholder");
		
		if (image.effects) {
			jImage.applyImageEffects(image.effects);
		}
	}
	
	dropImage(image) {
		this.launchImage(image, 0, '+');
	}
	
	floatImage(image) {
		this.launchImage(image, window.innerHeight + image.height, '-');
	}
	
	dropImages(image) {
		for (let i = 0; i < image.count; i++) {
			this.dropImage(image);
		}
	}
	
	floatImages(image) {
		for (let i = 0; i < image.count; i++) {
			this.floatImage(image);
		}
	}
	
	start() {
		this.server.on('dropImage', image => {
			applyDefaults(image, DEFAULTS);
			this.dropImages(image);
		});
		
		this.server.on('floatImage', image => {
			applyDefaults(image, DEFAULTS);
			this.floatImages(image);
		});
		
		this.server.attach();
		this.server.attachToTag('imgdrop');
	}
}

const fs = new ImageDropper();
fs.start();
