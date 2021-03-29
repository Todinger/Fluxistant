'use strict';

const assert = require('assert').strict;
const Module = requireMain('module');

const DEFAULT_GROUP_KEY = '[Defaults]';

const DESCRIPTION =
`When the main "Drop F Image" function is activated, showers down 'F' images from above on the main overlay.

The 'F' image is selected at random from the default pool for most users, but you can set separate pools
for specific users, and when they activate the function, it will select an image from their pool instead.

(I called them 'F' images but they don't actually need to be images of the 'F' character.)

Main overlay address for browser sources: http://localhost:3333/mod/ScriptedModules/ScriptedModules.html

(Note: the port 3333 is the default one, but if you change it in the main settings,
you will need to adjust that address accordingly.`;

class FShower extends Module {
	constructor() {
		super({
			name: 'F Shower',
			tags: ['imgdrop'],
			description: DESCRIPTION,
		});
		
		this.imgdrop = null;
		this.userGroups = {};
	}
	
	getGroup(username) {
		if (username in this.userGroups) {
			return {
				key: username,
				files: this.userGroups[username].files,
			};
		} else {
			return {
				key: DEFAULT_GROUP_KEY,
				files: this.config.defaultImages.files,
			};
		}
	}
	
	findAndSendFile(user) {
		let group = this.getGroup(user.name);
		this.assets.Images.selectFile(group.key)
			.then(file => {
				let files = group.files;
				let imageConf = files[file.fileKey];
				let displayData = imageConf.makeDisplayData(file);
				// this.broadcastEvent('dropImage', displayData);
				this.imgdrop.dropImage(displayData);
			});
	}
	
	defineModDependencies() {
		this.imgdrop = this.use('Image Dropper');
	}
	
	defineModData(modData) {
		modData.addUniformGroupsPool('Images');
	}

	defineModConfig(modConfig) {
		// let defaultSize = modConfig.addGroup('defaultSize')
		// 	.setName('Default Image Size')
		// 	.setDescription('Size to set an image to unless overridden by specific image settings');
		// defaultSize.addNaturalNumber('width')
		// 	.setDescription('Width in pixels');
		// defaultSize.addNaturalNumber('height')
		// 	.setDescription('Height in pixels');
		
		modConfig.add(
			'defaultImages',
			'MultiAsset',
			{
				collection: 'Images',
				dataType: 'IMAGE',
				elementValueType: 'ImageFile',
			})
			.setName('Default Images')
			.setDescription('An image will be randomly selected from here for users without their own collections');
		
		modConfig.addDynamicArray('userGroups', 'UserGroup')
			.setName('User-Specific Collections')
			.setDescription('Users in this list will have their image selected from their collection here');
	}
	
	loadModConfig(conf) {
		this.assets.Images.clearGroups();
		this.userGroups = {};
		
		this.assets.Images.addGroup(
			DEFAULT_GROUP_KEY,
			Object.keys(conf.defaultImages.files));
		
		conf.userGroups.forEach(userGroup => {
			if (userGroup.username && userGroup.username !== '') {
				assert(
					!(userGroup.username in this.userGroups),
					`F Shower: Duplicate entry for user "${userGroup.username}"`);
				
				this.assets.Images.addGroup(
					userGroup.username,
					Object.keys(userGroup.images.files));
				this.userGroups[userGroup.username] = userGroup.images;
			}
		});
	}
	
	functions = {
		dropImage: {
			name: 'Drop F Image',
			description: 'Drops down user-specific or a randomly selected F images from the top of the screen.',
			action: data => this.findAndSendFile(data.user),
			triggers: [
				this.trigger.command({
					cmdname: 'f',
				})
			]
		}
	}
}

module.exports = new FShower();
