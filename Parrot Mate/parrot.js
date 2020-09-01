
showImage('regular');

var rsp = new RandomSequencePlayer('regular', SEQUENCES, 3000, 6000);

setTimeout(() => rsp.play(), 5000);
