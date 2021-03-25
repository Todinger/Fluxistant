'use strict';

const _ = require('lodash');
const Module = requireMain('module');

const DESCRIPTION =
`Allows you to define your own functions which show images and/or play sounds on the main overlay.

Add a function for each image/sound you want, set its triggers (e.g. commands or keyboard shortcuts), and when these
triggers are activated, the configured image and/or sound will be shown/played. It will wait until oen image/sound is
done showing before showing another one, if activated rapidly.

Main overlay address for browser sources: http://localhost:3333/mod/ScriptedModules/ScriptedModules.html

(Note: the port 3333 is the default one, but if you change it in the main settings,
you will need to adjust that address accordingly.`;

class ImageCommands extends Module {
	constructor() {
		super({
			name: 'Image Commands',
			tags: ['imgdisp'],
			description: DESCRIPTION,
		});
		
		this.imageFunctions = {};
	}
	
	_makeDisplayData(displayObject, file) {
		let dd = _.omit(displayObject, 'file');
		dd.url = file.data;
		dd.duration = dd.duration ? 1000 * dd.duration : undefined;
		return dd;
	}
	
	_sendToDisplay(funcObject) {
		let _this = this;
		
		let imageConf = funcObject.image;
		let soundConf = funcObject.sound;
		let imageFileConf = imageConf.file;
		let soundFileConf = soundConf.file;
		let hasImage = this.assets.Images.hasKey(imageFileConf.fileKey);
		let hasSound = this.assets.Sounds.hasKey(soundFileConf.fileKey);
		
		let imagePromise = hasImage ?
			this.assets.getFileWeb(imageFileConf) :
			Promise.resolve();
		
		let soundPromise = hasSound ?
			this.assets.getFileWeb(soundFileConf) :
			Promise.resolve();
		
		if (hasImage || hasSound) {
			Promise.all([imagePromise, soundPromise])
			.then(function([imageFile, soundFile]) {
				let parameters = {};
				if (hasImage) {
					parameters.image = imageConf.makeDisplayData(imageFile); //Utils.objectWith(cmdObject.image, { url: imageFile.data });
				}
				
				if (hasSound) {
					parameters.sound = soundConf.makeDisplayData(soundFile);
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
