const path = require('path');
const Utils = requireMain('utils');
const Module = requireMain('module');

const STYLES_DIR = 'Styles';

class TextDisplay extends Module {
	constructor() {
		super({
			name: 'Text Display',
			webname: 'textdisp',
			source: 'textdisp.html',
			zindex: 5,
			configurable: false,
		});
		
		this.styles = null;
	}
	
	loadData() {
		this.styles = Utils.getDirectories(path.join(this.workdir, STYLES_DIR));
		this.log('Styles loaded');
	}
	
	load() {
		this.onClientAttached(socket => {
			socket.on('getStyleList', () => {
				socket.emit('styleList', this.styles);
			});
		});
	}
}

module.exports = new TextDisplay();
