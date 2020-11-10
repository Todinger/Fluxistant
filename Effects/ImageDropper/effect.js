'use strict';

const Effect = require('../../effect');

class ImageDropper extends Effect {
	constructor() {
		super({
			name: 'Image Dropper',
			webname: 'imgdrop',
			source: 'imgdrop.html',
		});
	}
}

module.exports = new ImageDropper();
