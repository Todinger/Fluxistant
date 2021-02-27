const Module = requireMain('module');

class ImageDisplay extends Module {
	constructor() {
		super({
			name: 'Image Display',
			webname: 'imgdisp',
			source: 'imgdisp.html',
			webSounds: true,
		});
	}
}

module.exports = new ImageDisplay();
