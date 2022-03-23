const path = require("path");
const Module = requireMain('module');
const SoundPlayer = requireMain('externals').SoundPlayer;
const Utils = requireMain('utils');
const CLI = requireMain('cliManager');

class Hell extends Module {
	constructor() {
		super({
			name: 'Hell',
		});
		
		this.data.souls = {};
	}
	
	defineModAssets(modData) {
		modData.addUniformPool('Sounds');
	}
	
	defineModConfig(modConfig) {
		modConfig.addChild('sound', 'Sound')
			.setName('Sound')
			.setDescription('The sound that will be played when a user sells their soul.');
	}
	
	normalizeVolume(volume) {
		if (volume === undefined) {
			volume = 100;
		}
		
		return volume / 100;
	}
	
	calculateFinalVolume(volume) {
		return this.normalizeVolume(this.config.masterVolume) *
			this.normalizeVolume(volume);
	}
	
	sellSoul(data) {
		if (this.data.souls[data.user.name]) {
			return false;
		}
		
		this.data.souls[data.user.name] = data.user.displayName;
		this.saveData();
		
		let soundFile = this.assets.Sounds.selectFileLocal();
		if (soundFile) {
			SoundPlayer.play(
				path.resolve(soundFile.path),
				this.calculateFinalVolume(this.config.sound.volume));
		}
	}
	
	getSoulCount() {
		return Object.keys(this.data.souls).length;
	}
	
	soulReport() {
		let victims = Utils.makeEnglishAndList(Object.values(this.data.souls));
		let report = `${this.getSoulCount()} souls have been sold so far by: ${victims}`;
		this.print(report);
	}
	
	resetSouls() {
		this.data.souls = {};
		this.saveData();
	}
	
	load() {
		CLI.on(['souls'], () => this.soulReport());
	}
	
	functions = {
		sellSoul: {
			name: 'Sell Soul',
			description: "The user's soul is sold for all eternity (fails if already sold)",
			action: data => this.sellSoul(data),
			responses: [
				this.response.chat('/me finds the soul of $user absolutely scrumptious!'),
			],
			failResponses: [
				this.response.chat('Yo'),
			],
		},

		soulReport: {
			name: 'Soul Report',
			description: "Give a report of the souls acquired so far",
			triggers: [
				this.trigger.command({
					cmdname: 'soulreport',
				}),
			],
			filters: [
				this.filter.isMod(),
			],
			action: () => this.soulReport(),
		},
		
		resetSouls: {
			name: 'Reset Souls',
			description: "Reset the record of sold souls",
			triggers: [
				this.trigger.command({
					cmdname: 'resetsouls',
				}),
			],
			filters: [
				this.filter.specificUser('yecatsmailbox'),
			],
			action: () => this.resetSouls(),
		},
	}
	
	variables = [
		this.variable.getter('total', {
			name: 'Total Souls (`$total`)',
			description: 'The total amount of souls sold to date',
			example: '"The devil has eaten `$total` souls so far!" ---When the total is 123---> ""The devil has eaten 123 souls so far!"',
			expr: '$total',
			getter: () => this.getSoulCount(),
		}),
	]
}

module.exports = new Hell();
