const FETCH_USERS_URL = 'https://tmi.twitch.tv/group/user/fluxistence/chatters';
const GLOW_SIZE = 15;
const GLOW_COLOR = '#ffffcc';

// Assumes Math.floor(max) >= Math.ceil(min)
function randomInt(min, max) {
	return min + Math.floor(Math.random() * (max - min + 1));
}

// Returns +/- 1 randomly (no zeros though)
function randomSign() {
	return randomInt(0, 1) * 2 - 1;
}

// Gets a list of all the keys that are in obj1 and not in obj2
function getSubKeys(obj1, obj2) {
	var k1 = Object.keys(obj1);
	return k1.filter(function(x) {
		return obj2[x] === undefined;
	});
}


class HypeLevel {
	static get CONTAINER_NAME() { return 'hypeContainer'; }
	static get FADE_DURATION()	{ return 500; }
	
	constructor(source) {
		this.source = source;
		this.background = null;
	}
	
	activate() {
		this.background.fadeIn(HypeLevel.FADE_DURATION);
	}
	
	deactivate() {
		this.background.fadeOut(HypeLevel.FADE_DURATION);
	}
}

class VideoHypeLevel extends HypeLevel {
	static get CONTAINER_NAME() { return 'videoHypeContainer'; }
	
	constructor(source, soundManager) {
		super(source, soundManager);
		this.background = 
			$(`<video src="${source}"></video>`)
			.hide()
			.appendTo(`#${VideoHypeLevel.CONTAINER_NAME}`);
	}
}

class ImageHypeLevel extends HypeLevel {
	static get CONTAINER_NAME() { return 'imageHypeContainer'; }
	
	constructor(source, soundManager) {
		super(source, soundManager);
		this.background = 
			$(`<img src="${source}" class="fullscreen"></img>`)
			.hide()
			.appendTo(`#${ImageHypeLevel.CONTAINER_NAME}`);
	}
}

class HypeManager {
	static get FADE_DURATION()	{ return 500; }
	
	// 'levels' should be an array, with indices indicating hype
	// levels (i.e. at index 0 is hype level 1, at index 3 it's level 4)
	// 
	// mainView should contain the name of the HTML element which should
	// be shown/hidden on hype start/end respectively
	constructor(hypeData, soundManager, mainView) {
		this.levels = hypeData.levels;
		this.soundName = hypeData.music;
		this.soundManager = soundManager;
		this.currentLevel = 0;
		this.mainView = mainView;
	}
	
	_hypeStart() {
		if (this.soundName) {
			this.soundManager.play(this.soundName);
		}
		
		if (this.mainView) {
			$(`#${this.mainView}`).fadeIn(HypeManager.FADE_DURATION);
		}
	}
	
	_hypeEnd() {
		if (this.soundName) {
			// this.soundManager.stop(
			// 	this.soundName);
			this.soundManager.fadeOutAndStop(
				HypeManager.FADE_DURATION,
				this.soundName);
		}
		
		if (this.mainView) {
			$(`#${this.mainView}`).fadeOut(HypeManager.FADE_DURATION);
		}
	}
	
	_getLevel(level) {
		// Levels are 1-based while the array is 0-based
		// That is, level 1 represents this.levels[0] (level 0 means off)
		return this.levels[level - 1];
	}
	
	activateLevel(level) {
		console.log(`Activating level ${level}`);
		if (level < 0 || level > this.levels.length) {
			console.warn(`Invalid hype level: ${level}`);
			return;
		}
		
		if (this.currentLevel == level) {
			console.warn('Asked to activate already active level, ignoring request');
			return;
		}
		
		if (this.currentLevel > 0) {
			this._getLevel(this.currentLevel).deactivate();
		}
		
		if (level > 0) {
			this._getLevel(level).activate();
		}
		
		if (this.currentLevel == 0) {
			// Currently at 0, now rising
			this._hypeStart();
		} else if (level == 0) {
			// Currently above 0, now dropping to 0
			// No need to activate any level then
			this._hypeEnd();
		}
		
		this.currentLevel = level;
	}
	
	increment() {
		if (this.currentLevel >= this.levels.length) {
			console.warn('Already at max hype level');
			return;
		}
		
		this.activateLevel(this.currentLevel + 1);
	}
	
	decrement() {
		if (this.currentLevel == 0) {
			console.warn('Already at min hype level (i.e. 0)');
			return;
		}
		
		this.activateLevel(this.currentLevel - 1);
	}
	
	start() {
		this.activateLevel(1);
	}
	
	stop() {
		this.activateLevel(0);
	}
}



