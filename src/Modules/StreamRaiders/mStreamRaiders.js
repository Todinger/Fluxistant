const Module = requireMain('module');
const SkinathonCharacterEntity = require("./Config/skinathonCharacterEntity");
const SkinathonMilestoneEntity = require("./Config/skinathonMilestoneEntity");
const StreamRaidersManager = requireMain('streamRaidersManager');
const ModuleAssetLoader = requireMain('moduleAssetLoader');

const MAX_PIXEL_PROGRESS = 1920;

const NUM_OF_CHARACTERS = 4;


function isValidFile(data) {
	return data && data.file && data.file.fileKey;
}

function imageDefault(image, defaultImage) {
	if (isValidFile(image)) {
		return image;
	}

	if (isValidFile(defaultImage)) {
		return defaultImage;
	}

	return null;
}


class StreamRaiders extends Module {
	constructor() {
		super({
			name: 'Stream Raiders',
			webname: 'streamRaiders',
			source: 'streamRaiders.html',
		});

		this.sortedMilestones = [];
	}

	defineModAssets(modData) {
		modData.addUniformPool('Images');
	}

	defineModConfig(modConfig) {
		let characters = modConfig.addFixedArray('characters', 'SkinathonCharacter')
			.setName('Characters')
			.setDescription('Configuration for the displayed "character" skins');

		for (let i = 0; i < NUM_OF_CHARACTERS; i++) {
			characters.addElement(new SkinathonCharacterEntity());
		}

		let milestones = modConfig.addGroup('milestones')
			.setName('Milestone Settings')
			.setDescription('Settings for the various milestones that can be unlocked in the skinathon');

		milestones.addNonNegativeNumber('firstMilestonePos', 117)
			.setName('First Milestone Position')
			.setDescription('Distance in pixels from the **left** edge of the road at which to place the first milestone');

		milestones.addNonNegativeNumber('lastMilestonePos', 147)
			.setName('Last Milestone Position')
			.setDescription('Distance in pixels from the **right** edge of the road at which to place the last milestone');

		let defaultMilestoneValues = milestones.addChild('defaultMilestoneValues', new SkinathonMilestoneEntity())
			.setName('Default Milestone Values')
			.setDescription('Default settings that will be applied to all milestones unless overridden (offsets are added instead of replaced)');
		defaultMilestoneValues.getChild('sp').hide();

		milestones.addDynamicArray('milestones', 'SkinathonMilestone')
			.setName('Milestones')
			.setDescription('Settings for the different unlockable milestones');
	}

	loadModConfig(modConfig) {
		if (this.clientsAreConnected) {
			setTimeout(async () => await this.sendData(), 500);
		}

		let milestoneConfig = modConfig.milestones;

		this.sortedMilestones = milestoneConfig.milestones.sort((a, b) => a.sp - b.sp);
		let firstPos = milestoneConfig.firstMilestonePos;
		let lastPos = MAX_PIXEL_PROGRESS - milestoneConfig.lastMilestonePos;
		let range = lastPos - firstPos;
		let numMilestones = this.sortedMilestones.length;
		if (numMilestones === 1) {
			this.sortedMilestones.position = lastPos;
		} else {
			let segments = numMilestones - 1;
			for (let i = 0; i < numMilestones; i++) {
				this.sortedMilestones[i].position = firstPos + range * i / segments;
			}
		}
	}
	
	load() {
		this.onClientAttached(async _socket => {
			if (this.enabled) {
				await this.sendData();
			}
		});

		StreamRaidersManager.onSkinathonPointsChanged(
			(newPoints, oldPoints) => this._skinathonPointsChanged(newPoints, oldPoints)
		);
	}

	getMilestoneData() {
		let cfg = this.config.milestones;
		let def = cfg.defaultMilestoneValues;
		let milestones = [];
		for (let i = 0; i < this.sortedMilestones.length; i++) {
			let milestone = this.sortedMilestones[i];
			milestones.push({
				position: milestone.position,
				bg: {
					locked: imageDefault(milestone.lockedBackImage, def.lockedBackImage),
					unlocked: imageDefault(milestone.unlockedBackImage, def.unlockedBackImage),
				},
				reward: {
					image: imageDefault(milestone.reward.image, def.reward.image),
					centerX: milestone.reward.centerX + def.reward.centerX,
					centerY: milestone.reward.centerY + def.reward.centerY,
					offsetX: milestone.reward.offsetX + def.reward.offsetX,
					offsetY: milestone.reward.offsetY + def.reward.offsetY,
				},
				enemy: {
					image: imageDefault(milestone.enemy.image, def.enemy.image),
					deathImage: imageDefault(milestone.enemy.deathImage, def.enemy.deathImage),
					centerX: milestone.enemy.centerX + def.enemy.centerX,
					centerY: milestone.enemy.centerY + def.enemy.centerY,
					offsetX: milestone.enemy.offsetX + def.enemy.offsetX,
					offsetY: milestone.enemy.offsetY + def.enemy.offsetY,
				},
			});
		}

		return milestones;
	}

	async sendData() {
		let mal = new ModuleAssetLoader(this.assets.Images);
		let data = {
			characters: this.config.characters,
			milestones: this.getMilestoneData(),
		}

		let webData = await mal.loadWeb(data);

		this.broadcastEvent('setData', webData);
	}

	_skinathonPointsChanged(newPoints, _oldPoints) {
		if (newPoints < 0) return;
		const MAX_SP = 100;
		if (newPoints > MAX_SP) newPoints = MAX_SP;
		let pixelProgress = Math.round((newPoints / MAX_SP) * MAX_PIXEL_PROGRESS);
		this.broadcastEvent('setPixelProgress', {pixelProgress, sp: newPoints});
	}
}

module.exports = new StreamRaiders();
