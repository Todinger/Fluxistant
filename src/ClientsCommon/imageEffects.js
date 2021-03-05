// ----------------- //
// jQuery Extensions //
// ----------------- //

// Adds an extension to jQuery that invokes a given attribute in an action-queue
// supporting way (so it happens at the right time when you add delays and 
// such).
// Adds a 'q' at the beginning of the name and puts that as a new jQuery
// function.
// 
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

// Delayed CSS action
extendJQueryFunction('css');
// Delayed width action
extendJQueryFunction('width');
// Delayed height action
extendJQueryFunction('height');

// An assortment of effects that can be added to images.
// Each effect has three parts to it:
// - DEFAULTS: 	Default values which are used if the given effectData object
// 				doesn't have the values the effect needs.
// - apply:		Applies the effect to the given image.
// 				Takes the jQuery object of the image and an optional effectData
// 				object with parameters to override the ones from DEFAULTS.
// - clear:		Removes the effect from the given image. Should only be called
// 				on an image that previously had the effect's apply() function
// 				called on it.
// 				Takes the jQuery object of the image.
class ImageEffects {
	// Provides an outer glow effect.
	// Doesn't actually deal with the "size" part so well, I'm afraid. =\
	static get glow() {
		return {
			DEFAULTS: {
				SIZE: 15,
				COLOR: '#ffffcc',
			},
			apply: function(jTarget, effectData) {
				if (!effectData) effectData = {};
				
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
	
	// Provides an outer shadow effect.
	// The same as an outer glow of black.
	static get shadow() {
		return {
			DEFAULTS: {
				SIZE: 15,
			},
			apply: function(jTarget, effectData) {
				if (!effectData) effectData = {};
				
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
	
	// Shows the in three steps, with each one larger than the previous one, and
	// the last one shaking side to side.
	// Meant to imitate the "DUN DUN DUN" dog clip thing.
	// The defaults here fit the sound effect I used, but you can provide
	// alternative values for the duration and sizes through the effectData
	// object.
	static get dundundun() {
		return {
			DEFAULTS: {
				DURATION_SMALL: 584,
				DURATION_MEDIUM: 438,
				DURATION_LARGE: 5000,
				
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
				if (!effectData) effectData = {};
				
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

// Add effect-applying as extensions
$.fn.extend({
	applyEffect: function(name, effectData) {
		console.assert(
			name in ImageEffects,
			`Unknown effect name: ${name}`);
		
		ImageEffects[name].apply(this, effectData);
		return this;
	},
	clearEffect: function(name) {
		console.assert(
			name in ImageEffects,
			`Unknown effect name: ${name}`);
		
		ImageEffects[name].clear(this);
		return this;
	},
	applyImageEffects: function(imageEffects) {
		imageEffects.forEach(effectData => {
			let name = effectData.type.trim().toLowerCase();
			if (name in ImageEffects) {
				ImageEffects[name].apply(this, effectData);
			}
			
			return this;
		});
	},
});