class ChannelParty extends EffectClient {
	static get IMAGE_SIZE()		{ return 300; }
	static get VELOCITY_MIN()	{ return 200; }
	static get VELOCITY_MAX()	{ return 800; }
	static get FADE_DURATION()	{ return 500; }
	static get MAIN_VIEW_ID()	{ return 'gameContainer'; }
	
	
	constructor(soundData, hypeData) {
		super('Channel Party');
		
		this.existingUserFiles = {};
		this.currentUserImages = {};
		this.currentUsersInChat = {};
		this.running = false;
		this.showAll = false;
		this.imagesLoadad = false;
		this.userlistLoadad = false;
		this.allReady = false;
		this.socket = null;
		this.game = null;
		this.scene = null;
		
		this.sounds.loadSounds(soundData);
		
		this.hypeManager = new HypeManager(
			hypeData,
			this.sounds,
			ChannelParty.MAIN_VIEW_ID);
		$(`#${ChannelParty.MAIN_VIEW_ID}`).hide();
	}
	
	startPhaser() {
		let _this = this;
		
		var config = {
			type: Phaser.AUTO,
			transparent: true,
			physics: {
				default: 'arcade'
			},
			parent: 'gameContainer',
			width: 1920,
			height: 1080,
			scene: {
				preload: function() {
					_this.preload(this);
				},
				create: function() {
					_this.create(this);
				},
			}
		};
		
		this.game = new Phaser.Game(config);
	}
	
	preload(scene) {
		this.scene = scene;
		
		scene.load.on('filecomplete', (key, type, data) => this.markAsLoaded(key));
		scene.load.on('loaderror', this.errorLoading);
	}
	
	randomVelocity() {
		return randomSign() *
			randomInt(ChannelParty.VELOCITY_MIN, ChannelParty.VELOCITY_MAX);
	}
	
	updateAllReady() {
		// This is to make sure we don't mark ourselves as ready more than once
		if (this.allReady) {
			return;
		}
		
		this.allReady = this.imagesLoadad && this.userlistLoadad;
		if (this.allReady) {
			this.processInitialUsers();
			
			this.server.on('userJoined', username => {
				console.log(`User joined: ${username}; present = ${username in this.currentUserImages}`);
				let hasImage = username in this.existingUserFiles;
				this.currentUsersInChat[username] = hasImage;
				if ((username in this.currentUserImages) || !hasImage) {
					return;
				}
				
				this.currentUserImages[username] = this.addImage(username);
			});
			
			this.server.on('userLeft', username => {
				console.log(`User left: ${username}; present = ${username in this.currentUserImages}`);
				if (!(username in this.currentUsersInChat)) {
					return;
				}
				
				delete this.currentUsersInChat[username];
				
				if (!(username in this.currentUserImages)) {
					return;
				}
				
				let image = this.currentUserImages[username];
				this.scene.tweens.add({
					targets: image,
					alpha: 0,
					duration: ChannelParty.FADE_DURATION,
					onComplete: () => {
						image.destroy();
					},
				});
				
				delete this.currentUserImages[username];
			});
		}
	}
	
	markUserlistLoaded() {
		this.userlistLoadad = true;
		this.updateAllReady();
	}

	markImagesLoaded() {
		this.imagesLoadad = true;
		this.updateAllReady();
	}

	markAsLoaded(username) {
		if (!(username in this.existingUserFiles)) {
			return;
		}
		
		this.existingUserFiles[username].loaded = true;
		if (Object.values(this.existingUserFiles).reduce(
			(soFar, currentUser) => soFar && currentUser.loaded, true)) {
				this.markImagesLoaded();
		}
	}

	errorLoading(file) {
		console.error(`Could not load file: ${file}`);
	}
	
	loadUserImages() {
		Object.keys(this.existingUserFiles).forEach(username => {
			this.scene.load.image(username, this.existingUserFiles[username].url);
		});
		
		this.scene.load.start();
	}

	create()
	{
		// TODO: Make the game scale with the window
		
		// game.scale.scaleMode = Phaser.Scale.ScaleManager.RESIZE;
		// game.scale.parentIsWindow = true;
		
		// game.physics.startSystem(Phaser.Physics.ARCADE);
		// game.physics.enable(image, Phaser.Physics.ARCADE);
		
		this.scene.physics.world.setBoundsCollision(true, true, true, true);
	}

	userFileExists(username) {
		return username in this.existingUserFiles;
	}

