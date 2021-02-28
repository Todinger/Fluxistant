
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

// In charge of loading sounds, playing them, controlling volume, fade-ins,
// fade-outs, etc.
class SoundManager {
	static getNextTempName() {
		return `Temp: ${SoundManager.tempSoundNum++}`;
	}
	
	constructor(soundHolderID) {
		this._soundHolderID = soundHolderID;
		this._sounds = {};
		this._allLoadedListeners = [];
		this._notYetLoaded = {};
		this._masterVolume = 1;
		this._muted = false;
	}
	
	// Register to be notified when all the sound files have been loaded.
	// Whenever one or more files are given to loadSound/loadSounds, once they
	// are all finished loading, every function that registered here will be
	// invoked.
	onDataLoaded(func) {
		this._allLoadedListeners.push(func);
	}
	
	// Invokes all the onDataLoaded listeners.
	_loadingFinished() {
		this._allLoadedListeners.forEach(func => func());
	}
	
	// Mark that a specific sound has been loaded.
	// After marking, if all currently loading sounds are finished loading, the
	// loading is finished in its entirety and all the listeners are invoked.
	_dataLoaded(name) {
		if (this._notYetLoaded[name]) {
			delete this._notYetLoaded[name];
			if (Object.keys(this._notYetLoaded).length === 0) {
				this._loadingFinished();
			}
		}
	}
	
	// A target for a sound action can either be the name of a single sound file
	// or (undefined), which means that the action should be performed on ALL
	// the sounds we have loaded.
	_isValidTarget(target) {
		return isNonEmptyString(target) || (target === undefined);
	}
	
	// Throws an error if the given target is invalid
	_validate(target) {
		console.assert(this._isValidTarget(target),
			`Invalid audio target selected: ${target}`);
	}
	
	// Getter for sounds.
	// Performs validation.
	getSound(name) {
		console.assert(name in this._sounds, `Unknown sound: ${name}`);
		
		return this._sounds[name];
	}
	
	// Gets the duration of the sound with the given name.
	// Only works after the sound has been loaded (returns 0 otherwise).
	getSoundDuration(name) {
		return this.getSound(name).get(0).duration;
	}
	
	// Our saved "sounds" are really jQuery wrappers to <audio> tags.
	// Some sound-specific features are not built into these jQuery objects
	// (e.g. the play() function), so we add them, for convenience.
	// We also add some other features that help us, such as a layer of volume
	// control above the actual volume of the <audio> object, so that we can
	// exert some extra volume control ourselves.
	// Finally, we add an animateVolume function that lets us use our added
	// volume layer for "animation," thus prividing us a means to fade audio in
	// and out while also considering the global volume setting.
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
	
	// Loads a sound file.
	// 
	// Parameters:
	// 	name		Unique identifier for the sound in our system.
	// 	location	URL of the actual sound file.
	// 	[loop]		Set to true if the sound should loop when playing.
	// 	[onLoaded]	Function to call once the file finishes loading.
	// 	[onError]	Function to call if an error occurs while loading.
	loadSound(name, location, loop, onLoaded, onError) {
		console.assert(!(name in this._sounds),
			`Duplicate loading of the sound ${name}`);
		
		let sound = $(`<audio id="sound_${name}" src="${location}">`)
		.on('loadeddata', () => {
			this._dataLoaded(name);
			if (onLoaded) {
				onLoaded(name);
			}
		})
		.on('error', () => {
			this.unloadSound(name);
			onError();
		})
		.prop('loop', loop)
		.appendTo(`#${this._soundHolderID}`);
		
		// Add the key (name) to the sound object in case we need the key from
		// the value later
		sound.name = name;
		
		// Add extra features to our sounds
		this._addFeaturesToSound(sound);
		
		// Apply current volume factor to the newly-created audio element
		this._applyVolume(sound);
		
		this._sounds[name] = sound;
	}
	
