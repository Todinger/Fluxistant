
const DEFAULTS = {
	minDuration: 500,
	maxDuration: 6000,
	width: 150,
	height: 150,
	count: 30,
};

class FShower extends EffectClient {
	constructor() {
		super('Image Dropper');
	}
	
	dropImage(image) {
		console.log(image);
		// We use double this duration along with double the distance
		// to avoid the slowing at the end of the default easing
		let duration = randomInt(image.minDuration, image.maxDuration);
		let jImage = $(`<img class="faller" src="${image.url}">`);
		jImage
		.width(image.width).height(image.height)
		.css({ 
			position: "absolute",
			marginLeft: 0, marginTop: 0,
		})
		.css({
			left: Math.floor(
				Math.random() * (window.innerWidth - 2 * image.width))
		})
		.animate(
			{ top: `+=${2 * (window.innerHeight + image.height)}px` },
			duration * 2,
			function() {
				$(this).remove();
			})
		.appendTo("#imageholder");
		
		if (image.effect) {
			if (typeof image.effect == 'string') {
				image.effect = {
					name: image.effect,
					effectData: {},
				}
			}
			
			jImage.applyEffect(image.effect.name, image.effect.effectData);
		}
	}
	
	dropImages(image) {
		for (let i = 0; i < image.count; i++) {
			this.dropImage(image);
		}
	}
	
	start() {
		this.server.on('dropImage', image => {
			applyDefaults(image, DEFAULTS);
			this.dropImages(image);
		});
		
		this.server.attachToTag('imgdrop');
	}
}

var fs = new FShower();
fs.start();