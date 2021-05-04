import { ModuleClient } from "/common/moduleClient.mjs";
import { clamp, applyDefaults } from "/common/clientUtils.mjs";

const WHEEL_DEFAULTS = {
	offsetX: 0,
	offsetY: 0,
	outerRadius: 200,
};

const DEFAULT_DURATION = 5000;
const FADE_DURATION = 250;
const MIN_POWER = 2;
const MAX_POWER = 50;

const NO_WHEEL = -1;

class WheelClient extends ModuleClient {
	constructor() {
		super('Wheel');
		
		this.jVideo = $('#video');
		this.video = this.jVideo[0];
		this.videoSource = this.video; //$('#videoSource')[0];
		this.video.onended =
		this.video.onerror = () => this.videoDone();
		this.jCanvas = $('#canvas');
		this.jResult = $('#result');
		this.jResultText = $('#resultText');
		
		this.wheels = [];
		this.selectedWheelIndex = NO_WHEEL;
		this.spinning = false;
		this.resultShowing = false;
	}
	
	show(index) {
		if (index < 0 || this.wheels.length <= index) {
			this.server.emit(
				'error',
				`Index must be between 0 and ${this.wheels.length - 1} (got ${index}).`);
			return;
		}
		
		if (this.selectedWheelIndex !== NO_WHEEL) {
			this.server.emit(
				'error',
				'A wheel is already showing.');
			return;
		}
		
		this.selectedWheelIndex = index;
		this.playVideo(index);
	}
	
	playVideo(index) {
		let videoData = this.wheels[index].extras.video;
		if (videoData) {
			this.videoSource.src = videoData.url;
			if (videoData.x || videoData.y) {
				this.jVideo.removeClass('centered');
				this.jVideo.addClass('positioned');
				this.jVideo.x(videoData.x);
				this.jVideo.y(videoData.y);
			} else {
				this.jVideo.removeClass('positioned');
				this.jVideo.addClass('centered');
			}
			
			this.video.load();
			this.jVideo.show();
			if (!this.video.play()) {
				this.videoDone();
			}
		} else {
			this.videoDone();
		}
	}
	
	videoDone() {
		this.drawWheel();
		this.jCanvas.show();
		this.server.emit('ready');
	}
	
	hide() {
		this.jCanvas.hide();
		this.clearWheel();
		this.jVideo.hide();
		this.selectedWheelIndex = NO_WHEEL;
		this.hideResult();
	}
	
	spin(params) {
		if (!this.spinning) {
			let power = clamp(MIN_POWER, params.power, MAX_POWER);
			this.log(`Sping power: ${power}`);
			let wheel = this.wheels[this.selectedWheelIndex].winWheel;
			wheel.animation.spins = power;
			wheel.startAnimation();
		}
	}
	
	showResult(resultValue) {
		if (!this.resultShowing) {
			this.jResultText.text(resultValue);
			this.jResultText.attr('data-text', resultValue);
			this.jResult.fadeIn(FADE_DURATION);
			this.resultShowing = true;
		}
	}
	
	hideResult() {
		if (this.resultShowing) {
			this.resultShowing = false;
			this.jResult.fadeOut(
				FADE_DURATION,
				() => {
					this.jResultText.text('');
					this.jResultText.attr('data-text', '');
				});
		}
	}
	
	wheelStopped(wheel, indicatedSegment) {
		let result = Number(indicatedSegment.text) - 1;
		this.server.emit('result', result);
		this.showResult(wheel.segments[result].value);
	}
	
	wheelCenterX(wheel) {
		return wheel.offsetX + window.innerWidth / 2;
	}
	
	wheelCenterY(wheel) {
		return wheel.offsetY + window.innerHeight / 2;
	}
	
	setWheels(data) {
		this.wheels = [];
		if (!data.wheels) {
			return;
		}
		
		for (let i = 0; i < data.wheels.length; i++) {
			let wheel = data.wheels[i].wheelData;
			wheel.segments = [];
			wheel.numSegments = data.wheels[i].segments.length;
			for (let j = 0; j < wheel.numSegments; j++) {
				wheel.segments.push({
					fillStyle: data.wheels[i].segments[j].color,
					text: (j + 1).toString(),
					value: data.wheels[i].segments[j].value,
				});
			}
			
			applyDefaults(wheel, WHEEL_DEFAULTS);
			
			wheel.centerX = this.wheelCenterX(wheel);
			wheel.centerY = this.wheelCenterY(wheel);
			wheel.animation = {
				type: 'spinToStop',
				duration: (data.duration || DEFAULT_DURATION) / 1000,
				callbackFinished : (...p) => this.wheelStopped(wheel, ...p),
			};
			
			let winWheel = new Winwheel(wheel);
			this.wheels.push({
				winWheel,
				extras: data.wheels[i].extras,
			});
			
			// let winWheel = new Winwheel({
			// 	'numSegments'  : 8,         // Number of segments
			// 	'outerRadius'  : 212,       // The size of the wheel.
			// 	'centerX'      : 217,       // Used to position on the background correctly.
			// 	'centerY'      : 219,
			// 	'textFontSize' : 28,        // Font size.
			// 	'segments'     :            // Definition of all the segments.
			// 		[
			// 			{'fillStyle' : '#eae56f', 'text' : 'Prize 1'},
			// 			{'fillStyle' : '#89f26e', 'text' : 'Prize 2'},
			// 			{'fillStyle' : '#7de6ef', 'text' : 'Prize 3'},
			// 			{'fillStyle' : '#e7706f', 'text' : 'Prize 4'},
			// 			{'fillStyle' : '#eae56f', 'text' : 'Prize 5'},
			// 			{'fillStyle' : '#89f26e', 'text' : 'Prize 6'},
			// 			{'fillStyle' : '#7de6ef', 'text' : 'Prize 7'},
			// 			{'fillStyle' : '#e7706f', 'text' : 'Prize 8'}
			// 		],
			// 	'animation' :               // Definition of the animation
			// 		{
			// 			'type'     : 'spinToStop',
			// 			'duration' : 5,
			// 			'spins'    : 8,
			// 			'callbackFinished' : alertPrize
			// 		}
			// });
		}
	}
	
	clearWheel() {
		if (this.selectedWheelIndex !== NO_WHEEL) {
			this.wheels[this.selectedWheelIndex].winWheel.clearCanvas();
		}
	}
	
	drawWheel() {
		if (this.selectedWheelIndex !== NO_WHEEL) {
			this.wheels[this.selectedWheelIndex].winWheel.draw(true);
		}
	}
	
	resizeCanvas() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		
		this.wheels.forEach(wheel => {
			wheel.winWheel.centerX = this.wheelCenterX(wheel.winWheel);
			wheel.winWheel.centerY = this.wheelCenterY(wheel.winWheel);
		});
		
		this.drawWheel();
	}
	
	setupCanvas() {
		this.canvas = document.getElementById('canvas');
		
		// resize the canvas to fill browser window dynamically
		window.addEventListener('resize', () => this.resizeCanvas(), false);
		
		this.resizeCanvas();
	}
	
	start() {
		this.setupCanvas();
		
		this.server.on('setWheels', data => {
			this.hide();
			this.setWheels(data);
		});
		
		this.server.on('show', (index) => this.show(index));
		this.server.on('hide', () => this.hide());
		this.server.on('spin', (params) => this.spin(params));
		
		this.server.attach();
		this.server.emit('getWheels');
	}
}

const wc = new WheelClient();
window.wc = wc;
wc.start();
