const DURATION_MIN = 500;
const DURATION_MAX = 6000;
const IMAGE_SIZE = 50;
const COUNT = 30;

class FShower extends EffectClient {
	constructor() {
		super('F Shower');
	}
	
	dropImage(fileurl) {
		// We use double this duration along with double the distance
		// to avoid the slowing at the end of the default easing
		let duration = randomInt(DURATION_MIN, DURATION_MAX);
		$(`<img class="faller" src="${fileurl}">`)
		.width(IMAGE_SIZE).height(IMAGE_SIZE)
		.css({ 
			position: "absolute",
			marginLeft: 0, marginTop: 0,
		})
		.css({
			left: Math.floor(
				Math.random() * (window.innerWidth - 2 * IMAGE_SIZE))
		})
		.animate(
			{ top: `+=${2 * (window.innerHeight + IMAGE_SIZE)}px` },
			duration * 2,
			function() {
				$(this).remove();
			})
		.appendTo("#imageholder");
	}
	
	dropImages(fileurl) {
		for (let i = 0; i < COUNT; i++) {
			this.dropImage(fileurl);
		}
	}
	
	start() {
		this.server.on('fShower', fileurl => this.dropImages(fileurl));
		
		this.server.attach();
	}
}

var fs = new FShower();
fs.start();
