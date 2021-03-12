'use strict';

const assert = require('assert').strict;
const Module = requireMain('module');

const DEFAULT_GROUP_KEY = '[Defaults]';

class FShower extends Module {
	constructor() {
		super({
			name: 'F Shower',
			tags: ['imgdrop'], 
		});
		
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
				this.broadcastEvent('dropImage', displayData);
			});
	}
	
	defineModData(modData) {
		modData.addUniformGroupsPool('Images');
	}

	defineModConfig(modConfig) {
		modConfig.add(
			'defaultImages',
			'MultiData',
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
	
	commands = {
		['f']: {
			name: 'Drop F Image',
			description: 'Drops down user-specific or a randomly selected F images from the top of the screen.',
			callback: user => this.findAndSendFile(user),
		}
	}
}

module.exports = new FShower();
