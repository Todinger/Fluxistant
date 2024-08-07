const schedule = require('node-schedule');
const Module = requireMain('module');
const { MINUTES } = requireMain('constants');
const Timers = requireMain('./timers');
const Utils = requireMain('utils');

const PLACEHOLDERS = {
	USER: '$user',
	CATCHES: '$caught',
	NORMALS: '$normals',
	SHINIES: '$shinies',
	SEPIAS: '$sepias',
	GALAXIES: '$galaxies',
	BALLS: {
		YARN: '$yarnballs',
		GOLD: '$goldballs',
		RAINBOW: '$prettyballs',
		DARK: '$darkballs',
		STAR: '$starballs',
	},
	YARN: '$numyarn',
	STARDUST_YARN: '$stardust',
};

const BALLS = {
	NORMAL: 'normal',
	YARN: 'yarnball',
	GOLD: 'goldball',
	RAINBOW: 'prettyball',
	DARK: 'darkball',
	STAR: 'starball',
}

const CATCH_TYPES = {
	normal: "normal",
	sepia: "sepia",
	shiny: "shiny",
	galaxy: "galaxy",
	all: "all",
};

// These either do not have a function yet or it is present but not usable yet
const SECRET_BALLS = [
	BALLS.RAINBOW,
	BALLS.DARK,
];

const NORMAL_BALL = {
	name: BALLS.NORMAL,
	catchMultiplier: 1,
	shinyMultiplier: 1,
	secret: false,
}

const SHINY_CATCHERS_MESSAGE_PREFIX = "✨ You gotta be kitten me! Look who caught a rare shiny Yecats! ✨ ";
const CATCH_VARIABLE_HITS = '$user = user name, $caught = total, $normals = normal catches, ' +
	'$shinies = shiny catches, $sepias = sepia catches, $yarnballs = yarn balls, $goldballs = gold balls, ' +
	'$prettyballs = pretty (rainbow) balls, $darkballs = dark balls, $numyarn = current yarn, ' +
	'$stardust = current stardust yarn, $starballs = star balls, $galaxies = Galaxyecats catches';

// Amount of yarn a user gets for each catch attempt
const YARN_PER_THROW = 1;

const WISH_REWARD_WEIGHTS = {
	yarn: 80,
	ball: 18,
	guarantee: 2,
};
const WISH_REWARD_WEIGHTS_WITHOUT_GUARANTEE = {
	yarn: 80,
	ball: 18,
};

const GALAXYECATS_APPEARANCE_TIME = {
	hour: 11,
	minute: 0,
}

const EXTRA_CATCHES_POKYECATS_NAMES = [
	'sepia',
	'galaxy',
];


class Pokyecats extends Module {
	static Interface = class PokyecatsInterface extends Module.Interface {
		constructor(inst) {
			super(inst);
		}

		defineMethods() {
			return {
				addYarn: (conf, username, displayName, amount) =>
					this.inst.addYarn(username, displayName, amount),
				addYarnBall: (conf, username, displayName, amount) =>
					this.inst.addBall(username, displayName, BALLS.YARN, amount),
				addGoldBall: (conf, username, displayName, amount) =>
					this.inst.addBall(username, displayName, BALLS.GOLD, amount),
				addRainbowBall: (conf, username, displayName, amount) =>
					this.inst.addBall(username, displayName, BALLS.RAINBOW, amount),
				addDarkBall: (conf, username, displayName, amount) =>
					this.inst.addBall(username, displayName, BALLS.DARK, amount),
				addCatches: (conf, username, displayName, amount) =>
					this.inst.addCatches(username, displayName, amount),
				addShinyCatches: (conf, username, displayName, amount) =>
					this.inst.addShinyCatches(username, displayName, amount),
			};
		}
	};

	constructor() {
		super({
			name: 'Pokyecats',
			tags: ['imgdisp'],
			description: 'Yecats! Yecats! Iioooooioooioiiiooo...',
		});
		
		this.data.catches = {};
		this.catchChance = 0;
		this.shinyChance = 0;
		this.galaxyCatchChance = 0;

		this.wishRewards = {
			yarn: (...p) => this.giveStardustYarn(...p),
			ball: (...p) => this.giveStarBall(...p),
			guarantee: (...p) => this.giveGalaxyecatsCatchGuarantee(...p),
		}

		this.galaxyecatsStarActive = false;
		this.galaxyecatsAppearanceTime = null;
		this.announceGalaxyecatsJob = null;
		this.galaxyecatsStarTimer = Timers.oneShot(() => this._activateStar());

		this.currentWishMakers = [];
	}
	
