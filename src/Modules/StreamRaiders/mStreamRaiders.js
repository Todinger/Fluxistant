const Module = requireMain('module');
const SkinathonCharacterEntity = require("./Config/skinathonCharacterEntity");
const SkinathonMilestoneEntity = require("./Config/skinathonMilestoneEntity");
const StreamRaidersManager = requireMain('streamRaidersManager');
const ModuleAssetLoader = requireMain('moduleAssetLoader');
const Utils = requireMain('./utils');

const MAX_PIXEL_PROGRESS = 1920;
const MAX_SP = 1100;

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
		this.currentSP = 0;
		this.currentPixelProgress = 0;
		this.nextMilestoneIndex = 0;
	}

	defineModAssets(modData) {
		modData.addUniformPool('Images');
	}

	defineModConfig(modConfig) {
		modConfig.addNaturalNumber('attackDuration', 0)
			.setName('Attack Duration')
			.setDescription('How long the attack and death animations will be played when a milestone is unlocked');

		modConfig.addNonNegativeNumber('advancementPixelsPerSecond', 0)
			.setName('Advancement Speed (in pixels per second)')
			.setDescription('How quickly characters move on the road');

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
			attackDuration: this.config.attackDuration,
			advancementPixelsPerSecond: this.config.advancementPixelsPerSecond,
			characters: this.config.characters,
			milestones: this.getMilestoneData(),
		}

		let webData = await mal.loadWeb(data);

		this.broadcastEvent('setData', webData);
	}

	_skinathonPointsChanged(newPoints, _oldPoints) {
		if (newPoints < 0) return;
		if (newPoints > MAX_SP) newPoints = MAX_SP;
		let pixelProgress = Math.round((newPoints / MAX_SP) * MAX_PIXEL_PROGRESS);
		this.broadcastEvent('setPixelProgress', {pixelProgress, sp: newPoints});
	}

	setProgressDirect() {
		this.broadcastEvent('setPixelProgress', {
			pixelProgress: this.currentPixelProgress,
			sp: this.currentSP,
		});
	}

	lastClearedMilestoneIndexForSP(sp) {
		for (let i = 0; i < this.sortedMilestones.length; i++) {
			if (this.sortedMilestones[i].sp > sp) {
				return i - 1;
			}
		}
	}

	pixelProgressFromSP(sp, nextMilestoneIndex) {
		let leftSP, leftPosition, rightSP, rightPosition;
		if (nextMilestoneIndex === 0) {
			leftSP = 0;
			leftPosition = 0;
			rightSP = this.sortedMilestones[0].sp;
			rightPosition = this.sortedMilestones[0].position;
		} else {
			let leftMilestone, rightMilestone;
			if (nextMilestoneIndex >= this.sortedMilestones.length - 1) {
				leftMilestone = this.sortedMilestones[this.sortedMilestones.length - 1];
				rightMilestone = this.sortedMilestones[this.sortedMilestones.length - 2];
			} else {
				leftMilestone = this.sortedMilestones[nextMilestoneIndex - 1];
				rightMilestone = this.sortedMilestones[nextMilestoneIndex];
			}

			leftSP = leftMilestone.sp;
			leftPosition = leftMilestone.position;
			rightSP = rightMilestone.sp;
			rightPosition = rightMilestone.position;
		}

		let alpha = (sp - leftSP) / (rightSP - leftSP);
		return Math.round(leftPosition + alpha * (rightPosition - leftPosition));
	}

	makeAdvanceEvent(targetPixelProgress, targetSP) {
		return {
			name: 'advance',
			data: {targetPixelProgress, targetSP},
		};
	}

	makeConquerEvent(milestoneIndex) {
		return {
			name: 'conquer',
			data: {milestoneIndex},
		};
	}

	makeLockEvent(milestoneIndex) {
		return {
			name: 'lock',
			data: {milestoneIndex},
		};
	}

	createFlatProgressEvent(newSP) {
		let pixelProgress = Math.round((newSP / MAX_SP) * MAX_PIXEL_PROGRESS);
		return this.makeAdvanceEvent(pixelProgress, newSP);
	}

	createDirectAdvanceEvent(newSP, nextMilestoneIndex) {
		let pixelProgress = this.pixelProgressFromSP(newSP, nextMilestoneIndex);
		return this.makeAdvanceEvent(pixelProgress, newSP);
	}

	createProgressEvents(newSP) {
		if (this.sortedMilestones.length <= 1) {
			return [this.createFlatProgressEvent(newSP)];
		}

		let events = [];
		let lastClearedMilestoneIndex = this.lastClearedMilestoneIndexForSP(newSP);
		for (let index = this.nextMilestoneIndex; index <= lastClearedMilestoneIndex; index++) {
			const milestone = this.sortedMilestones[index];
			events.push(this.makeAdvanceEvent(milestone.position, milestone.sp));
			events.push(this.makeConquerEvent(index));
		}

		let lastClearedMilestoneSP =
			lastClearedMilestoneIndex >= 0 ?
				this.sortedMilestones[lastClearedMilestoneIndex].sp :
				0;

		if (newSP > lastClearedMilestoneSP) {
			let pixelProgress = this.pixelProgressFromSP(newSP, lastClearedMilestoneIndex + 1);
			events.push(this.makeAdvanceEvent(pixelProgress, newSP));
		}

		return {
			nextMilestoneIndex: lastClearedMilestoneIndex + 1,
			events,
		};
	}

	setSP(sp) {
		let events;
		if (sp < this.currentSP) {
			let newNextMilestoneIndex = this.lastClearedMilestoneIndexForSP(sp) + 1;
			events = [this.createDirectAdvanceEvent(sp, newNextMilestoneIndex)];
			for (let index = newNextMilestoneIndex; index < this.nextMilestoneIndex; index++) {
				events.push(this.makeLockEvent(index));
			}

			this.nextMilestoneIndex = newNextMilestoneIndex;
		} else {
			let progress = this.createProgressEvents(sp);
			this.nextMilestoneIndex = progress.nextMilestoneIndex;
			events = progress.events;
		}

		this.currentSP = sp;

		this.broadcastEvent('eventList', events);
	}

	directSetSP(data) {
		if (!Utils.isNonEmptyString(data.firstParam)) {
			return;
		}

		let sp = parseInt(data.firstParam);
		this.setSP(sp);
	}

	functions = {
		setSP: {
			name: 'Set SP',
			description: 'Set the current SP for the skinathon',
			triggers: [
				this.trigger.cli({
					cmdname: 'sp',
				}),
			],
			action: data => this.directSetSP(data),
		},
	}
}

module.exports = new StreamRaiders();
