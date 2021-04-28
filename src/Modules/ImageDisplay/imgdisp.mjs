import { ModuleClient } from '/common/moduleClient.mjs';

const FADE_DURATION = 250;
const DEFAULT_SHOW_DURATION = 5000;

// A jQuery value holding the image element we use for displaying images
const jImageHolder = $('#imageholder');
const jImage = $('#actualimg');
const jVideoHolder = $('#videoholder');
const jVideo = $('#actualvideo');
const jVideoSource = $('#videosource');

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
	}
	
	get imageDisplayDone() {
		return !this.imageShowing && !this.videoPlaying;
	}
	
	get soundPlayDone() {
		return !this.soundPlaying && !this.videoPlaying;
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
	
	playVideo(videoParameters) {
		jVideoSource.attr('src', videoParameters.url);
		this.setOrClear(jVideo, 'width', videoParameters.width);
		this.setOrClear(jVideo, 'height', videoParameters.height);
		jVideoHolder.css('visibility', '');
		let video = jVideo.get(0);
		video.volume = videoParameters.volume;
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
	
	processRequest(parameters) {
		if (parameters.image) {
			this.imageShowing = true;
			this.showImage(parameters.image);
		}
		
		if (parameters.sound) {
			this.soundPlaying = true;
			
			let volume = parameters.sound.volume;
			if (volume === undefined) {
				volume = 100;
			}
			if (!Number.isNaN(volume)) {
				parameters.sound.volume = volume / 100;
			}
			
			this.playSound(parameters.sound);
		}
		
		if (parameters.video) {
			this.videoPlaying = true;
			
			let volume = parameters.video.volume;
			if (volume === undefined) {
				volume = 100;
			}
			if (!Number.isNaN(volume)) {
				parameters.video.volume = volume / 100;
			}
			
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
		
		this.server.attachToTag('imgdisp');
	}
}

const id = new ImageDisplay();
id.start();
