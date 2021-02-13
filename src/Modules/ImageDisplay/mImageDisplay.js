const Module = requireMain('module');

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