	defineModAssets(modData) {
		modData.addNamedCollection('Images');
		modData.addNamedCollection('Sounds');
		modData.addNamedCollection('Videos');
	}
	
	defineModConfig(modConfig) {
		modConfig.addPercentageNumber('catchChance', 20)
			.setName('Catch Chance')
			.setDescription('The odds of catching Yecats (0-100)');
		modConfig.addPercentageNumber('shinyChance', 5)
			.setName('Shiny Chance')
			.setDescription('The odds of Yecats being shiny *if caught* (0-100)');
		modConfig.addPercentageNumber('sepiaChance', 50)
			.setName('Sepia Chance')
			.setDescription('The odds of Yecats being sepia *if caught while a tornado is active* (0-100)');
		modConfig.addString('normalCatchMessage', "You caught a Yecats! That's $caught so far!")
			.setName('Catch Message: Normal')
			.setDescription('Message to send when a *non-shiny* Yecats is caught and no past shinies have been caught ' +
							`(${CATCH_VARIABLE_HITS})`);
		modConfig.addString('missMessage', "Aww, you missed her! You're still at $caught so far.")
			.setName('Miss Message')
			.setDescription('Message to send when failed to catch Yecats and no past shinies have been caught ' +
							`(${CATCH_VARIABLE_HITS})`);
		modConfig.addString('normalCatchMessageWithShinies', "You caught a Yecats! That's $caught so far: $normals Yecats(es) and $shinies SHINY Yecats(es)!")
			.setName('Catch Message: Normal (Had Shinies)')
			.setDescription('Message to send when a *non-shiny* Yecats is caught and shinies have been caught before ' +
							`(${CATCH_VARIABLE_HITS})`);
		modConfig.addString('missMessageWithShinies', "Aww, you missed her! You're still at $caught: $normals Yecats(es) and $shinies SHINY Yecats(es).")
			.setName('Miss Message (Had Shinies)')
			.setDescription('Message to send when failed to catch Yecats and shinies have been caught before ' +
							`(${CATCH_VARIABLE_HITS})`);
		modConfig.addString('shinyCatchMessage', "YOU CAUGHT A SHINY YECATS! :O That's $caught in total: $normals Yecats(es) and $shinies SHINY Yecats(es)!")
			.setName('Catch Message: Shiny')
			.setDescription('Message to send when a *shiny* Yecats is caught ' +
							`(${CATCH_VARIABLE_HITS})`);
		modConfig.addString('sepiaCatchMessage', "You caught a vintage sepia-tone Yecats! That's $caught in total: $normals Yecats(es), $sepias sepia Yecats(es) and $shinies SHINY Yecats(es)!")
			.setName('Catch Message: Sepia')
			.setDescription('Message to send when a *sepia* Yecats is caught ' +
							`(${CATCH_VARIABLE_HITS})`);

		let mediaConfig = modConfig.addGroup('media')
			.setName('Media Files')
			.setDescription('The images, sounds and videos to show for the various Yecats types');
		mediaConfig.add('regular', 'SingleMedia')
			.setName('Pokyecats')
			.setDescription('Media for the regular Pokyecats form');
		mediaConfig.add('shiny', 'SingleMedia')
			.setName('Shiny Pokyecats')
			.setDescription('Media for the shiny Pokyecats form');
		mediaConfig.add('legendary', 'SingleMedia')
			.setName('Legendary Pokyecats')
			.setDescription('Media for the legendary Pokyecats form');
		mediaConfig.add('sepia', 'SingleMedia')
			.setName('Sepia Pokyecats')
			.setDescription('Media for the sepia-toned Pokyecats form');
		mediaConfig.add('galaxy', 'SingleMedia')
			.setName('Galaxyecats')
			.setDescription('Media for the Galaxyecats form');

		let ballConfig = modConfig.addGroup('ballConfig')
			.setName('Ball Settings')
			.setDescription('Yarn ball-related settings');
		ballConfig.add(BALLS.YARN, 'WeavableBallConfig')
			.setName('Yarn Ball')
			.setDescription('Settings for the standard Yarn Ball')
			.setYarnToWeave(5);
		ballConfig.add(BALLS.GOLD, 'WeavableBallConfig')
			.setName('Golden Yarn Ball')
			.setDescription('Settings for the Golden Yarn Ball')
			.setYarnToWeave(50);
		ballConfig.add(BALLS.RAINBOW, 'BallConfig')
			.setName('Rainbow Yarn Ball')
			.setDescription('Settings for the Rainbow Yarn Ball');

		let galaxyecats = modConfig.addGroup('galaxyecats')
			.setName('Galaxyecats Settings')
			.setDescription('Settings for the Galaxyecats form');
		galaxyecats.addBoolean('active', false)
			.setName('Galaxyecats Active')
			.setDescription('When enabled, Galaxyecats will approach our planet after dark');
		galaxyecats.addPercentageNumber('catchChance', 50)
			.setName('Galaxyecats Catch Chance')
			.setDescription('The odds of catching Galaxyecats with a star ball when she is near (0-100)');
		galaxyecats.addNaturalNumber('yarnPerThrow', 1)
			.setName('Stardust Yarn Per Throw')
			.setDescription('How many pieces of stardust yarn viewers obtain each time they use a star ball');
		galaxyecats.addNaturalNumber('yarnPerWish', 1)
			.setName('Stardust in Wishes')
			.setDescription('How many pieces of stardust yarn viewers may obtain from wishing upon a star');
		galaxyecats.addNaturalNumber('yarnToWeaveStarBall', 1)
			.setName('Yarn to Weave Star Ball')
			.setDescription('How many pieces of stardust yarn are required to weave a star ball');
		galaxyecats.addNaturalNumber('starMinInterval', 45)
			.setName('Star: Minimum Interval')
			.setDescription('The minimum amount of time between star appearances (in minutes)');
		galaxyecats.addNaturalNumber('starMaxInterval', 60)
			.setName('Star: Maximum Interval')
			.setDescription('The minimum amount of time between star appearances (in minutes)');
		galaxyecats.addDuration('starDuration', 90)
			.setName('Star Duration')
			.setDescription('The amount of time the star remains active (in seconds)');
		galaxyecats.addString('starArrivesMessage', "A shooting star crosses the sky! Quick, make a !wish before it goes away!")
			.setName('Star Arrives Message')
			.setDescription('Message to send when the shooting star arrives');
		galaxyecats.addString('starLeavesMessage', "The shooting star fades into the vast reaches of space...")
			.setName('Star Leaves Message')
			.setDescription('Message to send when the shooting star leaves');
		galaxyecats.addString('galaxyecatsArrivesMessage', "The planets align! A cosmic wonder approaches the Earth!")
			.setName('Galaxyecats Arrives Message')
			.setDescription('Message to send when it becomes possible to catch Galaxyecats');
		galaxyecats.addString('catchMessage', "You've managed to pluck a galactic kitty out of the sky! You have caught $galaxies Galaxyecats(es) so far!")
			.setName('Catch Message: Galaxyecats')
			.setDescription('Message to send when a Galaxyecats is caught ' +
				`(${CATCH_VARIABLE_HITS})`);
		galaxyecats.addString('missMessage', `Your ${BALLS.STAR} couldn't reach her! It disappears into the endless black...`)
			.setName('Miss Message: Galaxyecats')
			.setDescription('Message to send when a Galaxyecats is failed to be caught ' +
				`(${CATCH_VARIABLE_HITS})`);
	}