	// Loads multiple sound files.
	// The <sounds> parameter should be an object whose keys are the names of
	// the sound files (which we use to identify the sounds in this class) and
	// the values contain the parameters for them, like so:
	// 
	// 	sounds: {
	// 		name1: {
	// 			location: URL,		// Location of the actual sound file
	// 			loop: trueOrFalse,	// Whether or not the sound should loop when
	// 								// it finishes playing
	// 		},
	// 		...
	// 	}
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
	
	// Unloads a previously loaded sound.
	// 
	// Parameters:
	// 	name	The name used on the call to loadSound() to identify the sound
	unloadSound(name) {
		console.assert(name in this._sounds, `Unknown sound name: ${name}`);
		if (name in this._notYetLoaded) {
			delete this._notYetLoaded[name];
		}
		
		this._sounds[name].remove();
		delete this._sounds[name];
	}
	
	// Loads the given sound file, plays it and then unloads it.
	// The URL is used as the name if none is given.
	// 
	playOneShot(url, onDone, onError, name) {
		if (!name) {
			name = SoundManager.getNextTempName();
		}
		
		this.loadSound(
			name,
			url,
			false,
			() => {
				this.play(
					name,
					() => {
						this.unloadSound(name);
						if (onDone) {
							onDone();
						}
					},
					() => {
						this.unloadSound(name);
						if (onError) {
							onError();
						}
					});
			},
			onError);
	}
	
	// Invokes the given function on all the sounds we have and forwards the
	// given onDone and onError callbacks to it so it can use them if it
	// supports them.
	all(func, onDone, onError) {
		Object.values(this._sounds).forEach(
			sound => func(sound, onDone, onError));
	}
	
	// Recalculates the volume of all the given sound and applies the new value.
	_applyVolume(sound) {
		sound.volumeFactor = this._masterVolume * (this._muted ? 0 : 1);
	}
	
	// Recalculates the volume of all the files and applies the new values.
	_applyVolumes() {
		this.all(sound => this._applyVolume(sound));
	}
	
	// Sets the global volume of all the sounds in our system.
	// Setting the volume to 0.5 basically changes the maximum volume each sound
	// can reach to 50% its actual maximum.
	// 
	// Parameters:
	// 	vol		Volume level. A real number in the range [0, 1] (inclusive).
	setMasterVolume(vol) {
		this._masterVolume = vol.clamp(0, 1);
		this._applyVolumes();
	}
	
	// Mutes all sounds in the system.
	mute() {
		this._muted = true;
		this._applyVolumes();
	}
	
	// Unmutes all sounds in the system.
	unmute() {
		this._muted = false;
		this._applyVolumes();
	}
	
	// Toggles mute value for all the sounds the system (i.e. either they all
	// get muted or they all get unmuted).
	toggleMute() {
		this._muted = !this._muted;
		this._applyVolumes();
	}
	
	// Increases or decreases the master volume level by the given amount
	// (positive value to increase, negative value to decrease).
	// If the new value exceeds the range of [0, 1] it will be clamped into it
	// (i.e. 1.5 would be considered 1 and -3 would be considered 0).
	// 
	// Parameters:
	// 	diff	Volume to offset by. A real number in the range [0, 1].
	offsetMasterVolume(diff) {
		this.setMasterVolume(this._masterVolume + diff);
	}
	
	// Performs the given function on either a specific target (sound) or on all
	// of the sounds, depending on what the target is (sound name or undefined).
	// When the process is done, the onDone callback is invoked.
	// If there's an error, the onError callback is invoked instead.
	_singleOrAll(target, func, onDone, onError) {
		this._validate(target);
		
		if (isNonEmptyString(target)) {
			func(this.getSound(target), onDone, onError);
		} else {
			this.all(func, onDone, onError);
		}
	}
	
	// Plays the target sound(s).
	// 
	// Parameters:
	// 	target		The name of a sound (string) or undefined for all sounds.
	// 	onDone		Function to invoke when the sound finishes playing.
	// 	onError		Function to invoke if there's an error playing the sound.
	play(target, onDone, onError) {
		this._singleOrAll(target, sound => {
			sound.on('ended', onDone);
			sound.volume(1.0);
			let res = sound.get(0).play();
			if (onError) {
				res.catch(onError);
			}
		});
	}
	
