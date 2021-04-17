import { ModuleClient } from '/common/moduleClient.mjs';

const FADE_DURATION = 250;
const DEFAULT_SHOW_DURATION = 5000;

// A jQuery value holding the image element we use for displaying images
const jImageHolder = $('#imageholder');
const jImage = $('#actualimg');

const TRANSPARENT_PIXEL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

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
		imageEffects.forEach(effectData => {
			let name = effectData.type.trim().toLowerCase();
			if (name in ImageEffects) {
				ImageEffects[name].apply(jImage, effectData);
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
			// this.applyImageEffects(imageParameters.effects);
			jImage.applyImageEffects(imageParameters.effects);
		}
	}
	
	playSound(soundParameters) {
		let markDone = () => this.soundDone();
		
		let sound = new Audio(soundParameters.url);
		if (Number.isNaN(soundParameters.volume)) {
			soundParameters.volume = 1.0;
		}
		
		sound.volume = soundParameters.volume;
		// sound.addEventListener('ended', markDone);
		// sound.addEventListener('error', markDone);
		sound.play()
			.then(markDone)
			.catch(markDone);
		
		// this.sounds.playOneShot(soundParameters.url, soundParameters.volume, markDone, markDone);
	}
	
	imageDone(imageParameters) {
		jImage.attr('src', TRANSPARENT_PIXEL_IMAGE);
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
			if (!Number.isNaN(parameters.sound.volume)) {
				parameters.sound.volume = parameters.sound.volume / 100;
			}
			
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
			
			if (blockingEvents.length === 0) {
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

const id = new ImageDisplay();
id.start();
