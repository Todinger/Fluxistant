'use strict';

const Module = requireMain('module');

class ImageDropper extends Module {
	constructor() {
		super({
			name: 'Image Dropper',
			webname: 'imgdrop',
			source: 'imgdrop.html',
		});
	}
}

module.exports = new ImageDropper();
