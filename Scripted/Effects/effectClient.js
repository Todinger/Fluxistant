
/**
 * Returns a number whose value is limited to the given range.
 * 
 * Taken from:
 * https://stackoverflow.com/questions/11409895/whats-the-most-elegant-way-to-cap-a-number-to-a-segment
 * 
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 * 
 * @param {Number} min The lower boundary of the output range
 * @param {Number} max The upper boundary of the output range
 * @returns A number in the range [min, max]
 * @type Number
 */
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

function isNonEmptyString(obj) {
	return (typeof obj == 'string') && (obj.length > 0);
}

class SoundManager {
	constructor(soundHolderID) {
		this._soundHolderID = soundHolderID;
		this._sounds = {};
		this._allLoadedListeners = [];
		this._notYetLoaded = {};
		this._masterVolume = 1;
	}
	
	onDataLoaded(func) {
		this._allLoadedListeners.push(func);
	}
	
	_loadingFinished() {
		this._allLoadedListeners.forEach(func => func());
	}
	
	_dataLoaded(name) {
		if (this._notYetLoaded[name]) {
			delete this._notYetLoaded[name];
			if (Object.keys(this._notYetLoaded).length == 0) {
				this._loadingFinished();
			}
		}
	}
	
	_isValidTarget(target) {
		return isNonEmptyString(target) || (target === undefined);
	}
	
	_validate(target) {
		console.assert(this._isValidTarget(target),
			`Invalid audio target selected: ${target}`);
	}
	
	getSound(name) {
		console.assert(name in this._sounds, `Unknown sound: ${name}`);
		
		return this._sounds[name];
	}
	
	_addFeaturesToSound(sound) {
		sound.pause = () => { sound.get(0).pause(); return sound; };
		sound.play = () => { sound.get(0).play(); return sound; };
		sound.rewind = () => { sound.get(0).currentTime = 0; return sound; };
		sound._actualVolume = vol => { sound.get(0).volume = vol; return sound; };
		
		// Sets the *actual* volume of the audio element on the page
		sound.setActualVolume = vol => sound.get(0).volume = vol;
		sound._volumeFactor = 1;
		sound._currentVolume = 1;
		
		// Should be invoked after every change to currentVolume or volumeFactor
		sound._recalculateVolume = () => {
			sound.setActualVolume(sound._currentVolume * sound._volumeFactor);
		}
		
		// currentVolume: Public "current volume", without accounting the factor
		Object.defineProperty(sound, 'currentVolume', {
			get() { return sound._currentVolume; },
			set(vol) {
				sound._currentVolume = vol.clamp(0, 1);
				sound._recalculateVolume();
			}
		});
		
		// volumeFactor: Adjusts "master volume" imposed on this sound
		Object.defineProperty(sound, 'volumeFactor', {
			get() { return sound._volumeFactor; },
			set(vf) {
				sound._volumeFactor = vf.clamp(0, 1);
				sound._recalculateVolume();
			},
		});
		
		// jQuery-like function which sets the volume properly and returns the
		// object itself
		sound.volume = vol => {
			sound.currentVolume = vol;
			return sound;
		};
		
		// Trick taken from:
		//   https://stackoverflow.com/questions/8154086/jquery-animate-of-custom-value-not-a-css-property
		// Which took it from:
		//   http://james.padolsey.com/javascript/fun-with-jquerys-animate/
		sound.animateVolume = (targetVolume, duration, callback) => {
			$({foo: sound.currentVolume * 100})
			.animate({foo: targetVolume * 100}, {
				duration: duration,
				step: function(val) {
					// val takes values from the initial currentVolume to
					// the final targetVolume
					sound.currentVolume = val / 100.0;
				},
				complete: callback,
			});
			
			return sound;
		};
	}
	
