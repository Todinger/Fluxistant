
showImage('regular');

// var rsp = new RandomSequencePlayer('regular', SEQUENCES, 3000, 6000);
// setTimeout(() => rsp.play(), 5000);

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
