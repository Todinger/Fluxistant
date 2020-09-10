
function isNonEmptyString(obj) {
	return (typeof obj == 'string') && (obj.length > 0);
}

class SoundManager {
	constructor(soundHolderID) {
		this._soundHolderID = soundHolderID;
		this._sounds = {};
		this._allLoadedListeners = [];
		this._notYetLoaded = {};
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
		sound.pause = () => { sound.get(0).pause(); return sound; }
		sound.play = () => { sound.get(0).play(); return sound; }
		sound.rewind = () => { sound.get(0).currentTime = 0; return sound; }
		sound.volume = vol => { sound.get(0).volume = vol; return sound; }
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
		this._sounds.forEach(sound => func(sound));
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
			// sound => {
			// 	let soundElement = sound.get(0);
			// 	sound.attr('currentTime', 0).get(0).pause()
			// });
	}
	
	fadeIn(duration, target) {
		this._singleOrAll(target, sound => 
			sound.volume(0.0).play().animate({
				volume: 1.0,
			},
			duration)
		);
	}
	
	fadeOut(duration, target) {
		this._singleOrAll(target, sound => sound.animate({
				volume: 0.0,
			},
			duration,
			() => sound.get(0).pause())
		);
	}
	
	fadeOutAndStop(duration, target) {
		this._singleOrAll(target, sound => sound.animate({
				volume: 0.0,
			},
			duration,
			() => sound.pause().rewind())
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
	}
	
}

