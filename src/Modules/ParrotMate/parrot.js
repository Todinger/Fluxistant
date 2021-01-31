
const SECONDS = 1000;
const MINUTES = 60 * SECONDS;

class ParrotMate extends ModuleClient {
	static get DEFAULT_BASE_DELAY()		{ return 5 * MINUTES; }
	static get DEFAULT_DELAY_VARIANCE()	{ return 0; }
	static get STARTING_DELAY()			{ return ParrotMate.DEFAULT_BASE_DELAY; }
	
	constructor() {
		super('Parrot Mate');
		
		this.baseDelay = ParrotMate.DEFAULT_BASE_DELAY;
		this.delayVariance = ParrotMate.DEFAULT_DELAY_VARIANCE;
		this.sequences = {};
		this.player = null;
	}
	
	updateDelays() {
		this.player.setDelay(
			this.baseDelay - this.delayVariance,
			this.baseDelay + this.delayVariance);
	}
	
	setBaseDelay(seconds) {
		this.baseDelay = seconds * SECONDS;
		this.updateDelays();
	}
	
	setDelayVariance(seconds) {
		this.delayVariance = seconds * SECONDS;
		this.updateDelays();
	}
	
	loadAll(sequences) {
		if (this.player) {
			this.warn('Tried to load when already loaded');
			return;
		}
		
		Object.keys(sequences)
		
		this.sequences = sequences;
		this.sounds.onDataLoaded(
			() => Object.values(sequences).forEach(sequence => 
				sequence.calculateDuration()));
		
		this.sounds.loadSounds(SOUNDS);
		
		this.player = new RandomSequencePlayer(
			'regular', 
			Object.filter(sequences, seq => seq.autoPlay), // See ../clientUtils.js
			this.baseDelay - this.delayVariance,
			this.baseDelay + this.delayVariance);
	}
	
	playSequence(name) {
		if (!(name in this.sequences)) {
			this.warn(`No sequence found by the name "${name}"`);
			return;
		}
		
		// This needs to be cloned first, otherwise it can clash with
		// sequences that are already running
		this.sequences[name].clone().play();
	}
	
	start() {
		this.assert(this.player, 'Cannot start without a player loaded');
		
		this.server.on('setDelay', baseDelay => {
			this.setBaseDelay(baseDelay);
		});
		
		this.server.on('setVariance', delayVariance => {
			this.setDelayVariance(delayVariance);
		});
		
		this.server.on('play', () => this.player.play());
		this.server.on('stop', () => this.player.stop());
		
		this.server.on('playSequence', sequenceName =>
			this.playSequence(sequenceName));
		
		showImage('regular');
		clearText();
		
		this.server.attach();
		
		setTimeout(() => this.player.play(), ParrotMate.STARTING_DELAY);
	}
}

var parrotMate = new ParrotMate();
var pm = parrotMate;

function play(sequenceName) {
	pm.playSequence(sequenceName);
}
