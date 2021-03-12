'use strict';

const _ = require('lodash');
const Module = requireMain('module');

class ImageCommands extends Module {
	constructor() {
		super({
			name: 'Image Commands',
			tags: ['imgdisp'],
		});
		
		this.imageCommands = {};
	}
	
	_makeDisplayData(displayObject, file) {
		let dd = _.omit(displayObject, 'file');
		dd.url = file.data;
		return dd;
	}
	
	_sendCommand(cmdObject) {
		let _this = this;
		
		let hasImage = this.assets.Images.hasKey(cmdObject.image.file.fileKey);
		let hasSound = this.assets.Sounds.hasKey(cmdObject.sound.file.fileKey);
		
		let imagePromise = hasImage ?
			this.assets.getFileWeb(cmdObject.image.file) :
			Promise.resolve();
		
		let soundPromise = hasSound ?
			this.assets.getFileWeb(cmdObject.sound.file) :
			Promise.resolve();
		
		if (hasImage || hasSound) {
			Promise.all([imagePromise, soundPromise])
			.then(function([imageFile, soundFile]) {
				let parameters = {};
				if (hasImage) {
					parameters.image = _this._makeDisplayData(cmdObject.image, imageFile); //Utils.objectWith(cmdObject.image, { url: imageFile.data });
				}
				
				if (hasSound) {
					// parameters.sound = Utils.objectWith(cmdObject.sound, { url: soundFile.data });
					parameters.sound = _this._makeDisplayData(cmdObject.sound, soundFile);
				}
				
				_this.broadcastEvent('showImage', parameters);
			});
		}
	}

	defineModData(modData) {
		modData.addNamedCollection('Images');
		modData.addNamedCollection('Sounds');
	}
	
	defineModConfig(modConfig) {
		modConfig.add(
			'imageCommands',
			'DynamicArray',
			'ImageCommand')
		.setName('Image Commands')
		.setDescription('Commands for showing images and/or playing sounds');
	}
	
	loadModConfig(conf) {
		this.unregisterCommands(this.imageCommands);
		this.imageCommands = {};
		if (conf.imageCommands) {
			for (let i = 0; i < conf.imageCommands.length; i++) {
				let cmd = conf.imageCommands[i];
				let cmdObject = this.createCommandObject(cmd);
				
				if (!cmdObject.cmdid) {
					cmdObject.cmdid = `ImageCommand[${i}]`;
				}
				
				cmdObject.image = cmd.image;
				cmdObject.sound = cmd.sound;
				cmdObject.callback = () => {
					this._sendCommand(cmdObject);
				};
				this.imageCommands[cmdObject.cmdid] = cmdObject;
			}
		}
		
		this.registerCommands(this.imageCommands);
	}
}

module.exports = new ImageCommands();
