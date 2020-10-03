const path = require('path');
const Utils = require('../../utils');
const Effect = require('../../effect.js');

const STYLES_DIR = 'Styles';

class TextDisplay extends Effect {
	constructor() {
		super({
			name: 'Text Display',
			webname: 'textdisp',
			source: 'textdisp.html',
		});
		
		this.styles = null;
	}
	
	loadData() {
		this.styles = Utils.getDirectories(path.join(this.workdir, STYLES_DIR));
		this.log('Styles loaded');
	}
	
	load() {
		this._onClientAttached(socket => {
			socket.on('getStyleList', () => {
				socket.emit('styleList', this.styles);
			});
		});
		
		this.registerCommand({
			cmdname: 'z',
			filters: [Effect.Filters.isOneOf(['yecatsmailbox', 'fluxistence'])],
			callback: user => this.broadcastEvent('showText', {
				style: 'Creepy',
				text: 'Hello world!',
				color: '#EF8D01',
				displayEffect: {
					name: 'fade',
				},
			}),
		});
	}
}

module.exports = new TextDisplay();