	// Pauses the target sound(s).
	// 
	// Parameters:
	// 	target		The name of a sound (string) or undefined for all sounds.
	// 	onDone		Function to invoke when the sound pauses (which is right
	// 				away). This is used to comply with the general _singleOrAll
	// 				template.
	pause(target, onDone) {
		this._singleOrAll(target, sound => {
			sound.pause();
			if (onDone) {
				onDone(sound.name);
			}
		});
	}
	
	// Stops the target sound(s).
	// 
	// Parameters:
	// 	target		The name of a sound (string) or undefined for all sounds.
	// 	onDone		Function to invoke when the sound stops (which is right
	// 				away). This is used to comply with the general _singleOrAll
	// 				template.
	stop(target, onDone) {
		this._singleOrAll(target, sound => {
			sound.pause().rewind();
			if (onDone) {
				onDone(sound.name);
			}
		});
	}
	
	// Fades the target sound(s) in.
	// 
	// Parameters:
	// 	duration	Amount of time it should take to finish fading in.
	// 	target		The name of a sound (string) or undefined for all sounds.
	// 	onDone		Function to call when the fade-in is finished.
	fadeIn(duration, target, onDone) {
		this._singleOrAll(target, sound => 
			sound.volume(0.0).play().animateVolume(1.0, duration, onDone));
	}
	
	// Fades the target sound(s) out.
	// 
	// Parameters:
	// 	duration	Amount of time it should take to finish fading out.
	// 	target		The name of a sound (string) or undefined for all sounds.
	// 	onDone		Function to call when the fade-out is finished.
	fadeOut(duration, target, onDone) {
		this._singleOrAll(target, sound => 
			sound.animateVolume(0.0, duration, () => {
				sound.pause();
				if (onDone) {
					onDone(sound.name);
				}
			}));
	}
	
	// Fades the target sound(s) out and then stops it.
	// 
	// Parameters:
	// 	duration	Amount of time it should take to finish fading out.
	// 	target		The name of a sound (string) or undefined for all sounds.
	// 	onDone		Function to call when the fade-out is finished and the sound
	// 				has stopped.
	fadeOutAndStop(duration, target, onDone) {
		this._singleOrAll(target, sound => sound.animateVolume(
			0.0,
			duration,
			() => {
				sound.pause().rewind();
				if (onDone) {
					onDone(sound.name);
				}
			})
		);
	}
	
	// Performs a cross-fade between the currently playing sound(s) and the
	// given sound.
	// 
	// Parameters:
	// 	duration	Amount of time it should take to finish fade.
	// 	name		The name of the sound file to switch *to*.
	crossFade(duration, name, onDone) {
		Object.keys(this._sounds).forEach(soundName => {
			if (soundName !== name) {
				this.fadeOut(this._sounds[soundName]);
			}
		});
		
		this.fadeIn(duration, name, onDone);
	}
}

// Used to assign names to one-shot audio files, increased for each
SoundManager.tempSoundNum = 0;

// General event notification class.
// Lets you use on(...) and invokes registered callbacks upon _notify(...).
// This class has no logic for the events it notifies about. It's meant to be
// inherited and used by the deriving class to notify about events without the
// deriving class needing to deal with registration and invocation.
class EventNotifier {
	constructor() {
		// This is where we store the handlers (callbacks) of all the events
		// we support
		this._eventHandlers = {};
	}
	
	// Adds support for an event by the given name.
	_addEvent(eventName) {
		assert(!(eventName in this._eventHandlers),
			`Multiple registrations of event '${eventName}'`);
		
		this._eventHandlers[eventName] = [];
	}
	
	// Utility function for adding multiple events at once
	_addEvents(eventNames) {
		eventNames.forEach(eventName => this._addEvent(eventName));
	}
	
	// Registers a callback to be invoked when an event occurs.
	on(eventName, callback) {
		if (!(eventName in this._eventHandlers)) {
			this._eventHandlers[eventName] = [];
		}
		
		this._eventHandlers[eventName].push(callback);
		return this;
	}
	
