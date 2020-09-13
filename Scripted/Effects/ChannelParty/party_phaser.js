const FETCH_USERS_URL = 'https://tmi.twitch.tv/group/user/fluxistence/chatters';
const GLOW_SIZE = 15;
const GLOW_COLOR = '#ffffcc';

var showAllImages = false;

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
	
	constructor(source, sound) {
		this.source = source;
		this.sound = sound;
		this.background = null;
	}
	
	activate(soundManager) {
		this.background.fadeIn(HypeLevel.FADE_DURATION);
		if (this.sound) {
			soundManager.fadeIn(HypeLevel.FADE_DURATION, this.sound)
		}
	}
	
	deactivate(soundManager) {
		this.background.fadeOut(HypeLevel.FADE_DURATION);
		if (this.sound) {
			soundManager.fadeOut(HypeLevel.FADE_DURATION, this.sound)
		}
	}
}

class VideoHypeLevel extends HypeLevel {
	static get CONTAINER_NAME() { return 'videoHypeContainer'; }
	
	constructor(source, sound) {
		super(source, sound);
		this.background = 
			$(`<video src="${source}"></video>`)
			.hide()
			.appendTo(`#${VideoHypeLevel.CONTAINER_NAME}`);
	}
}

class ImageHypeLevel extends HypeLevel {
	static get CONTAINER_NAME() { return 'imageHypeContainer'; }
	
	constructor(source, sound) {
		super(source, sound);
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
		this.levels = hypeData.levels.map(levelData => levelData.level);
		this.soundName = hypeData.music;
		this.soundManager = soundManager;
		this.currentLevel = 0;
		this.mainView = mainView;
		
		this._onLevelActivatedCallbacks = [];
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
		// Fade out and stop ALL music
		this.soundManager.fadeOutAndStop(
			HypeManager.FADE_DURATION);
		
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
		
		let prevLevel = this.currentLevel;
		
		if (prevLevel == level) {
			console.warn('Asked to activate already active level, ignoring request');
			return;
		}
		
		this.currentLevel = level;
		
		if (prevLevel > 0) {
			this._getLevel(prevLevel).deactivate(this.soundManager);
		}
		
		if (level > 0) {
			this._getLevel(level).activate(this.soundManager);
			this._levelActivated(level);
		}
		
		if (prevLevel == 0) {
			// Currently at 0, now rising
			this._hypeStart();
		} else if (level == 0) {
			// Currently above 0, now dropping to 0
			// No need to activate any level then
			this._hypeEnd();
		}
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
	
	onLevelActivated(callback) {
		this._onLevelActivatedCallbacks.push(callback);
	}
	
	_levelActivated(level) {
		this._onLevelActivatedCallbacks.forEach(callback => callback(level));
	}
}



class ChannelParty extends EffectClient {
	static get IMAGE_SIZE()					{ return 300; }
	static get VELOCITY_MIN()				{ return 200; }
	static get VELOCITY_MAX()				{ return 800; }
	static get FADE_DURATION()				{ return 500; }
	static get MAIN_VIEW_ID()				{ return 'gameContainer'; }
	static get HYPE_VELOCITY_INCREMENT()	{ return 500; }
	
	
	constructor(soundData, hypeData) {
		super('Channel Party');
		
		this.existingUserFiles = {};
		this.currentUserImages = {};
		this.currentUsersInChat = {};
		this.running = false;
		this.imagesLoadad = false;
		this.userlistLoadad = false;
		this.sceneReady = false;
		this.allReady = false;
		this.socket = null;
		this.game = null;
		this.scene = null;
		this.useParticles = true;
		this.particles = null;
		
		this.sounds.loadSounds(soundData, true);
		
		this.hypeData = hypeData;
		this.hypeManager = new HypeManager(
			hypeData,
			this.sounds,
			ChannelParty.MAIN_VIEW_ID);
		this.hypeManager.onLevelActivated(level => this.hypeLevelActivated(level));
		
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
		scene.load.atlas(
			'flares',
			'assets/flares.png',
			'assets/flares.json');
		
		for (let i = 0; i < this.hypeData.levels.length; i++) {
			if (this.hypeData.levels[i].particles) {
				scene.load.image(`particles_${i}`,
					this.hypeData.levels[i].particles);
			}
		}
	}
	
