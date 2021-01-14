var Module = require('../../module.js');

class ImageDisplay extends Module {
	constructor() {
		super({
			name: 'Image Display',
			webname: 'imgdisp',
			source: 'imgdisp.html',
		});
	}
}

module.exports = new ImageDisplay();