	// Invokes all the callbacks that registered for the specified event.
	// If the event has arguments, simply list them after the event name when
	// invoking this function.
	// E.g.:
	// 	this._notify('helloWorld', 'Hello', 'world!');
	// Correspondingly, all the callbacks registering to the same event should
	// accept these arguments, e.g.:
	// 	somethingThatDerivesFromEventNotifier.on(
	// 		'helloWorld',
	// 		(hello, world) => console.log(`${hello} ${world}`));
	// Of course, if you don't care about the arguments you don't need to use
	// them. This would work fine too:
	// 	somethingThatDerivesFromEventNotifier.on(
	// 		'helloWorld',
	// 		() => console.log(`Someone said hello world!`));
	_notify(eventName, ...args) {
		console.assert(eventName in this._eventHandlers, `Unknown event: ${eventName}`);
		
		console.log(`Invoking event: ${eventName}`);
		this._eventHandlers[eventName].forEach(
			callback => callback.apply(null, args));
	}
}

// Manages communication with server-side Modules (and the server in general).
class ServerCommManager {
	constructor(moduleName) {
		// This is used to determine what Module we attach to when attach() is
		// invoked
		this.moduleName = moduleName;
		
		// These variables are used to perform reattachments when a
		// disconnection occurs for whatever reason
		this._attachRequested = false;
		this._tagAttachRequested = false;
		this._reattachNeeded = false;
		this._tag = null;
		
		// The actual socket object we use for communications
		this.socket = io();
		
		// Occurs when a connection is made to the server
		this.on('connect', () => this._connected());
		
		// Occurs when we get disconnected from the server we're connected to
		this.on('disconnect', () => this._disconnected());
		
		// Sent by the server after we've sent an attachment request to tell us
		// that the attachment was successful and we can now communicate
		this.on('attached', (source) => this._attached(source));
		
		// Used
		
		this._attachmentHandlers = {
			attach: [],
			tagAttach: [],
			detach: [],
		};
	}
	
	// Attach to the server side of our Module.
	attach() {
		console.log(`[${this.moduleName}] Attaching to server`);
		this.socket.emit('attachTo', this.moduleName);
		this._attachRequested = true;
	}
	
	// Attach to all Modules on the server that have the given tag.
	// 
	// NOTE: Only one tag attachment request is supported at the moment.
	// That is, if you invoke this twice with different tags, there will be
	// issues when reconnecting (only the last tag used will be reattached
	// automatically).
	attachToTag(tag) {
		console.log(`[${this.moduleName}] Attaching to the '${tag}' tag`);
		this._tag = tag;
		this.socket.emit('attachToTag', tag);
		this._tagAttachRequested = true;
	}
	
	// Register to be notified once we've attached to our Module on the server.
	onAttached(callback) {
		this._attachmentHandlers.attach.push(callback);
	}
	
	// Register to be notified once we've attached to a Module by tag.
	// This will be invoked per Module we attach to.
	onTagAttached(callback) {
		this._attachmentHandlers.attach.push(callback);
	}
	
	// Register to be notified when we've been detached from a server-side
	// Module
	onDetached(callback) {
		this._attachmentHandlers.detach.push(callback);
	}
	
	// Register for events received from the server.
	// 
	// Parameters:
	// 	eventName	The name of the event to listen to.
	// 	callback	Function to call when the event occurs.
	on(eventName, callback) {
		this.socket.on(eventName, callback);
	}
	
	// Send and event to the server.
	// This will reach all the Modules we're attached to., if they listen to it.
	// 
	// Parameters:
	// 	eventName	The name of the event to send.
	// 	data		An object of additional data (if you need to send more than
	// 				one piece of data, put them all in a single object and send
	// 				that).
	emit(eventName, data) {
		this.socket.emit(eventName, data);
	}
	
