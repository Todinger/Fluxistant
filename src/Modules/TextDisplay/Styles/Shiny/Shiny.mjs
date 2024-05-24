import { ModuleClient } from "/common/moduleClient.mjs";
import { applyDefaults } from "/common/clientUtils.mjs";

const DEFAULTS = {
	color: 'white',
};


const rand = (min, max) =>
	Math.floor(Math.random() * (max - min + 1)) + min;

const animate = star => {
	star.style.setProperty("--star-left", `${rand(-10, 100)}%`);
	star.style.setProperty("--star-top", `${rand(-40, 80)}%`);

	star.style.animation = "none";
	star.offsetHeight;
	star.style.animation = "";
}



class ShinyText extends ModuleClient {
	constructor() {
		super('Shiny');
		this.timeouts = [];
		this.intervals = [];
		this.stopAnimation();
		setTimeout(() => $("#all").css({visibility: "visible"}), 1000);
	}

	startAnimation() {
		let index = 1;

		for(const star of document.getElementsByClassName("magic-star")) {
			this.timeouts.push(setTimeout(() => {
				animate(star);

				this.intervals.push(setInterval(() => animate(star), 1000));
			}, index++ * 300));
		}
	}

	stopAnimation() {
		for(const t of this.timeouts) clearTimeout(t);
		for(const i of this.intervals) clearInterval(i);

		this.timeouts = [];
		this.intervals = [];
	}
	
	start() {
		this.on('showText', textData => {
			applyDefaults(textData, DEFAULTS);
			$('body').css('color', textData.color);
			$('#textContainer').text(textData.text);
			this.startAnimation();
		});
		
		this.on('hideText', () => {
			$('body').css('color', DEFAULTS.color);
			$('#textContainer').text('');
			this.stopAnimation();
		});
	}
}

const st = new ShinyText();
st.start();
