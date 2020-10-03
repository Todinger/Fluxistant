
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

/**
 * [Forked from https://gist.github.com/2651899]
 *
 * A console.assert which actually stop the exectution.
 * default console.assert() is a plain display, such as console.log() or console.error();
 * It doesnt stop the execution like assert() is meant to do. This is a little code to 
 * "workaround this limitation" :)
 *
 * Usage:
 * console.assert(foo === bar); // Will throw if not equal
 * console.assert(foo === bar, 'Dude, foo does not equal bar'); // Will throw with custom error message
 * console.assert(foo === bar, 'Y U NO EQUAL?', true); // Will stop execution and open dev tools
 */
console.assert	= function(cond, text, dontThrow){
	if ( cond ) return;
	if ( dontThrow ) {
		debugger;
	} else {
		throw new Error(text || "Assertion failed!");
	}
};

class SoundManager {
	constructor(soundHolderID) {
		this._soundHolderID = soundHolderID;
		this._sounds = {};
		this._allLoadedListeners = [];
		this._notYetLoaded = {};
		this._masterVolume = 1;
		this._muted = false;
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
	
	getSoundDuration(name) {
		return this.getSound(name).get(0).duration;
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
	}
	
	loadSounds(sounds) {
		// First run over the collection is for making sure it's valid
		Object.keys(sounds).forEach(name => {
			console.assert(!(name in this._sounds),
				`Duplicate loading of the sound ${name}`);
		});
		
		// Mark all we need to load before we actually start loading
		Object.keys(sounds).forEach(name => {
			// This will actually always be true, since it gets deleted
			// one the sound finishes loading
			this._notYetLoaded[name] = true;
		});
		
		Object.keys(sounds).forEach(name => {
			this.loadSound(name, sounds[name].location, sounds[name].loop);
		});
	}
	
	all(func) {
		Object.values(this._sounds).forEach(sound => func(sound));
	}
	
	_applyVolumes() {
		this.all(sound => sound.volumeFactor =
			this._masterVolume * (this._muted ? 0 : 1));
	}
	
	setMasterVolume(vol) {
		this._masterVolume = vol.clamp(0, 1);
		this._applyVolumes();
	}
	
	mute() {
		this._muted = true;
		this._applyVolumes();
	}
	
	unmute() {
		this._muted = false;
		this._applyVolumes();
	}
	
	toggleMute() {
		this._muted = !this._muted;
		this._applyVolumes();
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

class EventNotifier {
	constructor() {
		this._eventHandlers = {};
	}
	
	_addEvent(eventName) {
		assert(!(eventName in this._eventHandlers),
			`Multiple registrations of event '${eventName}'`);
		
		this._eventHandlers[eventName] = [];
	}
	
	_addEvents(eventNames) {
		eventNames.forEach(eventName => this._addEvent(eventName));
	}
	
	on(eventName, callback) {
		if (!(eventName in this._eventHandlers)) {
			this._eventHandlers[eventName] = [];
		}
		
		this._eventHandlers[eventName].push(callback);
		return this;
	}
	
	_notify(eventName, ...args) {
		console.assert(eventName in this._eventHandlers, `Unknown event: ${eventName}`);
		
		console.log(`Invoking event: ${eventName}`);
		this._eventHandlers[eventName].forEach(
			callback => callback.apply(null, args));
	}
}

class ServerCommManager {
	constructor(effectName) {
		this.effectName = effectName;
		this._attachRequested = false;
		this._tagAttachRequested = false;
		this._reattachNeeded = false;
		this.socket = io();
		this.on('connect', () => this._connected());
		this.on('disconnect', () => this._disconnected());
		this.on('attached', (source) => this._attached(source));
		this.tag = null;
		
		this._attachmentHandlers = {
			attach: [],
			tagAttach: [],
			detach: [],
		};
	}
	
	attach() {
		console.log(`[${this.effectName}] Attaching to server`);
		this.socket.emit('attachTo', this.effectName);
		this._attachRequested = true;
	}
	
	attachToTag(tag) {
		console.log(`[${this.effectName}] Attaching to the '${tag}' tag`);
		this.tag = tag;
		this.socket.emit('attachToTag', tag);
		this._tagAttachRequested = true;
	}
	
	onAttached(callback) {
		this._attachmentHandlers.attach.push(callback);
	}
	
	onTagAttached(callback) {
		this._attachmentHandlers.attach.push(callback);
	}
	
	onDetached(callback) {
		this._attachmentHandlers.detach.push(callback);
	}
	
	on(eventName, callback) {
		this.socket.on(eventName, callback);
	}
	
	emit(eventName, data) {
		this.socket.emit(eventName, data);
	}
	
	_notifyAttachmentEvent(event) {
		this._attachmentHandlers[event].forEach(callback => callback());
	}
	
	_connected() {
		if (this._reattachNeeded) {
			// We were attached before but the connection was interrupted,
			// so we attach again
			this.attach();
		}
		
		if (this._tagAttachRequested) {
			// Same but with a tag attachment
			this.attachToTag(this.tag);
		}
		
		this._reattachNeeded = false;
	}
	
	_disconnected() {
		if (this._attachRequested || this._tagAttachRequested) {
			this._reattachNeeded = true;
			this._notifyAttachmentEvent('detach');
		}
	}
	
	_attached(source) {
		if (source === 'tag') {
			this._notifyAttachmentEvent('tagAttach');
		} else if (source === 'direct') {
			this._notifyAttachmentEvent('attach');
		} else {
			throw `Unknown server attachment source: ${source}`;
		}
	}
}


class EffectClient extends EventNotifier {
	static get SOUND_HOLDER_ID() { return 'EffectClient_AudioHolder'; }
	
	constructor(effectName) {
		super();
		
		console.assert(effectName, `Effect name not set!`);
		
		this.effectName = effectName;
		this.parent = null;
		this.children = {};
		this.blockingEventQueues = {};
		
		$(document.body).prepend(`<div id="${EffectClient.SOUND_HOLDER_ID}"></div>`);
		this.sounds = new SoundManager(EffectClient.SOUND_HOLDER_ID);
		
		this.server = new ServerCommManager(effectName);
		
		this.server.on('fxvol', data => {
			if (data.volume === undefined) {
				return;
			}
			
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
		
		this.server.on('fxmute', () => this.sounds.mute());
		this.server.on('fxunmute', () => this.sounds.unmute());
		
		window.effectClient = this;
		if (window.top !== window && parent.effectClient) {
			parent.effectClient.addChild(this);
		}
	}
	
	sayTo(username, message) {
		this.server.emit('sayTo', { username, message });
	}
	
	_printForm(message) {
		return `[${this.effectName}] ${message}`;
	}
	
	log(message) {
		console.log(this._printForm(message));
	}
	
	warn(message) {
		console.warn(this._printForm(message));
	}
	
	setParent(parentEffectClient) {
		this.parent = parentEffectClient;
	}
	
	addChild(childEffectClient) {
		let name = childEffectClient.effectName;
		console.log(`Added child: ${name}`);
		console.assert(!(name in this.children),
			`A child effect client by the name of "${name}" already exists.`);
		
		this.children[name] = childEffectClient;
		childEffectClient.setParent(this);
	}
	
	getChild(childName) {
		console.assert(childName in this.children,
			`Unknown child: ${childName}`);
		
		return this.children[childName];
	}
	
	isRoot() {
		return this.parent === null;
	}
	
	getRoot() {
		if (this.isRoot()) {
			return this;
		} else {
			return this.parent.getRoot();
		}
	}
	
	notifyChild(childName, event, ...eventArgs) {
		let child = this.getChild(childName);
		child._notify.apply(child, [event].concat(eventArgs));
	}
	
	_isBlockingEventReady(blockingEventDescriptor) {
		return Object.values(blockingEventDescriptor.eventFlags).reduce(
			(sum, next) => sum && next.ready, true);
	}
	
	_isBlockingEventDone(blockingEventDescriptor) {
		return Object.values(blockingEventDescriptor.eventFlags).reduce(
			(sum, next) => sum && next.done, true);
	}
	
	performBlockingEvent(eventNames, callback) {
		if (!this.isRoot()) {
			this.getRoot().performBlockingEvent(eventNames, callback);
			return;
		}
		
		if (typeof eventNames === 'string') {
			eventNames = [eventNames];
		}
		
		let eventDescriptor = {
			callback: callback,
			eventFlags: {},
			running: false,
		}
		
		let performNow = true;
		
		eventNames.forEach(eventName => {
			eventDescriptor.eventFlags[eventName] = {
				ready: false,
				done: false,
			};
			
			if (!(eventName in this.blockingEventQueues)) {
				this.blockingEventQueues[eventName] = [];
			}
			
			this.blockingEventQueues[eventName].push(eventDescriptor);
			if (this.blockingEventQueues[eventName].length == 1) {
				eventDescriptor.eventFlags[eventName].ready = true;
			} else {
				performNow = false;
			}
		});
		
		if (performNow) {
			callback();
		}
	}
	
	freeBlockingEvent(eventNames) {
		if (!this.isRoot()) {
			this.getRoot().freeBlockingEvent(eventNames);
			return;
		}
		
		if (typeof eventNames === 'string') {
			eventNames = [eventNames];
		}
		
		// Input validation
		eventNames.forEach(eventName => {
			console.assert(eventName in this.blockingEventQueues,
				`Unknokwn blocking event: ${eventName}`);
		});
		
		let queue = this.blockingEventQueues[eventNames[0]];
		if (queue.length == 0) {
			console.warn(`Freeing of empty queue for '${eventNames[0]}`);
			return;
		}
		
		let eventDescriptor = queue[0];
		
		eventNames.forEach(eventName => {
			console.assert(eventName in eventDescriptor.eventFlags,
				`Release of unrelated event '${eventName}`);
			
			if (eventDescriptor.eventFlags[eventName].done) {
				console.warn(`Release of already-released event '${eventName}`);
			}
			
			eventDescriptor.eventFlags[eventName].done = true;
		});
		
		// The one at the beginning of the queue is the one currently
		// working, so if it's done then we can clear it out - and it's done
		// once all of the events it's occupying is done
		if (this._isBlockingEventDone(eventDescriptor)) {
			// First we clear it out and then we check if there's anything new
			// that's ready to start
			Object.keys(eventDescriptor.eventFlags).forEach(eventName => {
				this.blockingEventQueues[eventName].shift();
				if (this.blockingEventQueues[eventName].length > 0) {
					this.blockingEventQueues[eventName][0]
						.eventFlags[eventName].ready = true;
				}
			});
			
			// Check all the queues that have just had something cleared for
			// them and start all those whose requirements are all met
			// Note: Only start things that haven't started yet!
			Object.keys(eventDescriptor.eventFlags).forEach(eventName => {
				if (this.blockingEventQueues[eventName].length > 0) {
					let nextEventDesc = this.blockingEventQueues[eventName][0];
					if (this._isBlockingEventReady(nextEventDesc) &&
						!nextEventDesc.running) {
							nextEventDesc.running = true;
							nextEventDesc.callback();
					}
				}
			});
		}
	}
	
	assert(test, message) {
		console.assert(test, this._printForm(message));
	}
}