	// Invoke all the callbacks registered for the given attachment event.
	// An attachmend event can be either 'attach', 'detach' or 'tagAttach'.
	_notifyAttachmentEvent(event) {
		this._attachmentHandlers[event].forEach(callback => callback());
	}
	
	// Handles connection with the server.
	_connected() {
		if (this._reattachNeeded) {
			// We were attached before but the connection was interrupted,
			// so we attach again
			this.attach();
		}
		
		if (this._tagAttachRequested) {
			// Same but with a tag attachment
			this.attachToTag(this._tag);
		}
		
		this._reattachNeeded = false;
	}
	
	// Handles disconnection from the server.
	_disconnected() {
		if (this._attachRequested || this._tagAttachRequested) {
			this._reattachNeeded = true;
				this._notifyAttachmentEvent('detach');
		}
	}
	
	// Handles attachment to a Module on the server.
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


// Base class for all client-side Modules.
// It is highly recommended to inherit from this class on the main JS file of
// each client-side Module code, as it will make all communication with the
// server - as well as some other things - much simpler.
// 
// If you have a web page that loads frames that contain other ModuleClients, a
// tree hierarchy will automatically be established with them.
// The ModuleClient in the topmost window will have the ModuleClients of all the
// frames it contains as direct children, and they in turn will be parents of
// frames they may have.
// The reason this was implemented was to support blocking events.
// 
// Blocking events allow separate Modules to coordinate when to do things that
// might clash.
// For example, if multiple Modules play sounds, and they are all part of a
// single, multi-Module web page (e.g. ScriptedModules, TextDisplay), rather
// than have them all play their sounds whenever, you can have them perform a
// "blocking operation" with the same name, and then they will be executed one
// after the other instead.
// See the performBlockingEvent() function below for more details.
class ModuleClient extends EventNotifier {
	// When using the SoundManager to load sounds, all <audio> tags that are
	// added will be appended to the tag with this ID (do not have an element
	// with this ID on your page!)
	static get SOUND_HOLDER_ID() { return 'ModuleClient_AudioHolder'; }
	
	// moduleName must match the name provided to the Module constructor on the
	// server side.
	constructor(moduleName) {
		super();
		
		console.assert(moduleName, `Module name not set!`);
		
		this.moduleName = moduleName;
		this.parent = null;
		this.children = {};
		this.blockingEventQueues = {};
		
		// Add the sound holder element to the page and initialize the Sound
		// Manager
		$(document.body).prepend(`<div id="${ModuleClient.SOUND_HOLDER_ID}"></div>`);
		this.sounds = new SoundManager(ModuleClient.SOUND_HOLDER_ID);
		
		// Initalize the Server Communications Manager
		this.server = new ServerCommManager(moduleName);
		
		// Global volume change event for all Modules
		this.server.on('fxvol', data => {
			if (data.volume === undefined) {
				return;
			}
			
			let volNum = Number(data.volume);
			if (Number.isNaN(volNum)) {
				// Give some error
				this.sayTo(
					data.username,
					`Please specify volume as a number (0-100). Prefix with + or - to increase/decrease it.`);
			}
			
			// Support for offsets rather than just direct volume numbers
			if (data.volume.startsWith('+') || data.volume.startsWith('-')) {
				// Users provide volume levels in percentages and we use values
				// in the range of [0, 1], so here we convert it to our form
				this.sounds.offsetMasterVolume(volNum / 100);
			} else {
				this.sounds.setMasterVolume(volNum / 100);
			}
		});
		
		// Global mute and unmute events
		this.server.on('fxmute', () => this.sounds.mute());
		this.server.on('fxunmute', () => this.sounds.unmute());
		
		// Register ourselves in the window to support automatic hierarchy
		// management
		window.moduleClient = this;
		if (window.top !== window && parent.moduleClient) {
			// If we have a parent Module Client, add ourselves as a child to it
			// (this is easier than having the parent look through its children)
			parent.moduleClient.addChild(this);
		}
	}
	
	// Makes the server bot say the message to the user with the given username.
	sayTo(username, message) {
		this.server.emit('sayTo', { username, message });
	}
	
