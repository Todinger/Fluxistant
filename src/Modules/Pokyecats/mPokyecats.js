const Module = requireMain('module');
const Utils = requireMain('utils');

const PLACEHOLDERS = {
	USER: '$user',
	CATCHES: '$caught',
	NORMALS: '$normals',
	SHINIES: '$shinies',
	BALLS: {
		YARN: '$yarnballs',
		GOLD: '$goldballs',
		RAINBOW: '$prettyballs',
	},
	YARN: '$numyarn',
};

const BALLS = {
	NORMAL: 'normal',
	YARN: 'yarnball',
	GOLD: 'goldball',
	RAINBOW: 'prettyball',
}

const NORMAL_BALL = {
	name: BALLS.NORMAL,
	catchMultiplier: 1,
	shinyMultiplier: 1,
}

const SHINY_CATCHERS_MESSAGE_PREFIX = "✨ You gotta be kitten me! Look who caught a rare shiny Yecats! ✨ ";
const CATCH_VARIABLE_HITS = '$user = user name, $caught = total, $normals = normal catches, $shinies = shiny catches, ' +
	'$yarnballs = yarn balls, $goldballs = gold balls, $prettyballs = pretty (rainbow) balls, $numyarn = current yarn';

// Amount of yarn a user gets for each catch attempt
const YARN_PER_THROW = 1;

class Pokyecats extends Module {
	constructor() {
		super({
			name: 'Pokyecats',
			tags: ['imgdisp'],
			description: 'Yecats! Yecats! Iioooooioooioiiiooo...',
		});
		
		this.data.catches = {};
		this.catchChance = 0;
		this.shinyChance = 0;
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
		this.catchChance = conf.catchChance / 100;
		this.shinyChance = conf.shinyChance / 100;
	}
	
	persistentDataLoaded() {
		Object.keys(this.data.catches).forEach(user => {
			if (this.data.catches[user].balls === undefined) {
				this.data.catches[user].balls = this.newBallData();
			}
			if (this.data.catches[user].yarn === undefined) {
				this.data.catches[user].yarn = 0;
			}
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
		};
	}
	
	newCatchData() {
		return {
			catches: 0,
			shinyCatches: 0,
			displayName: '',
			balls: this.newBallData(),
			yarn: 0,
		};
	}
	
	getUserCatchData(user) {
		return this.data.catches[user.name] || this.newCatchData();
	}
	
	variableValuesFromCatchData(catchData) {
		return {
			catches: catchData.catches,
			shinyCatches: catchData.shinyCatches,
			normalCatches: catchData.catches - catchData.shinyCatches,
			yarnballs: catchData.balls[BALLS.YARN],
			goldballs: catchData.balls[BALLS.GOLD],
			prettyballs: catchData.balls[BALLS.RAINBOW],
		};
	}
	
	tellMessage(user, message, catchData) {
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.USER, this.getDisplayName(user.name));
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.CATCHES, catchData.catches);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.SHINIES, catchData.shinyCatches);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.NORMALS, catchData.catches - catchData.shinyCatches);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.BALLS.YARN, catchData.balls[BALLS.YARN]);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.BALLS.GOLD, catchData.balls[BALLS.GOLD]);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.BALLS.RAINBOW, catchData.balls[BALLS.RAINBOW]);
		message = Utils.stringReplaceAll(message, PLACEHOLDERS.YARN, catchData.yarn);
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
			catchMultiplier: config.catchMultiplier,
			shinyMultiplier: config.shinyMultiplier,
		};
	}
	
	saveCatchData(user, catchData) {
		this.data.catches[user.name] = catchData;
		this.data.catches[user.name].displayName = user.displayName;
	}
	
	tryCatch(data) {
		let catchData = this.getUserCatchData(data.user);
		
		let ball = this.getBall(data);
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
		
		let shinyChance = this.shinyChance * ball.shinyMultiplier;
		let shiny = Math.random() < shinyChance;
		if (shiny) {
			catchData.shinyCatches++;
			this.tellMessage(data.user, this.config.shinyCatchMessage, catchData);
		} else if (catchData.shinyCatches > 0) {
			this.tellMessage(data.user, this.config.normalCatchMessageWithShinies, catchData);
		} else {
			this.tellMessage(data.user, this.config.normalCatchMessage, catchData);
		}
		
		this._sendToDisplay(shiny ? this.config.media.shiny : this.config.media.regular);
		
		this.saveCatchData(data.user, catchData);
		
		this.saveData();
		
		return {
			success:   true,
			variables: this.variableValuesFromCatchData(catchData),
		};
	}
	
	getCatches(data) {
		let catchData = this.getUserCatchData(data.user);
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
				this.print(`${currPlayerNum.toString().padStart(maxPlayerNumLength)}. ${this.getDisplayName(username)}: ${catchData.yarn}`);
				currPlayerNum++;
			})
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
	}
}

module.exports = new Pokyecats();
