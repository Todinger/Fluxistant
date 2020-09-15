function showImage(name) {
	$('#parrot').attr("src", IMAGE_LOCATIONS[name]);
}

function showText(text) {
	$('#bubbleText').text(text);
	$('#bubble').show();
}

function clearText() {
	$('#bubble').hide();
	$('#bubbleText').empty();
}

class Action {
	get duration() {
		return 0;
	}
}

class ResourceAction extends Action {
	constructor(name) {
		super();
		this.name = name;
	}
}

class ImageAction extends ResourceAction {
	perform() {
		showImage(this.name);
	}
}
function Image(name) { return new ImageAction(name); }

class SoundAction extends ResourceAction {
	perform() {
		Sounds[this.name].play();
	}
	
	get duration() {
		return Sounds[this.name].duration * 1000;
	}
}
function Sound(name) { return new SoundAction(name); }

class TextAction extends Action {
	constructor(text) {
		super();
		this.text = text;
	}
	
	perform() {
		showText(this.text);
	}
}
function Text(text) { return new TextAction(text); }

class ClearTextAction extends Action {
	perform() {
		clearText();
	}
}
function ClearText() { return new ClearTextAction() };

class TimedEvent {
	constructor(time, actions) {
		this.time = time;
		this.actions = actions;
	}
	
	perform() {
		this.actions.forEach(action => action.perform());
	}
	
	get duration() {
		return this.actions.reduce((maxSoFar, currentAction) =>
				Math.max(maxSoFar, currentAction.duration),
			0);
	}
}
function Event(time, actions) { return new TimedEvent(time, actions); }
const EMPTY_EVENT = new Event(0, []);

class TimedSequence {
	constructor(events) {
		this.events = events;
		this.timeline = [];
		this.duration = 0;
		this.sequenceFinishedListeners = [];
		
		this._processEvents();
	}
	
	_processEvents() {
		this.timeline = this.events.concat().sort(
			(a, b) => Math.sign(a.time - b.time));
		
		if ((this.timeline.length > 0) && this.timeline[0].time > 0) {
			this.timeline.unshift(EMPTY_EVENT);
		}
	}
	
	onFinished(listener) {
		this.sequenceFinishedListeners.push(listener);
	}
	
	play() {
		if (this.events.length == 0) return;
		
		this._next(0);
	}
	
	calculateDuration() {
		this.duration = this.events.reduce((maxSoFar, currentEvent) =>
			Math.max(maxSoFar, currentEvent.time + currentEvent.duration),
			0);
	}
	
	_next(index) {
		this.timeline[index].perform();
		
		let nextIndex = index + 1;
		if (nextIndex < this.timeline.length) {
			let nextTime = this.timeline[nextIndex].time -
						   this.timeline[index].time;
			setTimeout(() => this._next(nextIndex), nextTime);
		} else {
			setTimeout(() => this._finished(), this.timeline[index].duration);
		}
	}
	
	_finished() {
		this.sequenceFinishedListeners.forEach(listener => listener());
	}
}
function Sequence(events) { return new TimedSequence(events); }



function randomRange(min, max) {
	return min + Math.random() * (max - min);
}

function randomInt(min, max) {
	return min + Math.floor(Math.random() * (max - min));
}

function randomKey(obj) {
	let keys = Object.keys(obj);
	return keys[randomInt(0, keys.length)];
}

function randomValue(obj) {
	return obj[randomKey(obj)];
}

class SequencePlayer {
	constructor(baseImageName) {
		this.baseImageName = baseImageName;
		this._playing = false;
	}
	
	_sequenceFinished() {
		showImage(this.baseImageName);
		clearText();
	}
	
	play() {
		if (!this._playing) {
			this._playing = true;
			this._playNext();
		}
	}
	
	_playNext() {
		if (this._playing) {
			this._playNextImplementation();
		}
	}
	
	_playNextImplementation() {
		// Should be overridden in deriving classes
		console.error('Abstract method called.');
	}
	
	stop() {
		this._playing = false;
	}
}

class RandomSequencePlayer extends SequencePlayer {
	constructor(baseImageName, sequences, minDelay, maxDelay) {
		super(baseImageName);
		this.sequences = sequences;
		this.minDelay = minDelay;
		this.maxDelay = maxDelay;
		
		Object.values(this.sequences).forEach(sequence => 
			sequence.onFinished(() => this._sequenceFinished()));
	}
	
	setDelay(minDelay, maxDelay) {
		this.minDelay = minDelay;
		this.maxDelay = maxDelay;
	}
	
	_playNextImplementation() {
		let sequence = randomValue(this.sequences);
		sequence.play();
		let nextSequenceTime =
			sequence.duration +
			randomRange(this.minDelay, this.maxDelay);
		setTimeout(() => this._playNext(), nextSequenceTime);
	}
}

class LoopingSequencePlayer extends SequencePlayer {
	constructor(baseImageName, sequence, interval) {
		super(baseImageName);
		this.sequence = sequence;
		this.interval = interval;
		this.running = false;
		
		this.sequence.onFinished(() => this._sequenceFinished());
	}
	
	_playNextImplementation() {
		this.sequence.play();
		let nextSequenceTime = this.sequence.duration + this.interval;
		setTimeout(() => this._playNext(), nextSequenceTime);
	}
}
