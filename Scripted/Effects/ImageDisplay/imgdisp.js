// const DEFAULT_WIDTH = 300;
// const DEFAULT_HEIGHT = 300;
const FADE_DURATION = 250;
const DEFAULT_SHOW_DURATION = 5000;

// jQuery Extensions
// Based on:
// https://stackoverflow.com/questions/5396119/using-jquery-delay-with-css
function extendJQueryFunction(functionName) {
	$.fn.extend({
		['q' + functionName]: function(value) {
			return $(this).queue(function(next) {
				$(this)[functionName](value);
				next();
			});
		}
	});
}

extendJQueryFunction('css');
extendJQueryFunction('width');
extendJQueryFunction('height');


// A jQuery value holding the image element we use for displaying images
var jImageHolder = $('#imageholder');
var jImage = $('#actualimg');

class ImageEffects {
	static get glow() {
		return {
			DEFAULTS: {
				SIZE: 15,
				COLOR: '#ffffcc',
			},
			apply: function(jTarget, effectData) {
				let size = effectData.size || ImageEffects.glow.DEFAULTS.SIZE;
				let color = effectData.color || ImageEffects.glow.DEFAULTS.COLOR;
				
				let shadowfilter = `drop-shadow(0px 0px ${size}px ${color})`;
				jTarget
				.css('-webkit-filter', shadowfilter)
				.css('filter', shadowfilter);
			},
			clear: function(jTarget) {
				jTarget
				.css('-webkit-filter', '')
				.css('filter', '');
			}
		}
	}
	
	static get shadow() {
		return {
			DEFAULTS: {
				SIZE: 15,
			},
			apply: function(jTarget, effectData) {
				let size = effectData.size || ImageEffects.shadow.DEFAULTS.SIZE;
				let shadowfilter = `drop-shadow(0px 0px ${size}px rgba(0, 0, 0, 1))`;
				jTarget
				.css('-webkit-filter', shadowfilter)
				.css('filter', shadowfilter);
			},
			clear: function(jTarget) {
				jTarget
				.css('-webkit-filter', '')
				.css('filter', '');
			}
		}
	}
	
	static get dundundun() {
		return {
			DEFAULTS: {
				DURATION_SMALL: 584,
				DURATION_MEDIUM: 438,
				DURATION_LARGE: DEFAULT_SHOW_DURATION,
				
				SIZE_SMALL: 300,
				SIZE_MEDIUM: 400,
				SIZE_LARGE: 500,
			},
			shake: function(jTarget, amount, duration, onFinished) {
				if (jTarget.shakeTimeLeft === undefined ||
					jTarget.shakeTimeLeft <= 0) {
					delete jTarget.shakeTimeLeft;
					if (onFinished) {
						onFinished();
					}
					
					return;
				}
				
				jTarget
				.stop()
				.rotate({
					angle:0,
					animateTo: amount,
					duration: duration,
					callback: function() {
						if (jTarget.shakeTimeLeft) {
							jTarget.shakeTimeLeft -= duration;
						}
						
						ImageEffects.dundundun.shake(
							jTarget,
							-amount,
							duration,
							onFinished);
					}
				});
			},
			apply: function(jTarget, effectData) {
				let durationSmall = effectData.durationSmall ||
					ImageEffects.dundundun.DEFAULTS.DURATION_SMALL;
				let durationMedium = effectData.durationMedium ||
					ImageEffects.dundundun.DEFAULTS.DURATION_MEDIUM;
				let durationLarge = effectData.durationLarge ||
					ImageEffects.dundundun.DEFAULTS.DURATION_LARGE;
				let sizeSmall = effectData.sizeSmall ||
					ImageEffects.dundundun.DEFAULTS.SIZE_SMALL;
				let sizeMedium = effectData.sizeMedium ||
					ImageEffects.dundundun.DEFAULTS.SIZE_MEDIUM;
				let sizeLarge = effectData.sizeLarge ||
					ImageEffects.dundundun.DEFAULTS.SIZE_LARGE;
				
				jTarget
				.qwidth(sizeSmall).qheight(sizeSmall)
				.delay(durationSmall)
				.qwidth(sizeMedium).qheight(sizeMedium)
				.delay(durationMedium)
				.qwidth(sizeLarge).qheight(sizeLarge)
				.delay(0,
					function() {
						jTarget.shakeTimeLeft = durationLarge;
						ImageEffects.dundundun.shake(
						jTarget,
						2,
						50);
					});
			},
			clear: function(jTarget) {
				delete jTarget.shakeTimeLeft;
				jTarget.stop().rotate({ angle: 0 });
			}
		}
	}
}

class ImageDisplay extends EffectClient {
	constructor() {
		super('Image Display');
		this.currentImageDone = false;
		this.currentSoundDone = false;
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
	
	playSound(url, notifyOnFinish) {
		let sound = new Audio(url);
		
		if (notifyOnFinish) {
			$(sound).on('ended', () => this.soundDone());
			sound.play().catch(() => this.soundDone());
		} else {
			sound.play().catch(() => {});
		}
	}
	
	imageDone(imageParameters) {
		if (imageParameters.effects) {
			this.clearImageEffects(imageParameters.effects);
		}
		
		this.freeBlockingEvent('Image');
	}
	
	soundDone() {
		this.freeBlockingEvent('Sound');
	}
	
	checkAllDone() {
		if (this.currentImageDone && this.currentSoundDone) {
			this.freeBlockingEvent('showImage');
		}
	}
	
	processRequest(parameters) {
		this.currentImageDone = true;
		this.currentSoundDone = true;
		
		if (parameters.image) {
			this.currentImageDone = false;
			this.showImage(parameters.image);
		}
		
		if (parameters.sound) {
			this.currentSoundDone = false;
			this.playSound(parameters.sound, true);
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