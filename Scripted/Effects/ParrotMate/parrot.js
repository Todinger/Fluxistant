
const SECONDS = 1000;
const MINUTES = 60 * SECONDS;

class ParrotMate extends EffectClient {
	static get DEFAULT_BASE_DELAY()		{ return 5 * MINUTES; }
	static get DEFAULT_DELAY_VARIANCE()	{ return 0; }
	static get STARTING_DELAY()			{ return ParrotMate.DEFAULT_BASE_DELAY; }
	
	constructor() {
		super('Parrot Mate');
		
		this.baseDelay = ParrotMate.DEFAULT_BASE_DELAY;
		this.delayVariance = ParrotMate.DEFAULT_DELAY_VARIANCE;
		this.player = new RandomSequencePlayer(
			'regular', 
			SEQUENCES,
			ParrotMate.DEFAULT_BASE_DELAY - ParrotMate.DEFAULT_DELAY_VARIANCE,
			ParrotMate.DEFAULT_BASE_DELAY + ParrotMate.DEFAULT_DELAY_VARIANCE);
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
	
	start() {
		this.server.on('setDelay', baseDelay => {
			this.setBaseDelay(baseDelay);
		});
		
		this.server.on('setVariance', delayVariance => {
			this.setDelayVariance(delayVariance);
		});
		
		this.server.on('play', () => this.player.play());
		this.server.on('stop', () => this.player.stop());
		
		showImage('regular');
		clearText();
		
		this.server.attach();
		
		setTimeout(() => this.player.play(), ParrotMate.STARTING_DELAY);
	}
}


var pm = new ParrotMate();
pm.start();


// var rsp = new RandomSequencePlayer('regular', SEQUENCES, 3000, 6000);
// setTimeout(() => rsp.play(), 5000);

/*
function newLSP(sequence) {
	return new LoopingSequencePlayer('regular', sequence, 3000);
}

var lsp = null;

function play(seqname) {
	if (lsp) {
		lsp.stop();
	}
	
	lsp = newLSP(SEQUENCES[seqname]);
	lsp.play();
}

function stop() {
	lsp.stop();
}
*/
