import { ModuleClient } from "/common/moduleClient.mjs";
import AnimationTimer from "/common/animationTimer.mjs";
import { clamp } from "/common/clientUtils.mjs";

const TRANSPARENT_PIXEL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const NO_IMAGE = TRANSPARENT_PIXEL_IMAGE;

const ROTATIONS = 2;

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


function linearShift(fromMin, fromMax, toMin, toMax, value) {
	return (value - fromMin) * (toMax - toMin) / (fromMax - fromMin) + toMin;
}

function normalizedToActual(point) {
	const width = $(window).width();
	const height = $(window).height();
	return {
		x: linearShift(-1, 1, 0, width, point.x),
		y: linearShift(1, -1, 0, height, point.y),
	}
}



const ANIMATION_PARAMS = {
	DURATION: 1,
	FPS: 60,
	EASING: asymmetricFunctionToEasing(transformTangent(1, 1, 2.2)),
	ELLIPSE: {
		HALF_WIDTH: 1 / 2,
		HALF_HEIGHT: 2.8 / 2,
		CENTER: {
			X: 0.4,
			Y: -0.5,
		},
		ANGLE_RANGE: {
			MIN: 0,
			MAX: 2 * Math.PI * 210 / 360,
		},
		ANGLE_TRUNCATION: {
			MIN: 0,
			MAX: 2 * Math.PI * 175 / 360,
		},
	}
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
		
		this.animationTimer = new AnimationTimer(
			ANIMATION_PARAMS.DURATION,
			ANIMATION_PARAMS.FPS,
			ANIMATION_PARAMS.EASING,
			t => this.setFoodImagePos(t),
			() => this.feedDone(),
		)
	}
	
	hide() {
		$('#all').hide();
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
		this.animationTimer.start();
	}
	
	setFoodImagePos(t) {
		let ELLIPSE = ANIMATION_PARAMS.ELLIPSE;
		let angle = clamp(
			ELLIPSE.ANGLE_TRUNCATION.MIN,
			linearShift(0, 1, ELLIPSE.ANGLE_RANGE.MIN, ELLIPSE.ANGLE_RANGE.MAX, t),
			ELLIPSE.ANGLE_TRUNCATION.MAX,
		);
		let normalized = {
			x: ELLIPSE.CENTER.X + ELLIPSE.HALF_WIDTH * Math.cos(angle),
			y: ELLIPSE.CENTER.Y + ELLIPSE.HALF_HEIGHT * Math.sin(angle),
		}
		
		let actual = normalizedToActual(normalized);
		
		this.foodImage.css({
			top: actual.y,
			left: actual.x,
			transform: `translate(-50%, -50%)`,
			'-ms-transform': 'translate(-50%, -50%)',
			'-webkit-transform': `rotate(${t * ROTATIONS}turn)`,
		});
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
		this.server.on('forceFeedDoneEvent', () => this.server.emit('feedDone'));
		
		this.server.attach();
		
		this.server.emit('syncState');
	}
}

const c = new FeedingGameClient();
c.start();

window.c = c;