	defineModDependencies() {
		this.twister = this.use('Twister');
	}

	_sendToDisplay(mediaDesc) {
		let imageConf = mediaDesc.image;
		let soundConf = mediaDesc.sound;
		let videoConf = mediaDesc.video;
		let imageFileConf = imageConf.file;
		let soundFileConf = soundConf.file;
		let videoFileConf = videoConf.file;
		let hasImage = this.assets.Images.hasKey(imageFileConf.fileKey);
		let hasSound = this.assets.Sounds.hasKey(soundFileConf.fileKey);
		let hasVideo = this.assets.Videos.hasKey(videoFileConf.fileKey);
		
		let imagePromise = hasImage ?
		                   this.assets.getFileWeb(imageFileConf) :
		                   Promise.resolve();
		
		let soundPromise = hasSound ?
		                   this.assets.getFileWeb(soundFileConf) :
		                   Promise.resolve();
		
		let videoPromise = hasVideo ?
		                   this.assets.getFileWeb(videoFileConf) :
		                   Promise.resolve();
		
		if (hasImage || hasSound || hasVideo) {
			Promise.all([imagePromise, soundPromise, videoPromise])
			.then(([imageFile, soundFile, videoFile]) => {
				let parameters = {};
				if (hasImage) {
					parameters.image = imageConf.makeDisplayData(imageFile);
				}
				
				if (hasSound) {
					parameters.sound = soundConf.makeDisplayData(soundFile);
				}
				
				if (hasVideo) {
					parameters.video = videoConf.makeDisplayData(videoFile);
				}
				
				this.broadcastEvent('showImage', parameters);
			});
		}
	}
	