	// Marks a message so it's clear it relates to this Module.
	// Useful when printing to the console.
	_printForm(message) {
		return `[${this.moduleName}] ${message}`;
	}
	
	// Logs a message to the console, marked as coming from this Module.
	log(message) {
		console.log(this._printForm(message));
	}
	
	// Logs a warning message to the console, marked as coming from this Module.
	warn(message) {
		console.warn(this._printForm(message));
	}
	
	// Log an error message to the console, marked as coming from this Module.
	error(message) {
		console.error(this._printForm(message));
	}
	
	// Sets the given Module Client as our parent.
	// For use by the parent.
	setParent(parentModuleClient) {
		this.parent = parentModuleClient;
	}
	
	// Adds the given Module Client as one of our children.
	// For use by each child.
	addChild(childModuleClient) {
		// Module names should be unique, so there shouldn't be more than one
		// child with the same name
		let name = childModuleClient.moduleName;
		console.log(`Added child: ${name}`);
		console.assert(!(name in this.children),
			`A child module client by the name of "${name}" already exists.`);
		
		this.children[name] = childModuleClient;
		
		// Once we've accepted the child as ours, we name ourselves its parent
		childModuleClient.setParent(this);
	}
	
	// Gets the child Module Client with the given name.
	// Performs validation.
	getChild(childName) {
		console.assert(childName in this.children,
			`Unknown child: ${childName}`);
		
		return this.children[childName];
	}
	
	// Returns true iff this Module Client is the root of the Module Client
	// hierarchy tree.
	isRoot() {
		return this.parent === null;
	}
	
	// Gets the root of the Module Client hierarchy tree.
	getRoot() {
		if (this.isRoot()) {
			return this;
		} else {
			return this.parent.getRoot();
		}
	}
	
	// Notifies a child Module Client of the given event.
	// This is like calling the child's .notify(eventName, arg1, arg2, ...)
	// function.
	notifyChild(childName, event, ...eventArgs) {
		let child = this.getChild(childName);
		child._notify.apply(child, [event].concat(eventArgs));
	}
	
	// Returns true iff a blocking event is marked as ready in every queue it's
	// in.
	_isBlockingEventReady(blockingEventDescriptor) {
		return Object.values(blockingEventDescriptor.eventFlags).reduce(
			(sum, next) => sum && next.ready, true);
	}
	
	// Returns true iff a blocking event is marked as done in every queue it's
	// in.
	_isBlockingEventDone(blockingEventDescriptor) {
		return Object.values(blockingEventDescriptor.eventFlags).reduce(
			(sum, next) => sum && next.done, true);
	}
	
