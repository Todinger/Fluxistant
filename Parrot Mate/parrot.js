


showImage('regular');

// import SEQUENCES from './sequences.js';
// require('./sequences.js');

var rsp = new RandomSequencePlayer('regular', SEQUENCES, 3000, 6000);

setTimeout(() => rsp.play(), 5000);

// var lsp = null;
// var lsp = new LoopingSequencePlayer('regular', SEQUENCES.dl6, 3000);
// soundManager.onDataLoaded(function () {
	// lsp = new LoopingSequencePlayer(SEQUENCES.cry, 300000);
// });
// window.addEventListener('load', function () {
// 	lsp = new LoopingSequencePlayer(SEQUENCES.cry, 300000);
// });



// function show(imageName) {
// 	$('#parrot').attr("src", IMAGE_LOCATIONS[imageName]);
// }

// function actAndSchedule(minTime, maxTime) {
// 	let imageName = IMAGE_NAMES[randomInt(0, IMAGE_NAMES.length)];
// 	console.log(`Loading image ${imageName}.`);
// 	$('#parrot').attr("src", IMAGE_LOCATIONS[imageName]);
// 	// activeImage.hide();
// 	// activeImage = Images[imageName];
// 	// activeImage.show();
	
// 	setTimeout(() => actAndSchedule(minTime, maxTime), randomRange(minTime, maxTime));
// }


// var Images = {};
// var activeImage = null;
// 
// function loadImages() {
// 	Object.keys(IMAGE_LOCATIONS).forEach(name => {
// 		Images[name] =
// 		$(`<img id="${name}" class="center-fit" src="${IMAGE_LOCATIONS[name]}">`)
// 		// .hide()
// 		.appendTo('#imageholder');
// 	});
	
// 	activeImage = Images.regular;
// 	activeImage.show();
// }


// loadImages();
// setTimeout(() => actAndSchedule(1000, 1000), 1000);