	loadModConfig(conf) {
		if (conf.galaxyecats.yarnToWeaveStarBall < 1) {
			throw "The amount of yarn to weave a star ball must be at least 1.";
		}

		this.catchChance = conf.catchChance / 100;
		this.shinyChance = conf.shinyChance / 100;
		this.sepiaChance = conf.sepiaChance / 100;
		this.galaxyCatchChance = conf.galaxyecats.catchChance / 100;

		if (this.announceGalaxyecatsJob !== null) {
			this.announceGalaxyecatsJob.cancel();
		}

		this.galaxyecatsAppearanceTime = new Date();
		this.galaxyecatsAppearanceTime.setHours(
			GALAXYECATS_APPEARANCE_TIME.hour,
			GALAXYECATS_APPEARANCE_TIME.minute,
			0,
			0
		);
		this.announceGalaxyecatsJob = schedule.scheduleJob(
			GALAXYECATS_APPEARANCE_TIME,
			() => this._announceGalaxyecats()
		);

		this._scheduleNextStar();
	}

	_announceGalaxyecats() {
		if (this.enabled && this.config.galaxyecats.active) {
			this.say(this.config.galaxyecats.galaxyecatsArrivesMessage);
		}
	}

	_scheduleNextStar() {
		this.galaxyecatsStarTimer.set(Utils.randomRange(
			this.config.galaxyecats.starMinInterval * MINUTES,
			this.config.galaxyecats.starMaxInterval * MINUTES,
		));
	}

	_activateStar() {
		this.galaxyecatsStarActive = true;
		setTimeout(() => this._deactivateStar(), this.config.galaxyecats.starDuration);

		if (this.enabled) {
			this.say(this.config.galaxyecats.starArrivesMessage);
		}
	}

	_deactivateStar() {
		this.galaxyecatsStarActive = false;
		this.currentWishMakers = [];
		this._scheduleNextStar();

		if (this.enabled) {
			this.say(this.config.galaxyecats.starLeavesMessage);
		}
	}

	_grantStardustYarn(catchData, amount) {
		let normalizedAmount = catchData.stardustYarn % this.config.galaxyecats.yarnToWeaveStarBall;
		catchData.stardustYarn += amount;
		normalizedAmount += amount;

		if (normalizedAmount >= this.config.galaxyecats.yarnToWeaveStarBall) {
			catchData.balls[BALLS.STAR]++;
		}
	}

	giveStardustYarn(user, catchData) {
		this._grantStardustYarn(catchData, this.config.galaxyecats.yarnPerWish);
		this.tell(user, `You got some stardust yarn! You now have ${catchData.stardustYarn} pieces!`)
	}

	giveStarBall(user, catchData) {
		catchData.balls[BALLS.STAR]++;
		this.tell(user, `You got a ${BALLS.STAR}! You now have ${catchData.balls[BALLS.STAR]} of them!`)
	}

	giveGalaxyecatsCatchGuarantee(user, catchData) {
		catchData.galaxyecatsGuarantee = true;
		this.tell(user, "You hear a faint meow and feel empowered by feline galactic forces!")
	}

	persistentDataLoaded() {
		Object.keys(this.data.catches).forEach(user => {
			this.migrateCatchData(this.data.catches[user]);
		});
	}
	
	getDisplayName(user) {
		return this.data.catches[user].displayName ?? user;
	}
	
	newBallData() {
		return {
			[BALLS.YARN]: 0,
			[BALLS.GOLD]: 0,
			[BALLS.RAINBOW]: 0,
			[BALLS.DARK]: 0,
			[BALLS.STAR]: 0,
		};
	}

	newExtraCatchesData() {
		let data = {};
		for (let name of EXTRA_CATCHES_POKYECATS_NAMES) {
			data[name] = 0;
		}

		return data;
	}
	
	newCatchData() {
		return {
			catches: 0,
			shinyCatches: 0,
			displayName: '',
			balls: this.newBallData(),
			yarn: 0,
			extraCatches: this.newExtraCatchesData(),
			stardustYarn: 0,
			galaxyecatsGuarantee: false,
		};
	}

