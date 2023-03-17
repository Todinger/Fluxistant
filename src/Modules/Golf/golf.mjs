import { ModuleClient } from "/common/moduleClient.mjs";

const TRANSPARENT_PIXEL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const NO_IMAGE = TRANSPARENT_PIXEL_IMAGE;

const USER_SECONDS = 1000;
const FADE_DURATION = 250;


class GolfClient extends ModuleClient {
	constructor() {
		super('Golf');
		
		this.images = {
			backSwing: "",
			atBall: "",
			swing: "",
			score: "",
			miss: "",
		};
		
		this.timingConstants = {
			Pre: 3,
			PerAim: 1,
			WaitForIt: 2,
			Post: 4,
		}
		
		this.displayImage = $('#golfer');
	}
	
	hide() {
		$('#all').hide();
	}
	
	show() {
		$('#all').show();
	}
	
	showAnimationImage(url) {
		this.displayImage.attr('src', url ? url : NO_IMAGE);
	}
	
	setAnimationImages(data) {
		if (!data) {
			return;
		}
		
		this.images = data;
		
		// this.setAnimationImage(data, 'backSwing');
		// this.setAnimationImage(data, 'atBall');
		// this.setAnimationImage(data, 'swing');
		// this.setAnimationImage(data, 'score');
		// this.setAnimationImage(data, 'miss');
	}
	
	setTimingConstants(constants) {
		this.timingConstants = {
			Pre: constants.Pre,
			PerAim: constants.PerAim,
			WaitForIt: constants.WaitForIt,
			Post: constants.Post,
		}
	}
	
	setGameData(gameData) {
		this.setAnimationImages(gameData['animationImages']);
		this.setTimingConstants(gameData['timingConstants']);
	}
	
	async showImage(image, durationInSeconds, fadeIn) {
		return new Promise((resolve) => {
			this.showAnimationImage(image.url);
			if (fadeIn) {
				this.displayImage.fadeIn(FADE_DURATION);
			}
			
			setTimeout(() => resolve(), durationInSeconds * USER_SECONDS);
		})
	}
	
	async animate(aimCount) {
		await this.showImage(this.images.atBall, this.timingConstants.Pre, true);
		for (let i = 0; i < aimCount - 1; i++) {
			await this.showImage(this.images.backSwing, this.timingConstants.PerAim / 2);
			await this.showImage(this.images.atBall, this.timingConstants.PerAim / 2);
		}
		await this.showImage(this.images.backSwing, this.timingConstants.PerAim / 2);
		this.showAnimationImage(this.images.swing.url);
	}
	
	async showFinal(image) {
		await this.showImage(image, this.timingConstants.Post);
		this.displayImage.fadeOut(FADE_DURATION);
	}
	
	async showScore() {
		await this.showFinal(this.images.score);
	}
	
	async showMiss() {
		await this.showFinal(this.images.miss);
	}
	
	start() {
		this.hide();
		
		this.server.on('hide', () => this.hide());
		this.server.on('show', () => this.show());
		this.server.on('setGameData', data => this.setGameData(data));
		this.server.on('animate', async aimCount => await this.animate(aimCount));
		this.server.on('score', async () => await this.showScore());
		this.server.on('miss', async () => await this.showMiss());
		
		this.server.attach();
		
		this.server.emit('getGameData');
	}
}

const c = new GolfClient();
c.start();

window.c = c;
