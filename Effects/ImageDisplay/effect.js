var Effect = require('../../effect.js');

class ImageDisplay extends Effect {
	constructor() {
		super({
			name: 'Image Display',
			webname: 'imgdisp',
			source: 'imgdisp.html',
		});
	}
}

module.exports = new ImageDisplay();
