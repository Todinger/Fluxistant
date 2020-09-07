
showImage('regular');

// var rsp = new RandomSequencePlayer('regular', SEQUENCES, 3000, 6000);
// setTimeout(() => rsp.play(), 5000);

var lsp = new LoopingSequencePlayer('regular', SEQUENCES.died, 3000);

function play(seqname) {
	lsp.sequence = SEQUENCES[seqname];
	lsp.play();
}

function stop() {
	lsp.stop();
}
