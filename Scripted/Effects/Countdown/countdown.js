const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const HOURS = 60 * MINUTES;

function now() {
	return new Date().getTime();
}

function addMinutes(date, amount) {
    return new Date(date.getTime() + amount * MINUTES);
}

function pad(number) {
	return String(number).padStart(2, '0');
}

class Countdown extends EffectClient {
	static get DEFAULT_START_TIME() { return 30; }	// In minutes
	
	constructor() {
		super('Countdown');
		this.endTime = now() + Countdown.DEFAULT_START_TIME * MINUTES;
	}
	
	showRemainingTime(distance) {
		let hours = Math.floor(distance / HOURS);
		let minutes = Math.floor((distance % HOURS) / MINUTES);
		let seconds = Math.floor((distance % MINUTES) / SECONDS);
		$('#clock').html(`\u00A0Time left for stream: ${hours}:${pad(minutes)}:${pad(seconds)}`);
		$('#clock').fitText(1.25);
	}
	
	updateTime() {
		let distance = this.endTime - now();
		if (distance > 0) {
			this.showRemainingTime(distance);
		} else {
			this.showRemainingTime(0);
		}
	}
	
	start() {
		this.server.on('setTime', time => {
			this.endTime = now() + time;
			this.updateTime();
		});
		
		this.server.on('offsetTime', offset => {
			this.endTime += offset;
			this.updateTime();
		});
		
		setInterval(() => this.updateTime(), 1 * SECONDS);
		
		this.server.attach();
	}
}

var cd = new Countdown();
cd.start();
