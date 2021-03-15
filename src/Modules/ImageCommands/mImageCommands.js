'use strict';

const _ = require('lodash');
const Module = requireMain('module');

class ImageCommands extends Module {
	constructor() {
		super({
			name: 'Image Commands',
			tags: ['imgdisp'],
		});
		
		this.imageFunctions = {};
	}
	
	_makeDisplayData(displayObject, file) {
		let dd = _.omit(displayObject, 'file');
		dd.url = file.data;
		return dd;
	}
	
	_sendToDisplay(funcObject) {
		let _this = this;
		
		let hasImage = this.assets.Images.hasKey(funcObject.image.file.fileKey);
		let hasSound = this.assets.Sounds.hasKey(funcObject.sound.file.fileKey);
		
		let imagePromise = hasImage ?
			this.assets.getFileWeb(funcObject.image.file) :
			Promise.resolve();
		
		let soundPromise = hasSound ?
			this.assets.getFileWeb(funcObject.sound.file) :
			Promise.resolve();
		
		if (hasImage || hasSound) {
			Promise.all([imagePromise, soundPromise])
			.then(function([imageFile, soundFile]) {
				let parameters = {};
				if (hasImage) {
					parameters.image = _this._makeDisplayData(funcObject.image, imageFile); //Utils.objectWith(cmdObject.image, { url: imageFile.data });
				}
				
				if (hasSound) {
					parameters.sound = _this._makeDisplayData(funcObject.sound, soundFile);
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
			'imageFunctions',
			'DynamicArray',
			'ImageFunction')
		.setName('Image Functions')
		.setDescription('Functions for showing images and/or playing sounds');
	}
	
	loadModConfig(conf) {
		this.deactivateFunctions(this.imageFunctions || {});
		this.imageFunctions = {};
		if (conf.imageFunctions) {
			for (let i = 0; i < conf.imageFunctions.length; i++) {
				let func = conf.imageFunctions[i];
				let funcObject = this.createFunctionObject(func);
				
				if (!funcObject.funcID) {
					funcObject.funcID = `ImageFunc[${i}]`;
				}
				
				funcObject.image = func.image;
				funcObject.sound = func.sound;
				funcObject.action = () => {
					this._sendToDisplay(funcObject);
				};
				this.imageFunctions[funcObject.funcID] = funcObject;
			}
		}
		
		this.activateFunctions(this.imageFunctions);
	}
}

module.exports = new ImageCommands();
