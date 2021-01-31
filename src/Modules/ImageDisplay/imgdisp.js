const FADE_DURATION = 250;
const DEFAULT_SHOW_DURATION = 5000;

// A jQuery value holding the image element we use for displaying images
var jImageHolder = $('#imageholder');
var jImage = $('#actualimg');

class ImageDisplay extends ModuleClient {
	constructor() {
		super('Image Display');
	}
	
	setOrClear(jTarget, attr, value) {
		if (value) {
			jTarget[attr](value);
		} else {
			jTarget.css(attr, 'auto');
		}
	}
	
	applyImageEffects(imageEffects) {
		Object.keys(imageEffects).forEach(effectName => {
			let name = effectName.trim().toLowerCase();
			if (name in ImageEffects) {
				ImageEffects[name].apply(jImage, imageEffects[effectName]);
			}
		});
	}
	
	clearImageEffects(imageEffects) {
		Object.keys(imageEffects).forEach(effectName => {
			let name = effectName.trim().toLowerCase();
			if (name in ImageEffects) {
				ImageEffects[name].clear(jImage);
			}
		});
	}
	
	showImage(imageParameters) {
		let showDuration = imageParameters.duration || DEFAULT_SHOW_DURATION;
		showDuration -= 2 * FADE_DURATION;
		
		jImage.attr('src', imageParameters.url);
		this.setOrClear(jImage, 'width', imageParameters.width);
		this.setOrClear(jImage, 'height', imageParameters.height);
		
		jImageHolder
		.fadeIn(FADE_DURATION)
		.delay(showDuration)
		.fadeOut(FADE_DURATION, () => this.imageDone(imageParameters));
		
		if (imageParameters.effects) {
			this.applyImageEffects(imageParameters.effects);
		}
	}
	
	playSound(url) {
		// let sound = new Audio(url);
		// $(sound).on('ended', () => this.soundDone());
		// sound.play().catch(() => this.soundDone());
		let markDone = () => this.soundDone();
		this.sounds.playOneShot(url, markDone, markDone);
	}
	
	imageDone(imageParameters) {
		if (imageParameters.effects) {
			this.clearImageEffects(imageParameters.effects);
		}
		
		this.freeBlockingEvent('Image');
		this.server.emit('imgdispDone', imageParameters.url);
	}
	
	soundDone() {
		this.freeBlockingEvent('Sound');
	}
	
	processRequest(parameters) {
		if (parameters.image) {
			this.showImage(parameters.image);
		}
		
		if (parameters.sound) {
			this.playSound(parameters.sound);
		}
	}
	
	start() {
		this.server.on('showImage', parameters => {
			let blockingEvents = [];
			
			if (parameters.image) {
				blockingEvents.push('Image');
			}
			
			if (parameters.sound) {
				blockingEvents.push('Sound');
			}
			
			if (blockingEvents.length == 0) {
				// Empty request, do nothing
				return;
			}
			
			this.performBlockingEvent(
				blockingEvents,
				() => this.processRequest(parameters));
		});
		
		this.server.attachToTag('imgdisp');
	}
}

var id = new ImageDisplay();
id.start();
