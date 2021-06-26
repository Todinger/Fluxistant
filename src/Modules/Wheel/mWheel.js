const Module = requireMain('module');
const Utils = requireMain('utils');
const User = requireMain('user').User;

// These should be a bit beyond the min/max in wheel.mjs, so that when
// adding the random flux after clamping, the result will still be
// within the range accepted by the client - this is to avoid a
// situation where the viewers can force a specific number by going
// to extremes
const MIN_POWER = 5;
const MAX_POWER = 50;

class WheelModule extends Module {
	constructor() {
		super({
			name: 'Wheel',
			webname: 'wheel',
			source: 'wheel.html',
		});
		
		this.wheels = [];
		this.showFunctionObjects = [];
		
		this.currentSpin = null;
	}
	
	defineModAssets(modData) {
		modData.addNamedCollection('Images');
		modData.addNamedCollection('Videos');
	}
	
	defineModConfig(modConfig) {
		modConfig.addDuration('spinDuration', 5)
			.setName('Spin Duration')
			.setDescription('How long it takes for a wheel to spin before it stops');
		
		modConfig.addPositiveNumber('defaultPower', 8)
			.setName('Default Power')
			.setDescription('Base power for spinning the wheel if none is provided (randomized by power flux)');
		modConfig.addPositiveNumber('powerFlux', 4)
			.setName('Power Flux')
			.setDescription('How much the chosen spin power can be offset randomly (result is in [power - flux, power + flux])');
		
		modConfig.addDynamicArray('wheels', 'Wheel')
			.setName('Wheels')
			.setDescription('All the lucky wheels that can show up on your marvelous stream');
	}
	
	loadModConfig(conf) {
		this.deactivateFunctions(this.showFunctionObjects);
		if (!conf.enabled) {
			return;
		}
		
		this.wheels = conf.wheels;
		
		this.showFunctionObjects = {};
		let i = 0;
		conf.wheels.forEach(wheel => {
			wheel.index = i++;
			wheel.showFunction.action = (data) => this.show(wheel, data);
			
			let funcObject = this.createFunctionObject(wheel.showFunction);
			if (!funcObject.funcID) {
				funcObject.funcID = `WheelShowFunc[${i}]`;
			}
			
			this.showFunctionObjects[funcObject.funcID] = funcObject;
		});
		
		this.activateFunctions(this.showFunctionObjects);
		
		this.makeClientWheels()
			.then(data => this.broadcastEvent('setWheels', data))
			.catch(err => this.error(err));
	}
	
	async getAsset(conf, assetCollection) {
		// let conf = wheel.video;
		let fileConf = conf.file;
		let hasAsset = assetCollection.hasKey(fileConf.fileKey);
		if (hasAsset) {
			let file = await this.assets.getFileWeb(fileConf);
			return conf.makeDisplayData(file);
		} else {
			return undefined;
		}
	}
	
	async makeWheelInfo(wheel) {
		let wheelInfo = {
			wheelData: wheel.wheelData,
			segments: wheel.segments,
			extras: {
				title: wheel.title,
			},
		};
		
		// let videoConf = wheel.video;
		// let videoFileConf = videoConf.file;
		// let hasVideo = this.assets.Videos.hasKey(videoFileConf.fileKey);
		// if (hasVideo) {
		// 	let videoFile = await this.assets.getFileWeb(videoFileConf);
		// 	wheelInfo.extras.video = videoConf.makeDisplayData(videoFile);
		// }
		
		wheelInfo.extras.video = await this.getAsset(wheel.video, this.assets.Videos);
		wheelInfo.extras.bgImage = await this.getAsset(wheel.wheelData.bgImage, this.assets.Images);
		wheelInfo.extras.marker = await this.getAsset(wheel.wheelData.marker, this.assets.Images);
		
		return wheelInfo;
	}
	
	async makeWheelsInfo() {
		let wheelsData = [];
		for (let i = 0; i < this.wheels.length; i++) {
			wheelsData.push(await this.makeWheelInfo(this.wheels[i]));
		}
		
		return wheelsData;
	}
	
	async makeClientWheels() {
		let data = {};
		data.wheels = await this.makeWheelsInfo();
		data.duration = this.config.spinDuration;
		return data;
	}
	
	load() {
		this.onClientAttached(socket => {
			socket.on('getWheels', async () => {
				try {
					let data = await this.makeClientWheels();
					socket.emit('setWheels', data);
				} catch (err) {
					this.error(err);
				}
			});
			
			socket.on('result', result => {
				if (this.currentSpin) {
					this.currentSpin.finished = true;
					// Consider doing something with the result
				}
			});
			
			socket.on('ready', () => {
				if (this.currentSpin) {
					this.currentSpin.ready = true;
				}
			});
		});
	}
	
	show(wheel, data) {
		this.currentSpin = {
			wheel,
			forUser: User.toUsername(data.firstParam),
			ready: false,
			finished: false,
		}
		
		this.broadcastEvent('show', wheel.index);
	}
	
	hide() {
		this.broadcastEvent('hide');
		this.currentSpin = null;
	}
	
	spin(data) {
		if (!this.currentSpin || !this.currentSpin.ready || this.currentSpin.finished) {
			return;
		}
		
		if (!data.user.isAtLeastMod &&
			!(this.currentSpin.forUser && data.user.name === this.currentSpin.forUser)) {
				return;
		}
		
		let power = Number(data.firstParam);
		if (Number.isNaN(power) || power <= 0) {
			power = this.config.defaultPower;
		}
		
		power = Utils.clamp(MIN_POWER, power, MAX_POWER);
		power = Utils.randomInRadius(power, this.config.powerFlux);
		
		this.broadcastEvent('spin', { power });
	}
	
	respin(data) {
		if (this.currentSpin && this.currentSpin.finished && data.user.isAtLeastMod) {
			this.currentSpin.finished = false;
			this.spin(data);
		}
	}
	
	functions = {
		hide: {
			name: 'Hide Wheel',
			description: "Hides this wheel if it's showing",
			action: () => this.hide(),
			triggers: [
				this.trigger.command({
					cmdname: 'hidewheel',
				}),
			],
			filters: [
				this.filter.isMod(),
			],
		},
		
		spin: {
			name: 'Spin Wheel',
			description: 'Spins this wheel, if it is showing',
			action: data => this.spin(data),
			triggers: [
				this.trigger.command({
					cmdname: 'spin',
				}),
			],
		},
		
		respin: {
			name: 'Re-spin Wheel',
			description: 'Spins this wheel again (if it is showing), hiding the previous win',
			action: data => this.respin(data),
			triggers: [
				this.trigger.command({
					cmdname: 'respin',
				}),
			],
		},
	}
}

module.exports = new WheelModule();
