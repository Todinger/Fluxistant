const Module = requireMain('module');

class WheelModule extends Module {
	constructor() {
		super({
			name: 'Wheel',
			webname: 'wheel',
			source: 'wheel.html',
		});
	}
	
	load() {
	}
}

module.exports = new WheelModule();