	addImage(username) {
		let xpos = randomInt(ChannelParty.IMAGE_SIZE / 2, 1920 - ChannelParty.IMAGE_SIZE / 2);
		let ypos = randomInt(ChannelParty.IMAGE_SIZE / 2, 1080 - ChannelParty.IMAGE_SIZE / 2);
		// let xpos = randomInt(IMAGE_SIZE / 2, game.scale.displaySize.width - IMAGE_SIZE / 2);
		// let ypos = randomInt(IMAGE_SIZE / 2, game.scale.displaySize.height - IMAGE_SIZE / 2);
		
		let image = this.scene.physics.add.image(xpos, ypos, username);
		image.displayWidth = ChannelParty.IMAGE_SIZE;
		image.scaleY = image.scaleX;
		
		if (image.texture.key == "__MISSING") {
			console.log(`Image missing for ${username}`);
		}
		
		image.body.velocity.setTo(this.randomVelocity(), this.randomVelocity());
		image.body.collideWorldBounds = true;
		image.body.bounce.set(1);
		
		image.alpha = 0;
		this.scene.tweens.add({
			targets: image,
			alpha: 1,
			duration: ChannelParty.FADE_DURATION,
		});
		
		return image;
	}
	
	processInitialUsers() {
		Object.keys(this.currentUsersInChat).forEach(username => {
			let hasImage = username in this.existingUserFiles;
			this.currentUsersInChat[username] = hasImage;
			if (hasImage) {
				this.currentUserImages[username] = this.addImage(username);
			}
		});
	}
	
	updateUserImages(newUsers) {
		let newUsernames = {};
		let newUserImages = {};
		
		newUsers.forEach(username => {
			if (this.userFileExists(username)) {
				newUsernames[username] = this.existingUserFiles[username].url;
			}
		});
		
		if (showAll) {
			Object.keys(this.existingUserFiles).forEach(user => {
				newUsernames[user] = this.existingUserFiles[user].url;
			});
		}
		
		let usersToRemove = getSubKeys(this.currentUserImages, newUsernames);
		let usersToAdd = getSubKeys(newUsernames, this.currentUserImages);
		
		usersToRemove.forEach(username => {
			let image = this.currentUserImages[username];
			scene.tweens.add({
				targets: image,
				alpha: 0,
				duration: ChannelParty.FADE_DURATION,
				onComplete: () => {
					image.destroy();
				},
			});
			
			delete this.currentUserImages[username];
		});
		
		usersToAdd.forEach(username => {
			this.currentUserImages[username] = this.addImage(username);
		});
	}

	fetchCurrentUserlist() {
		let _this = this;
		$.ajax({
			url: FETCH_USERS_URL,
			dataType: "jsonp",
			success: function( response ) {
				let newUsers = [];
				Object.values(response.data.chatters).forEach(
					groupUsers => newUsers.push(...groupUsers));
				newUsers.forEach(username => {
					_this.currentUsersInChat[username] = null;
				});
				
				_this.markUserlistLoaded();
				// this.updateUserImages(newUsers);
			}
		});
	}
	
	// Start all the network stuff
	startNetwork() {
		// this.socket = io();
		
		this.server.on('userImageList', userList => {
			Object.keys(userList).forEach(user => {
				this.existingUserFiles[user] = {
					url: userList[user],
					loaded: false,
				};
			});
			
			this.loadUserImages();
		});
		
		this.server.attach();
		// this.server.emit('attachTo', 'Channel Party');
		
		this.server.on('hide', () => {
			$('#gameContainer').fadeOut(ChannelParty.FADE_DURATION);
		});
		
		this.server.on('show', () => {
			$('#gameContainer').fadeIn(ChannelParty.FADE_DURATION);
		});
		
		this.server.on('hype', level => {
			if (level === undefined || level === null) {
				this.hypeManager.increment();
			} else {
				this.hypeManager.activateLevel(level);
			}
		});
		
		this.server.on('epyh', () => {
			this.hypeManager.decrement();
		});
		
		this.server.on('endHype', () => {
			this.hypeManager.stop();
		});
		
		this.server.emit('getUserImageList');
	}
	
	start() {
		this.startPhaser();
		this.fetchCurrentUserlist();
		this.startNetwork();
	}
}

const SOUNDS = {
	'hypemusic': 'HypeMusic.mp3',
};

const HYPE_DATA = {
	music: 'hypemusic',
	levels: [
		new ImageHypeLevel('Sonic.jpg'),
		new ImageHypeLevel('Mario.jpg'),
		new ImageHypeLevel('Portal.jpg'),
	],
};

var cp = new ChannelParty(SOUNDS, HYPE_DATA);
cp.start();

// TODO: Remove
console.log(cp);
