import { ModuleClient } from '/common/moduleClient.mjs';
import { setOrClear } from '/common/clientUtils.mjs';

const FADE_DURATION = 250;
const DEFAULT_SHOW_DURATION = 5000;

// A jQuery value holding the image element we use for displaying images
const jImageHolder = $('#imageholder');
const jImage = $('#actualimg');
const jVideoHolder = $('#videoholder');
const jVideo = $('#actualvideo');
const jVideoSource = $('#videosource');
const jNamed = $('#named');

const TRANSPARENT_PIXEL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

class ImageDisplay extends ModuleClient {
	constructor() {
		super('Image Display');
		this.imageShowing = false;
		this.soundPlaying = false;
		this.videoPlaying = false;
		
		let markVideoDone = () => this.videoDone();
		jVideo[0].onended = markVideoDone;
		jVideo[0].onerror = markVideoDone;
		
		this.namedElements = {};
	}
	
	get imageDisplayDone() {
		return !this.imageShowing && !this.videoPlaying;
	}
	
	get soundPlayDone() {
		return !this.soundPlaying && !this.videoPlaying;
	}
	
	applyImageEffects(imageEffects) {
		imageEffects.forEach(effectData => {
			let name = effectData.type.trim().toLowerCase();
			if (name in ImageEffects) {
				ImageEffects[name].apply(jImage, effectData);
			}
		});
	}
	
	clearImageEffects(imageEffects, jElement) {
		jElement = jElement || jImage;
		Object.keys(imageEffects).forEach(effectName => {
			let name = effectName.trim().toLowerCase();
			if (name in ImageEffects) {
				ImageEffects[name].clear(jElement);
			}
		});
	}
	
	showImage(imageParameters) {
		let showDuration = imageParameters.duration || DEFAULT_SHOW_DURATION;
		showDuration -= 2 * FADE_DURATION;
		
		jImage.attr('src', imageParameters.url);
		setOrClear(jImage, 'width', imageParameters.width);
		setOrClear(jImage, 'height', imageParameters.height);
		
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
		
		sound.volume = this.normalizeVolume(soundParameters.volume);
		// sound.addEventListener('ended', markDone);
		// sound.addEventListener('error', markDone);
		sound.play()
			.then(markDone)
			.catch(markDone);
		
		// this.sounds.playOneShot(soundParameters.url, soundParameters.volume, markDone, markDone);
	}
	
	playVideo(videoParameters, jElement, jElementSource, jElementHolder) {
		jElement = jElement || jVideo;
		jElementSource = jElementSource || jVideoSource;
		jElementHolder = jElementHolder || jVideoHolder;
		
		jElementSource.attr('src', videoParameters.url);
		setOrClear(jElement, 'width', videoParameters.width);
		setOrClear(jElement, 'height', videoParameters.height);
		jElementHolder.css('visibility', '');
		let video = jElement.get(0);
		video.volume = this.normalizeVolume(videoParameters.volume);
		video.load();
		video.play();
	}
	
	imageDone(imageParameters) {
		jImage.attr('src', TRANSPARENT_PIXEL_IMAGE);
		if (imageParameters.effects) {
			this.clearImageEffects(imageParameters.effects);
		}
		
		this.imageShowing = false;
		if (this.imageDisplayDone) {
			this.freeBlockingEvent('Image');
		}
		
		this.server.emit('imgdispDone', imageParameters.url);
	}
	
	soundDone() {
		this.soundPlaying = false;
		if (this.soundPlayDone) {
			this.freeBlockingEvent('Sound');
		}
	}
	
	videoDone() {
		if (!this.videoPlaying) {
			return;
		}
		
		jVideoHolder.css('visibility', 'hidden');
		jVideoSource.attr('src', '');
		this.videoPlaying = false;
		
		if (this.imageDisplayDone) {
			this.freeBlockingEvent('Image');
		}
		
		if (this.soundPlayDone) {
			this.freeBlockingEvent('Sound');
		}
	}
	
