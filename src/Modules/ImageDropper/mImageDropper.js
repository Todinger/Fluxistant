'use strict';

const Module = requireMain('module');
const Utils = requireMain('utils');

class ImageDropper extends Module {
	static Interface = class ImageDropperInterface extends Module.Interface {
		constructor(inst) {
			super(inst);
		}
		
		defineDependencyConfig(dependencyConfigGroup) {
			dependencyConfigGroup
				.setName('Default Image Size')
				.setDescription('Size to set an image to unless overridden by specific image settings');
			dependencyConfigGroup.addNaturalNumber('width')
				.setDescription('Width in pixels');
			dependencyConfigGroup.addNaturalNumber('height')
				.setDescription('Height in pixels');
		}
		
		defineMethods() {
			return {
				dropImage: (conf, displayData) => this.inst.dropImage(displayData, conf),
				floatImage: (conf, displayData) => this.inst.floatImage(displayData, conf),
			};
		}
	};
	
	constructor() {
		super({
			name: 'Image Dropper',
			webname: 'imgdrop',
			source: 'imgdrop.html',
			configurable: false,
		});
	}
	
	sendImage(eventName, displayData, defaults) {
		if (defaults) {
			Utils.applyDefaults(displayData, defaults);
		}
		
		this.broadcastEvent(eventName, displayData);
	}
	
	dropImage(displayData, defaults) {
		this.sendImage('dropImage', displayData, defaults);
	}
	
	floatImage(displayData, defaults) {
		this.sendImage('floatImage', displayData, defaults);
	}
}

module.exports = new ImageDropper();