	create(scene)
	{
		// TODO: Make the game scale with the window
		
		// game.scale.scaleMode = Phaser.Scale.ScaleManager.RESIZE;
		// game.scale.parentIsWindow = true;
		
		// game.physics.startSystem(Phaser.Physics.ARCADE);
		// game.physics.enable(image, Phaser.Physics.ARCADE);
		
		scene.physics.world.setBoundsCollision(true, true, true, true);
		this.particles = scene.add.particles('flares');
		
		// Level 0 has no particles, hence its value is null
		this.levelParticles = [null];
		for (let i = 0; i < this.hypeData.levels.length; i++) {
			if (this.hypeData.levels[i].particles) {
				this.levelParticles.push(scene.add.particles(`particles_${i}`));
			} else {
				this.levelParticles.push(null);
			}
		}
		
		this.markSceneReady();
	}
	
	randomVelocity() {
		return randomSign() *
			randomInt(ChannelParty.VELOCITY_MIN, ChannelParty.VELOCITY_MAX);
	}
	
	addUser(username) {
		let hasImage = username in this.existingUserFiles;
		this.currentUsersInChat[username] = hasImage;
		if ((username in this.currentUserImages) || !hasImage) {
			return;
		}
		
		this.currentUserImages[username] = this.addImage(username);
	}
	
	addLevelParticles(username, level) {
		let particles = this.levelParticles[level];
		if (particles) {
			let image = this.currentUserImages[username];
			image.emitter = particles.createEmitter({
				speed: 100,
				gravity: { x: 0, y: 200 },
				scale: { start: 0.1, end: 0.2 },
				follow: image,
				rotate: { start: 0, end: 360 },
			});
		}
	}
	
	removeEmitter(username) {
		let image = this.currentUserImages[username];
		if (image.emitter) {
			image.emitter.on = false;
			this.scene.time.delayedCall(
				image.emitter.lifespan.propertyValue,
				() => this.particles.emitters.remove(image.emitter));
		}
	}
	
	removeUser(username) {
		if (!(username in this.currentUsersInChat)) {
			return;
		}
		
		delete this.currentUsersInChat[username];
		
		if (!(username in this.currentUserImages)) {
			return;
		}
		
		this.removeEmitter(username);
		
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
	}
	
	updateAllReady() {
		// This is to make sure we don't mark ourselves as ready more than once
		if (this.allReady) {
			return;
		}
		
		this.allReady =
			this.sceneReady &&
			this.imagesLoadad &&
			this.userlistLoadad;
		
		if (this.allReady) {
			if (showAllImages) {
				this.addAllExistingUserImages();
			} else {
				this.processInitialUsers();
			}
			
			this.server.on('userJoined', username => this.addUser(username));
			this.server.on('userLeft', username => this.removeUser(username));
		}
	}
	