	migrateCatchData(catchData) {
		if (catchData.balls === undefined) {
			catchData.balls = this.newBallData();
		} else {
			Object.values(BALLS).forEach((ballName) => {
				if (ballName === BALLS.NORMAL) return;

				if (catchData.balls[ballName] === undefined) {
					catchData.balls[ballName] = 0;
				}
			});
		}

		if (catchData.yarn === undefined) {
			catchData.yarn = 0;
		}

		if (catchData.stardustYarn === undefined) {
			catchData.stardustYarn = 0;
		}

		if (catchData.extraCatches === undefined) {
			catchData.extraCatches = this.newExtraCatchesData();
		}

		for (let name of EXTRA_CATCHES_POKYECATS_NAMES) {
			if (!catchData.extraCatches[name]) {
				catchData.extraCatches[name] = 0;
			}
		}
	}
	
	getUserCatchData(username, displayName) {
		if (!(username in this.data.catches)) {
			this.data.catches[username] = this.newCatchData();
			this.data.catches[username].displayName = displayName;
		}
		
		return this.data.catches[username];
	}

	getNormalCatches(catchData) {
		return catchData.catches - catchData.shinyCatches - catchData.extraCatches.sepia;
	}
	
	variableValuesFromCatchData(catchData) {
		return {
			catches: catchData.catches,
			shinyCatches: catchData.shinyCatches,
			normalCatches: this.getNormalCatches(catchData),
			sepiaCatches: catchData.extraCatches.sepia,
			yarnballs: catchData.balls[BALLS.YARN],
			goldballs: catchData.balls[BALLS.GOLD],
			prettyballs: catchData.balls[BALLS.RAINBOW],
		};
	}
	