	normalizeVolume(volume) {
		if (volume === undefined) {
			volume = 100;
		}
		if (!Number.isNaN(volume)) {
			volume = volume / 100;
		}
		
		return volume;
	}
	
	showNamed(parameters) {
		this.namedElements[parameters.name] = {};
		
		if (parameters.image) {
			this.showNamedImage(parameters.image, parameters.name);
		}
		
		if (parameters.sound) {
			this.showNamedSound(parameters.sound);
		}
		
		if (parameters.video) {
			this.showNamedVideo(parameters.video, parameters.name);
		}
	}
	
	showNamedImage(imageParameters, name) {
		let jContainer = $(`<div class='inner'></div>`);
		let jElement = $(`<img id='actualimg' class='shadowfilter' src="" alt="">`);
		jContainer.append(jElement);
		
		jElement.hide();
		jElement.attr('src', imageParameters.url);
		setOrClear(jImage, 'width', imageParameters.width);
		setOrClear(jImage, 'height', imageParameters.height);
		
		jElement.fadeIn(FADE_DURATION);
		
		if (imageParameters.effects) {
			jElement.applyImageEffects(imageParameters.effects);
		}
		
		this.namedElements[name].image = { jContainer, jElement, imageParameters };
		jNamed.append(jContainer);
	}
	
	hideNamedImage(name) {
		let jContainer = this.namedElements[name].image.jContainer;
		// elements.jElement.attr('src', TRANSPARENT_PIXEL_IMAGE);
		// if (elements.imageParameters.effects) {
		// 	this.clearImageEffects(elements.imageParameters.effects, elements.jElement);
		// }
		
		jContainer.fadeOut(FADE_DURATION, () => jContainer.remove());
	}
	
	showNamedSound(soundParameters) {
		let sound = new Audio(soundParameters.url);
		sound.volume = this.normalizeVolume(soundParameters.volume);
		sound.play().then().catch();
	}
	
	showNamedVideo(videoParameters, name) {
		let jElement = $(`<video class="inner" loop></video>`);
		let jElementSource = $(`<source src="">`);
		jElement.append(jElementSource);
		
		this.playVideo(videoParameters, jElement, jElementSource, jElement);
		this.namedElements[name].video = { jElement };
		
		jNamed.append(jElement);
	}
	
	hideNamedVideo(name) {
		let jElement = this.namedElements[name].video.jElement;
		jElement.fadeOut(FADE_DURATION, () => jElement.remove());
	}
	
	hideNamed(name) {
		let elements = this.namedElements[name];
		if (elements.image) {
			this.hideNamedImage(name);
		}
		if (elements.video) {
			this.hideNamedVideo(name);
		}
		
		delete this.namedElements[name];
	}
	
	toggleNamed(parameters) {
		if (parameters.name in this.namedElements) {
			this.hideNamed(parameters.name);
		} else {
			this.showNamed(parameters);
		}
	}
	
	processRequest(parameters) {
		if (parameters.image) {
			this.imageShowing = true;
			this.showImage(parameters.image);
		}
		
		if (parameters.sound) {
			this.soundPlaying = true;
			this.playSound(parameters.sound);
		}
		
		if (parameters.video) {
			this.videoPlaying = true;
			this.playVideo(parameters.video);
		}
	}
	
	start() {
		this.server.on('showImage', parameters => {
			let blockingEvents = [];
			
			if (parameters.image || parameters.video) {
				blockingEvents.push('Image');
			}
			
			if (parameters.sound || parameters.video) {
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
		
		this.server.on('showNamed', parameters => this.showNamed(parameters));
		this.server.on('hideNamed', parameters => this.hideNamed(parameters));
		this.server.on('toggleNamed', parameters => this.toggleNamed(parameters));
		
		this.server.attachToTag('imgdisp');
	}
}

const id = new ImageDisplay();
id.start();