	markSceneReady() {
		this.sceneReady = true;
		this.updateAllReady();
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

	userFileExists(username) {
		return username in this.existingUserFiles;
	}
	
	hypeLevelVeolicty(level, image, axis) {
		let sign = Math.sign(image.body.velocity[axis]);
		let absoluteBaseSpeed = Math.abs(image.baseVelocity[axis]);
		let speed = absoluteBaseSpeed + 
			ChannelParty.HYPE_VELOCITY_INCREMENT * (level - 1);
		let finalVelocity = sign * speed;
		
		return finalVelocity;
	}
	
	hypeLevelActivated(level) {
		// Remvoe and add emitters as necessary
		Object.keys(this.currentUserImages).forEach(username => {
			this.removeEmitter(username);
			this.addLevelParticles(username, level);
		});
		
		// The images should move at base speed when hype is off,
		// so 0 should be treated the same as 1 for the purposes
		// of valocity calculations
		let speedLevel = level;
		if (speedLevel == 0) {
			speedLevel = 1;
		}
		
		Object.values(this.currentUserImages).forEach(image => {
			image.body.velocity.setTo(
				this.hypeLevelVeolicty(speedLevel, image, 'x'),
				this.hypeLevelVeolicty(speedLevel, image, 'y'));
		});
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
		
		let velocity = {
			x: this.randomVelocity(),
			y: this.randomVelocity(),
		};
		
		image.body.velocity.setTo(velocity.x, velocity.y);
		image.baseVelocity = velocity; // Saved for changing by hype level later
		image.body.collideWorldBounds = true;
		image.body.bounce.set(1);
		image.alpha = 0;
		
		
		if (this.useParticles) {
			// // Add a particle emitter and attach it to the image (also save
			// // a reference to it inside the image object for convenience)
			// image.emitter = this.particles.createEmitter({
			// 	frame: 'white',
			// 	tint: [
			// 		0xff0000,	// Red
			// 		0xff7f00,	// Orange
			// 		0xffff00,	// Yellow
			// 		0x00ff00,	// Green
			// 		0x0000ff,	// Blue
			// 		0xff7f00,	// Indigo
			// 		0x8b00ff,	// Violet
			// 	],
			// 	speed: 100,
			// 	gravity: { x: 0, y: 200 },
			// 	scale: { start: 0.1, end: 0.4 },
			// 	follow: image,
			// });
			
			this.addLevelParticles(username, this.hypeManager.currentLevel);
		}
		
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
	
	// Should only be called manuall or automatically on load when
	// the test flag 'showAllImages' is set
	addAllExistingUserImages() {
		Object.keys(this.existingUserFiles).forEach(username => {
			let alreadyLoaded = username in this.currentUserImages;
			if (!alreadyLoaded) {
				this.currentUsersInChat[username] = true;
				this.currentUserImages[username] = this.addImage(username);
			}
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
	
	showFinalVideo() {
		let vid = $('#finalVideo');
		vid.show().get(0).play();
		this.sounds.mute();
		this.hypeManager.stop();
		let fadeStartTime = Math.max(0,
			vid.get(0).duration * 1000 - ChannelParty.FADE_DURATION);
		this.scene.time.delayedCall(
			fadeStartTime,
			() => vid.fadeOut(ChannelParty.FADE_DURATION));
	}
	
	processFinalVideo() {
		
		$('#finalVideo').on('ended', () => this.sounds.unmute());
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
		
		this.server.on('finish', () => {
			this.showFinalVideo();
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
	'sonic': {
		location: 'assets/Sonic/Sonic.mp3',
		loop: true,
	},
	'mario': {
		location: 'assets/Mario/MarioStarSequence.mp3',
		loop: true,
	},
	'mk': {
		location: 'assets/MK/MK.mp3',
		loop: true,
	},
	'pokemon': {
		location: 'assets/Pokemon/Theme.mp3',
		loop: true,
	},
	'zelda': {
		location: 'assets/Zelda/Zelda.mp3',
		loop: true,
	},
};

const HYPE_DATA = {
	levels: [
		{
			particles: 'assets/Sonic/Ring-Small.png',
			level: new ImageHypeLevel('assets/Sonic/Sonic.jpg', 'sonic'),
		},
		{
			particles: 'assets/Zelda/RealSword.png',
			level: new ImageHypeLevel('assets/Zelda/Zelda-Large.jpg', 'zelda'),
		},
		{
			particles: 'assets/Pokemon/Ball.png',
			level: new ImageHypeLevel('assets/Pokemon/Scratch_III.png', 'pokemon'),
		},
		{
			particles: 'assets/Mario/Star.png',
			level: new ImageHypeLevel('assets/Mario/Mario1.jpg', 'mario'),
		},
		{
			particles: 'assets/MK/blood-drop.png',
			level: new ImageHypeLevel('assets/MK/MK_arcade.jpg', 'mk'),
		},
	],
};

const FINAL_VIDEO = 'assets/FinishVideo/FinishVideo.mp4';

var cp = new ChannelParty(SOUNDS, HYPE_DATA, FINAL_VIDEO);
cp.start();

function showAll() {
	cp.addAllExistingUserImages();
}






function css(a) {
    var sheets = document.styleSheets, o = {};
    for (var i in sheets) {
        var rules = sheets[i].rules || sheets[i].cssRules;
        for (var r in rules) {
            if (a.is(rules[r].selectorText)) {
                o = $.extend(o, css2json(rules[r].style), css2json(a.attr('style')));
            }
        }
    }
    return o;
}

function css2json(css) {
    var s = {};
    if (!css) return s;
    if (css instanceof CSSStyleDeclaration) {
        for (var i in css) {
            if ((css[i]).toLowerCase) {
                s[(css[i]).toLowerCase()] = (css[css[i]]);
            }
        }
    } else if (typeof css == "string") {
        css = css.split("; ");
        for (var i in css) {
            var l = css[i].split(": ");
            s[l[0].toLowerCase()] = (l[1]);
        }
    }
    return s;
}