	tellMessage(user, message, catchData) {
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.USER, this.getDisplayName(user.name));
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.CATCHES, catchData.catches);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.SHINIES, catchData.shinyCatches);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.NORMALS, this.getNormalCatches(catchData));
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.BALLS.YARN, catchData.balls[BALLS.YARN]);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.BALLS.GOLD, catchData.balls[BALLS.GOLD]);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.BALLS.RAINBOW, catchData.balls[BALLS.RAINBOW]);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.BALLS.DARK, catchData.balls[BALLS.DARK]);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.YARN, catchData.yarn);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.SEPIAS, catchData.extraCatches.sepia);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.SEPIAS, catchData.extraCatches.sepia);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.GALAXIES, catchData.extraCatches.galaxy);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.BALLS.STAR, catchData.balls[BALLS.STAR]);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.STARDUST_YARN, catchData.stardustYarn);
		this.tell(user, message);
	}
	
	tryGetBall(name) {
		if (!name) {
			return null;
		}
		
		name = name.toLowerCase();
		return Object.values(BALLS).includes(name) ? name : null;
	}
	
	consumeUserBall(catchData, ballName) {
		if (ballName === BALLS.NORMAL) {
			return true;
		}
		
		if (catchData.balls[ballName] === 0) {
			return false;
		}
		
		catchData.balls[ballName]--;
		
		return true;
	}
	
	grantBall(catchData, ball) {
		if ((this.config.ballConfig[ball].yarnToWeave > 0) && (catchData.yarn % this.config.ballConfig[ball].yarnToWeave === 0)) {
			catchData.balls[ball]++;
		}
	}
	
	grantBalls(catchData) {
		this.grantBall(catchData, BALLS.YARN);
		this.grantBall(catchData, BALLS.GOLD);
	}
	
	getBall(data) {
		let ballName = this.tryGetBall(data.firstParam) ||
			this.tryGetBall(Utils.stringReplaceAll(data.allParams, ' ', '')) ||
			BALLS.NORMAL;
		if (ballName === BALLS.NORMAL) {
			return NORMAL_BALL;
		}
		
		let config = this.config.ballConfig[ballName];
		
		return {
			name: ballName,
			catchMultiplier: config && config.catchMultiplier || 0,
			shinyMultiplier: config && config.shinyMultiplier || 0,
			secret: SECRET_BALLS.includes(ballName),
		};
	}
	
	saveCatchData(user, catchData) {
		this.data.catches[user.name] = catchData;
		this.data.catches[user.name].displayName = user.displayName;
	}

	get galaxyecatsIsNear() {
		return this.config.galaxyecats.active && new Date() >= this.galaxyecatsAppearanceTime;
	}

	tryCatchGalaxyecats(data) {
		if (!this.galaxyecatsIsNear) {
			this.tellError(data.user, "The sky is empty and devoid of any galactic kittens in sight.");
			return {
				success:   null, // Means not to send any responses at all
			};
		}

		let catchData = this.getUserCatchData(data.user.name, data.user.displayName);

		if (!this.consumeUserBall(catchData, BALLS.STAR)) {
			this.tellError(data.user, "Sorry, you don't own that ball.")

			return {
				success:   null, // Means not to send any responses at all
			};
		}

		this._grantStardustYarn(catchData, this.config.galaxyecats.yarnPerThrow);

		let media = this.config.media.galaxy;
		let caught;
		if (catchData.galaxyecatsGuarantee) {
			caught = true;
			catchData.galaxyecatsGuarantee = false;
		} else {
			caught = Math.random() < this.galaxyCatchChance;
		}

		if (!caught) {
			this.tellMessage(data.user, this.config.galaxyecats.missMessage, catchData);
			this.saveCatchData(data.user, catchData);
			this.saveData();

			this._sendToDisplay(media);

			return {
				success:   false,
				variables: this.variableValuesFromCatchData(catchData),
			};
		}

		catchData.catches++;

		catchData.extraCatches.galaxy++;
		this.tellMessage(data.user, this.config.galaxyecats.catchMessage, catchData);

		this._sendToDisplay(media);

		this.saveCatchData(data.user, catchData);

		this.saveData();

		return {
			success:   true,
			variables: this.variableValuesFromCatchData(catchData),
		};
	}

	tryCatch(data) {
		let catchData = this.getUserCatchData(data.user.name, data.user.displayName);
		
		let ball = this.getBall(data);
		if (ball.secret) {
			this.tellError(data.user, "The purpose of that ball has yet to be revealed...");

			return {
				success:   null, // Means not to send any responses at all
			};
		}

		if (ball.name === BALLS.STAR) {
			return this.tryCatchGalaxyecats(data);
		}

		if (!this.consumeUserBall(catchData, ball.name)) {
			this.tellError(data.user, "Sorry, you don't own that ball.")
			
			return {
				success:   null, // Means not to send any responses at all
			};
		}
		
		// Grant yarn for the attempt
		catchData.yarn += YARN_PER_THROW;
		
		// Give any balls the viewer is entitled for
		this.grantBalls(catchData);

		this.saveCatchData(data.user, catchData);
		this.saveData();

		// Caught only if the result is < catch chance
		let catchChance = this.catchChance * ball.catchMultiplier;
		if (Math.random() >= catchChance) {
			if (catchData.shinyCatches > 0) {
				this.tellMessage(data.user, this.config.missMessageWithShinies, catchData);
			} else {
				this.tellMessage(data.user, this.config.missMessage, catchData);
			}
			
			this.saveCatchData(data.user, catchData);
			
			this._sendToDisplay(this.config.media.regular);
			
			return {
				success:   false,
				variables: this.variableValuesFromCatchData(catchData),
			};
		}
		
		catchData.catches++;

		let shiny = false, sepia = false;

		if (this.twister.isActive()) {
			sepia = Math.random() < this.sepiaChance;
		}

		if (!sepia) {
			let shinyChance = this.shinyChance * ball.shinyMultiplier;
			shiny = Math.random() < shinyChance;
		}

		let media = this.config.media.regular;

		if (sepia) {
			media = this.config.media.sepia;
			catchData.extraCatches.sepia++;
			this.tellMessage(data.user, this.config.sepiaCatchMessage, catchData);
		} else if (shiny) {
			media = this.config.media.shiny;
			catchData.shinyCatches++;
			this.tellMessage(data.user, this.config.shinyCatchMessage, catchData);
		} else if (catchData.shinyCatches > 0) {
			this.tellMessage(data.user, this.config.normalCatchMessageWithShinies, catchData);
		} else {
			this.tellMessage(data.user, this.config.normalCatchMessage, catchData);
		}
		
		this._sendToDisplay(media);

		this.saveCatchData(data.user, catchData);
		
		this.saveData();
		
		return {
			success:   true,
			variables: this.variableValuesFromCatchData(catchData),
		};
	}

	wish(data) {
		if (!this.galaxyecatsStarActive) {
			return false;
		}

		if (this.currentWishMakers.includes(data.user.name)) {
			return false;
		}

		let catchData = this.getUserCatchData(data.user.name, data.user.displayName);
		const rewardWeights = catchData.galaxyecatsGuarantee ?
			WISH_REWARD_WEIGHTS_WITHOUT_GUARANTEE :
			WISH_REWARD_WEIGHTS;
		let reward = Utils.weightedRandomKey(rewardWeights);
		this.wishRewards[reward](data.user, catchData);
		this.saveCatchData(data.user, catchData);
		this.saveData();
		this.currentWishMakers.push(data.user.name);
	}

	getCatches(data) {
		let catchData = this.getUserCatchData(data.user.name, data.user.displayName);
		return {
			success:   true,
			variables: this.variableValuesFromCatchData(catchData),
		};
	}
	
	listShinyCatchers(data) {
		let shinyCatchers = Object.keys(this.data.catches)
			.filter(name => this.data.catches[name].shinyCatches > 0)
			.map(name => ({ name: this.getDisplayName(name), count: this.data.catches[name].shinyCatches }));
		if (shinyCatchers.length === 0) {
			this.tell(data.user, "Aww, nobody has caught a shiny Yecats yet. =(");
			return;
		}
		
		let parts = Utils.splitIntoTwitchMessages(
			SHINY_CATCHERS_MESSAGE_PREFIX,
			Utils.arrayMapGenerator(
				shinyCatchers,
				(i) => `${shinyCatchers[i].name}: ${shinyCatchers[i].count}`));
		
		parts.forEach(part => this.say(part));
	}
	
	showYarn(data) {
		if (Utils.isNonEmptyString(data.firstParam)) {
			let username = data.firstParam.toLowerCase();
			if (username in this.data.catches) {
				let catchData = this.data.catches[username];
				this.print(`Current yarn for ${this.getDisplayName(username)}: ${catchData.yarn}`);
			} else {
				this.print(`There is no yarn data for the username "${username}".`)
			}
		} else {
			let playerUserNames = [...Object.keys(this.data.catches)].sort();
			let numPlayers = playerUserNames.length;
			let maxPlayerNumLength = Math.log(numPlayers) * Math.LOG10E + 1 | 0;
			this.print(`Current yarn data for all ${numPlayers} Pokyecats players:`)
			let currPlayerNum = 1;
			playerUserNames.forEach(username => {
				let catchData = this.data.catches[username];
				let number = `${currPlayerNum.toString().padStart(maxPlayerNumLength)}. `;
				let name = `${this.getDisplayName(username)}: `;
				let yarn = `${catchData.yarn} yarn, `;
				let stardustYarn = `${catchData.stardustYarn} stardust yarn, `;
				let yarnBalls = `${catchData.balls[BALLS.YARN]} yarn balls, `;
				let goldBalls = `${catchData.balls[BALLS.GOLD]} gold balls, `;
				let darkBalls = `${catchData.balls[BALLS.DARK]} dark balls, `;
				let rainbowBalls = `${catchData.balls[BALLS.RAINBOW]} pretty balls, `;
				let catches = `${this.getNormalCatches(catchData)} normal catches, `;
				let sepiaCatches = `${catchData.extraCatches.sepia} sepia catches, and `;
				let shiny = `${catchData.shinyCatches} shiny catches.`;
				let all = number + name + yarn + stardustYarn + yarnBalls + goldBalls + darkBalls + rainbowBalls + catches + sepiaCatches + shiny;
				this.print(all);
				currPlayerNum++;
			});
		}
	}

	_getCatchCount(catchData, type) {
		switch (type) {
			case CATCH_TYPES.normal:
				return this.getNormalCatches(catchData);
			case CATCH_TYPES.sepia:
				return catchData.extraCatches.sepia;
			case CATCH_TYPES.galaxy:
				return catchData.extraCatches.galaxy;
			case CATCH_TYPES.shiny:
				return catchData.shinyCatches;
			case CATCH_TYPES.all:
				return catchData.catches;
			default:
				return 0;
		}
	}

	_getCatchSummary(catchData, type) {
		let count = this._getCatchCount(catchData, type);
		if (count === 0) return null;

		if (type === "all") {
			let normalCatches = `${this.getNormalCatches(catchData)} normal catches, `;
			let sepiaCatches = `${catchData.extraCatches.sepia} sepia catches, `;
			let galaxyCatches = `${catchData.extraCatches.sepia} galaxy catches and `;
			let shinyCatches = `${catchData.shinyCatches} shiny catches`;
			return normalCatches + sepiaCatches + galaxyCatches + shinyCatches;
		}

		return `${count} ${type} catches`;
	}

	showCatches(data) {
		let playerUserNames = [...Object.keys(this.data.catches)].sort();
		let numPlayers = playerUserNames.length;
		let maxPlayerNumLength = Math.log(numPlayers) * Math.LOG10E + 1 | 0;
		this.print("Requested current nonzero catches data for all Pokyecats players:");
		let currPlayerNum = 1;
		playerUserNames.forEach(username => {
			let catchData = this.data.catches[username];
			let number = `${currPlayerNum.toString().padStart(maxPlayerNumLength)}. `;
			let name = `${this.getDisplayName(username)}: `;

			let selection = data.firstParam || CATCH_TYPES.all;
			if (!(selection in CATCH_TYPES)) selection = CATCH_TYPES.all;
			let catchSummary = this._getCatchSummary(catchData, selection);
			if (catchSummary) {
				this.print(number + name + this._getCatchSummary(catchData, selection));
				currPlayerNum++;
			}
		})
	}

	addBallCountString(targetArray, catchData, ballName, ballTitle) {
		let count = catchData.balls[ballName];
		if (count > 0) {
			targetArray.push(`${count} ${Utils.plurality(count, `${ballTitle} ball`)}`)
		}
	}

	showUserInventory(data) {
		if (data.user.name in this.data.catches) {
			let catchData = this.data.catches[data.user.name];
			let contents = [];
			contents.push(`${catchData.yarn} yarn`);
			if (catchData.stardustYarn > 0) {
				contents.push(`${catchData.stardustYarn} stardust yarn`);
			}

			this.addBallCountString(contents, catchData, BALLS.YARN, "yarn");
			this.addBallCountString(contents, catchData, BALLS.GOLD, "gold");
			this.addBallCountString(contents, catchData, BALLS.DARK, "dark");
			this.addBallCountString(contents, catchData, BALLS.RAINBOW, "pretty");
			this.addBallCountString(contents, catchData, BALLS.STAR, "star");
			this.tell(data.user, `You currently have ${Utils.makeEnglishAndList(contents)}.`);
		} else {
			this.tell(data.user, "Sorry, you don't have any yarn yet. Try catching Pokyecats to get some!");
		}
	}

	addYarn(username, displayName, amount, save = false) {
		let catchData = this.getUserCatchData(username, displayName);
		catchData.yarn += amount;
		if (save) {
			this.saveData();
		}
	}

	addBall(username, displayName, ballName, amount, save = false) {
		let catchData = this.getUserCatchData(username, displayName);
		catchData.balls[ballName] += amount;
		if (save) {
			this.saveData();
		}
	}

	addCatches(username, displayName, amount, save = false) {
		let catchData = this.getUserCatchData(username, displayName);
		catchData.catches += amount;
		if (save) {
			this.saveData();
		}
	}

	addShinyCatches(username, displayName, amount, save = false) {
		let catchData = this.getUserCatchData(username, displayName);
		catchData.shinyCatches += amount;
		if (save) {
			this.saveData();
		}
	}


	functions = {
		sellSoul: {
			name: 'Try Catch',
			description: 'Try catching Yecats',
			triggers: [
				this.trigger.command({
					cmdname: 'pokyecats',
				}),
			],
			action: data => this.tryCatch(data),
		},
		
		getCatches: {
			name: 'Get Catches',
			description: 'Give a report of the Yecatses caught so far',
			action: () => this.getCatches(),
		},
		
		listShinyCatchers: {
			name: 'List Shiny Catchers',
			description: "Send a list to the chat of everyone who's caught a shiny Yecats",
			triggers: [
				this.trigger.command({
					cmdname: 'shinyecats',
				}),
			],
			action: (data) => this.listShinyCatchers(data),
		},
		
		showYarn: {
			name: 'Show Yarn',
			description: "Shows current yarn amount for the given user, or for everyone if no user is specified.",
			triggers: [
				this.trigger.cli({
					cmdname: 'yarn',
				}),
			],
			action: (data) => this.showYarn(data),
		},

		showCatches: {
			name: 'Show Catches',
			description: "Shows current non-zero catches for all users, of a specific type (normal / shiny / sepia / all), or all if not specified.",
			triggers: [
				this.trigger.cli({
					cmdname: 'catches',
				}),
			],
			action: (data) => this.showCatches(data),
		},

		showUserInventory: {
			name: 'Show User Inventory',
			description: "Shows what the user currently owns (yarn and balls)",
			triggers: [
				this.trigger.command({
					cmdname: 'yarn',
				}),
			],
			action: (data) => this.showUserInventory(data),
		},

		wish: {
			name: 'Wish',
			description: "Makes a wish upon a star (if one is present)",
			triggers: [
				this.trigger.command({
					cmdname: 'wish',
				}),
			],
			action: (data) => this.wish(data),
		},
	}
}

module.exports = new Pokyecats();
