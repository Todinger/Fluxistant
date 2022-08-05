import { ModuleClient } from "/common/moduleClient.mjs";

const TRANSPARENT_PIXEL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const NO_IMAGE = TRANSPARENT_PIXEL_IMAGE;

// This takes an asymmetric function f (one for which f(-x) = -f(x) for all x)
// and creates an easing function g from it with the following properties:
// 1. g(0) = 0
// 1. g(0.5) = 0.5
// 1. g(1) = 1
function asymmetricFunctionToEasing(f) {
	const denominator = 2 * f(0.5);
	return t => f(t - 0.5) / denominator + 0.5;
}

// For the parameters outerCoefficient = a, exponent = n, innerCoefficient = b,
// the result of this function is the mathematical function:
//   f(x) = a * (tan(b * x)) ^ n
// Note that if n is an odd integer then this function is asymmetric.
// Also note that if n is fractional or negative then you may get mathematical
// errors when calculating for some values.
function transformTangent(outerCoefficient = 1, exponent = 1, innerCoefficient = 1) {
	return x => outerCoefficient * Math.pow(Math.tan(innerCoefficient * x), exponent);
}

class FeedingGameClient extends ModuleClient {
	constructor() {
		super('Feeding Game');
		
		this.images = {
			backClosed: "",
			backOpen: "",
			frontClosed: "",
			frontOpen: "",
		};
		
		this.forms = {
			open: {
				back: $('#backOpen'),
				front: $('#frontOpen'),
			},
			closed: {
				back: $('#backClosed'),
				front: $('#frontClosed'),
			}
		};
		
		this.foodImage = $('#food');
		this.setFoodImage(); // Clear the food image
		
		this.foodPathContainer = $('#foodPath');
		let svg = this.foodPathContainer[0];
		svg.addEventListener('load', () => {
			let svgDoc = svg.contentDocument;
			let foodPath = svgDoc.getElementById('foodPath');
			let path = foodPath.getAttribute('d');
			
			console.log('Creating pathAnimator');
			this.pathAnimator = new PathAnimator(path, {
				duration: 1,
				step: (point, angle) => this.setFoodImagePos(point, angle),
				easing: asymmetricFunctionToEasing(transformTangent(1, 1, 2)), //t => t * (2 - t),// + 3,
				onDone: () => this.feedDone(),
			});
			console.log('pathAnimator created');
			
			this.foodPathOffset = this.foodPathContainer.position();
			this.foodPathContainer.hide();
		});
	}
	
	hide() {
		// $('#all').hide();
	}
	
	show() {
		$('#all').show();
	}
	
	
	open() {
		this.forms.open.back.show();
		this.forms.open.front.show();
		this.forms.closed.back.hide();
		this.forms.closed.front.hide();
	}
	
	close() {
		this.forms.closed.back.show();
		this.forms.closed.front.show();
		this.forms.open.back.hide();
		this.forms.open.front.hide();
	}
	
	setLevelImage(data, name) {
		$(`#${name}`).attr('src', name in data ? data[name].url : NO_IMAGE);
	}
	
	setLevelImages(data, noResponse) {
		if (!data) {
			return;
		}
		
		this.setLevelImage(data, 'backClosed');
		this.setLevelImage(data, 'backOpen');
		this.setLevelImage(data, 'frontClosed');
		this.setLevelImage(data, 'frontOpen');
		
		if (!noResponse) {
			this.server.emit('levelImagesSet');
		}
	}
	
	setFoodImage(image) {
		this.foodImage.attr('src', image ? image.url : NO_IMAGE);
	}
	
	feed(data) {
		this.setFoodImage(data);
		this.open();
		this.foodImage.show();
		// setTimeout(() => this.feedDone(), 1000);
		this.pathAnimator.start(0, 100);
	}
	
	setFoodImagePos(point /*, angle */) {
		let offset = this.foodPathOffset;
		this.foodImage.css({ top: offset.top + point.y, left: offset.left + point.x });
	}
	
	feedDone() {
		this.foodImage.hide();
		this.close();
		this.server.emit('feedDone');
	}
	
	start() {
		this.close();
		this.hide();
		
		this.server.on('hide', () => this.hide());
		this.server.on('show', () => this.show());
		this.server.on('setLevelImages', data => this.setLevelImages(data));
		this.server.on('feed', data => this.feed(data));
		this.server.on('sync', data => {
			this.setLevelImages(data, true);
			this.show();
		});
		
		this.server.attach();
		
		this.server.emit('syncState');
	}
}

const c = new FeedingGameClient();
c.start();

window.c = c;