	loadSound(name, location, loop, onLoaded) {
		console.assert(!(name in this._sounds),
			`Duplicate loading of the sound ${name}`);
		
		let sound = $(`<audio id="sound_${name}" src="${location}">`)
		.on('loadeddata', () => {
			this._dataLoaded(name);
			if (onLoaded) {
				onLoaded(name);
			}
		})
		.prop('loop', loop)
		.appendTo(`#${this._soundHolderID}`);
		
		// Add extra features to our sounds
		this._addFeaturesToSound(sound);
		
		// let sound = new Audio(location);
		
		this._sounds[name] = sound;
		console.log(`Sound loaded: ${name}`);
	}
	
	loadSounds(sounds) {
		// First run over the collection is for making sure it's valid
		Object.keys(sounds).forEach(name => {
			console.assert(!(name in this._sounds),
				`Duplicate loading of the sound ${name}`);
		});
		
		Object.keys(sounds).forEach(name => {
			// This will actually always be true, since it gets deleted
			// one the sound finishes loading
			this._notYetLoaded[name] = true;
			
			this.loadSound(name, sounds[name].location, sounds[name].loop);
		});
	}
	
	all(func) {
		Object.values(this._sounds).forEach(sound => func(sound));
	}
	
	setMasterVolume(vol) {
		this._masterVolume = vol.clamp(0, 1);
		this.all(sound => sound.volumeFactor = this._masterVolume);
	}
	
	offsetMasterVolume(diff) {
		this.setMasterVolume(this._masterVolume + diff);
	}
	
	_singleOrAll(target, func) {
		this._validate(target);
		
		if (isNonEmptyString(target)) {
			func(this.getSound(target));
		} else {
			this.all(func);
		}
	}
	
	play(target) {
		this._singleOrAll(target, sound => sound.volume(1.0).play());
	}
	
	pause(target) {
		this._singleOrAll(target, sound => sound.pause());
	}
	
	stop(target) {
		this._singleOrAll(target, sound => sound.pause().rewind());
	}
	
	fadeIn(duration, target) {
		this._singleOrAll(target, sound => 
			sound.volume(0.0).play().animateVolume(1.0, duration));
	}
	
	fadeOut(duration, target) {
		this._singleOrAll(target, sound => 
			sound.animateVolume(0.0, duration, () => sound.pause()));
	}
	
	fadeOutAndStop(duration, target) {
		this._singleOrAll(target, sound => sound.animateVolume(
			0.0,
			duration,
			() => {
				sound.pause().rewind()
			})
		);
	}
	
	crossFade(duration, name) {
		Object.keys(this._sounds).forEach(soundName => {
			if (soundName != name) {
				this.fadeOut(this._sounds[soundName]);
			}
		});
		
		this.fadeIn(duration, name);
	}
}

class ServerCommManager {
	constructor(scriptName) {
		this.scriptName = scriptName;
		this.socket = io();
	}
	
	attach() {
		this.socket.emit('attachTo', this.scriptName);
	}
	
	on(eventName, callback) {
		this.socket.on(eventName, callback);
	}
	
	emit(eventName, data) {
		this.socket.emit(eventName, data);
	}
}

class EffectClient {
	static get SOUND_HOLDER_ID() { return 'EffectClient_AudioHolder'; }
	
	constructor(scriptName) {
		this.scriptName = scriptName;
		
		$(document.body).prepend(`<div id="${EffectClient.SOUND_HOLDER_ID}"></div>`);
		this.sounds = new SoundManager(EffectClient.SOUND_HOLDER_ID);
		
		this.server = new ServerCommManager(scriptName);
		
		this.server.on('fxvol', data => {
			// if (data.volume === undefined) {
			// 	return;
			// }
			
			let volNum = Number(data.volume);
			if (volNum === NaN) {
				// Give some error
				this.sayTo(username, `Please specify volume as a number (0-100). Prefix with + or - to increase/decrease it.`);
			}
			
			if (data.volume.startsWith('+') || data.volume.startsWith('-')) {
				this.sounds.offsetMasterVolume(volNum / 100);
			} else {
				this.sounds.setMasterVolume(volNum / 100);
			}
		});
	}
	
	sayTo(username, message) {
		this.server.emit('sayTo', { username, message });
	}
	
}