	// Sets a function (the given callback) to be called once all of the
	// blocking events it's listed are available.
	// This puts the function on several queues (one for each event it's listed)
	// and it only gets called once it's at the front of all of these queues.
	// 
	// If all of the queues for the given events are empty (or do not yet exist)
	// then the function gets invoked immediately.
	// 
	// It is the responsibility of whatever invokes this function to also invoke
	// freeBlockingEvent() once their event has completed.
	// For example, if some Module wants to play a sound and thus invokes
	// performBlockingEvent("Sound", someFunction), then when the sound finishes
	// playing it should call freeBlockingEvent("Sound").
	// If this is not done then anything else that blocks on that event will be
	// stuck forever waiting (including itself if it performs another blocking
	// event of the same name).
	performBlockingEvent(eventNames, callback) {
		// In order for this to work across multiple Modules in the same browser
		// window, they all need to use the same queues, so all of this is
		// delegated to the root of the tree, under which all of the Module
		// Clients should be
		if (!this.isRoot()) {
			this.getRoot().performBlockingEvent(eventNames, callback);
			return;
		}
		
		// We need an array of event names, but when used for a single event you
		// can just use the name as a string and we'll wrap it in an array here
		if (typeof eventNames === 'string') {
			eventNames = [eventNames];
		}
		
		// Each event holds these pieces of information:
		let eventDescriptor = {
			// The function to call once this even is ready
			callback: callback,
			
			// Two flags here *per event name*:
			// 	ready	Signifies that the event is at the front of the queue
			// 			for that specific event name
			// 	done	Signifies that the blocking event, which is already at
			// 			the front of the queue on all of its queues (i.e. for
			// 			each event name), has finished doing what it needs to do
			// 			for that specific event name (e.g. it's already finished
			// 			playing the sound it blocked on "Sound" for, or it's
			// 			already finished displaying the image it blocked on
			// 			"Image" for)
			eventFlags: {},
			
			// Signifies that the blocking event is currently being performed
			// At this time all of its "ready" flags are set, and its "done"
			// flags should start being set one after the other until it's
			// finished working completely
			running: false,
		}
		
		// If the blocking event is already at the front of all of its queues,
		// we perform it immediately
		let performNow = true;
		
		eventNames.forEach(eventName => {
			// Initialize the flags for this specific event name
			eventDescriptor.eventFlags[eventName] = {
				ready: false,
				done: false,
			};
			
			// Create queues for events if they don't yet exist
			if (!(eventName in this.blockingEventQueues)) {
				this.blockingEventQueues[eventName] = [];
			}
			
			// Place the blocking event at the end of each queue it's requested
			this.blockingEventQueues[eventName].push(eventDescriptor);
			
			if (this.blockingEventQueues[eventName].length === 1) {
				// If our event is the only one in the queue then nothing was in
				// it before, so it's ready on that front
				eventDescriptor.eventFlags[eventName].ready = true;
			} else {
				// Otherwise there is at least one thing ahead of it in at least
				// one of its requested queues, so we will definitely not be
				// invoking the callback yet
				performNow = false;
			}
		});
		
		// This means our event is at the front of all of its queues and ready
		// to start
		if (performNow) {
			callback();
		}
	}
	
	// Marks that the blocking events that are currently being performed and are
	// at the head of the queues with the given names have all finished.
	// This should ONLY be called after a blocking event has been invoked and
	// is done, and it should ONLY free the queues that are actually relevant to
	// it.
	// It might be a good idea to provide some IDs or something to make sure
	// that only the right callback is freeing the queues, but I haven't done
	// that (not yet, at least).
	freeBlockingEvent(eventNames) {
		// In order for this to work across multiple Modules in the same browser
		// window, they all need to use the same queues, so all of this is
		// delegated to the root of the tree, under which all of the Module
		// Clients should be
		if (!this.isRoot()) {
			this.getRoot().freeBlockingEvent(eventNames);
			return;
		}
		
		// We need an array of event names, but when used for a single event you
		// can just use the name as a string and we'll wrap it in an array here
		if (typeof eventNames === 'string') {
			eventNames = [eventNames];
		}
		
		// Input validation
		eventNames.forEach(eventName => {
			console.assert(eventName in this.blockingEventQueues,
				`Unknokwn blocking event: ${eventName}`);
		});
		
		// This should always produce a queue with at least one item in it,
		// since supposedly the one at the front which is being performed right
		// now is the one that is telling us that it's done and we can remove it
		// from the queue
		let queue = this.blockingEventQueues[eventNames[0]];
		if (queue.length === 0) {
			console.warn(`Freeing of empty queue for '${eventNames[0]}`);
			return;
		}
		
		// The blocking event's event dscriptor should be the same in all of the
		// queues it's blocking, so it doesn't matter which one we take
		let eventDescriptor = queue[0];
		
		// Go over all the events that we're meant to release and mark that the
		// current event is done in each one (set its .done flag)
		eventNames.forEach(eventName => {
			console.assert(eventName in eventDescriptor.eventFlags,
				`Release of unrelated event '${eventName}`);
			
			if (eventDescriptor.eventFlags[eventName].done) {
				console.warn(`Release of already-released event '${eventName}'`);
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
	
	// Utility assert function.
	// The same as the regular console.assert, only it prints its error message
	// in our form to show which Module it's from.
	assert(test, message) {
		console.assert(test, this._printForm(message));
	}
}
