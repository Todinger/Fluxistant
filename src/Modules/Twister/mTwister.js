const Module = requireMain('module');

class Twister extends Module {
	constructor() {
		super({
			name: 'Twister',
			webname: 'twister',
			source: 'twister.html',
		});
	}
}

module.exports = new Twister();
