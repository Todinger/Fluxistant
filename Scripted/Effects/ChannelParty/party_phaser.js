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
		this._onLevelDeactivatedCallbacks = [];
		this._onFullyStoppedCallbacks = [];
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
			$(`#${this.mainView}`).fadeOut(
				HypeManager.FADE_DURATION,
				() => this._fullyStopped());
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
			this._levelDeactivated(level);
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
	
	stop(onFullyStoppedCallback) {
		if (this.currentLevel == 0) {
			if (onFullyStoppedCallback) {
				onFullyStoppedCallback();
			}
		} else {
			if (onFullyStoppedCallback) {
				this._onFullyStoppedCallbacks.push(onFullyStoppedCallback);
			}
			
			this.activateLevel(0);
		}
	}
	
	onLevelActivated(callback) {
		this._onLevelActivatedCallbacks.push(callback);
	}
	
	_levelActivated(level) {
		this._onLevelActivatedCallbacks.forEach(callback => callback(level));
	}
	
	onLevelDeactivated(callback) {
		this._onLevelDeactivatedCallbacks.push(callback);
	}
	
	_levelDeactivated(level) {
		this._onLevelDeactivatedCallbacks.forEach(callback => callback(level));
	}
	
	_fullyStopped(level) {
		this._onFullyStoppedCallbacks.forEach(callback => callback(level));
		this._onFullyStoppedCallbacks = [];
	}
}


class LoopingAnimatedParticle extends Phaser.GameObjects.Particles.Particle {
	constructor(emitter)
	{
		super(emitter);
		
		this.t = 0;
		this.i = 0;
		this.emitter = emitter;
	}
	
	update(delta, step, processors)
	{
		var result = super.update(delta, step, processors);
		
		this.t += delta;
		
		if (this.t >= this.emitter.anim.msPerFrame)
		{
			this.i++;
			
			if (this.i >= this.emitter.anim.frames.length)
			{
				this.i = 0;
			}
			
			this.frame = this.emitter.anim.frames[this.i].frame;
			
			this.t -= this.emitter.anim.msPerFrame;
		}
		
		return result;
	}
}

class SingleAnimatedParticle extends Phaser.GameObjects.Particles.Particle {
	constructor(emitter)
	{
		super(emitter);
		
		this.t = 0;
		this.i = 0;
		this.emitter = emitter;
		this.finished = false;
	}
	
	update(delta, step, processors)
	{
		var result = super.update(delta, step, processors);
		
		if (this.finished) {
			return result;
		}
		
		this.t += delta;
		
		if (this.t >= this.emitter.anim.msPerFrame)
		{
			this.i++;
			
			if (this.i >= this.emitter.anim.frames.length)
			{
				this.finished = true;
			} else {
				this.frame = this.emitter.anim.frames[this.i].frame;
				this.t -= this.emitter.anim.msPerFrame;
			}
		}
		
		return result;
	}
}




class ChannelParty extends EffectClient {
	static get IMAGE_SIZE()					{ return 300; }
	static get VELOCITY_MIN()				{ return 200; }
	static get VELOCITY_MAX()				{ return 800; }
	static get FADE_DURATION()				{ return 500; }
	static get MAIN_VIEW_ID()				{ return 'gameContainer'; }
	static get HYPE_VELOCITY_INCREMENT()	{ return 500; }
	static get PARTICLE_EXPLODE_INTERVAL()	{ return 100; }
	
	
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
		this.hypeManager.onLevelDeactivated(level => this.hypeLevelDeactivated(level));
		
		$(`#${ChannelParty.MAIN_VIEW_ID}`).hide();
	}
	
	startPhaser() {
		let _this = this;
		
		let container = $('#gameContainer');
		
		var config = {
			type: Phaser.AUTO,
			transparent: true,
			physics: {
				default: 'arcade'
			},
			parent: 'gameContainer',
			width: container.innerWidth(),
			height: container.innerHeight(),
			scale: {
				mode: Phaser.Scale.FIT,
				autoCenter: Phaser.Scale.CENTER_BOTH
			},
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
		
		// Use this to make the world bounds move based on the size of the
		// containing element/window while keeping all the sprites the same,
		// full size
		// 
		// $(window).resize(() => {
		// 	console.log(`Resizing to ${container.innerWidth()}x${container.innerHeight()}`);
		// 	// this.scene.scale.resize(container.innerWidth(), container.innerHeight());
		// 	this.scene.physics.world.setBounds(0, 0, container.innerWidth(), container.innerHeight());
		// });
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
				if (this.hypeData.levels[i].particles.animated) {
					scene.load.spritesheet(
						`particles_${i}`,
						this.hypeData.levels[i].particles.source,
						this.hypeData.levels[i].particles.frameConfig);
				} else {
					scene.load.image(
						`particles_${i}`,
						this.hypeData.levels[i].particles.source);
				}
			}
		}
	}
	
	create(scene)
	{
		scene.physics.world.setBoundsCollision(true, true, true, true);
		this.particles = scene.add.particles('flares');
		
		// Level 0 has no particles, hence its value is null
		this.levelParticles = [null];
		for (let i = 0; i < this.hypeData.levels.length; i++) {
			if (this.hypeData.levels[i].particles) {
				let levelParticle = {};
				levelParticle.manager = scene.add.particles(`particles_${i}`);
				levelParticle.data = this.hypeData.levels[i].particles;
				
				if (levelParticle.data.animated) {
					levelParticle.anim = scene.anims.create({
						key: `${i}_${this.hypeData.levels[i].name}_anim`,
						frames: scene.anims.generateFrameNumbers(`particles_${i}`),
						frameRate: levelParticle.data.frameRate,
						repeat: levelParticle.data.looping ? -1 : 1,
					});
				}
				
				this.levelParticles.push(levelParticle);
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
	
	doParticleExplosion(emitter) {
		emitter.explode(30);
		
	}
	
	addLevelParticles(image, level) {
		let lp = this.levelParticles[level];
		if (lp) {
			let scale = (lp.data.scale === undefined) ? 1 : lp.data.scale;
			let emitterConfig = {
				speed: (lp.data.speed === undefined) ? 100 : lp.data.speed,
				gravity: { x: 0, y: 200 },
				scale: { start: 0.1 * scale, end: 0.2 * scale },
				follow: image,
			};
			
			if (lp.data.rotate) {
				emitterConfig.rotate = { start: 0, end: 360 };
			}
			
			if (lp.data.frequency) {
				emitterConfig.frequency = lp.data.frequency;
			}
			
			if (lp.data.animated) {
				if (lp.data.looping) {
					emitterConfig.particleClass = LoopingAnimatedParticle;
				} else {
					emitterConfig.particleClass = SingleAnimatedParticle;
					emitterConfig.lifespan = lp.anim.duration;
				}
			}
			
			image.emitter = lp.manager.createEmitter(emitterConfig);
			
			if (lp.data.animated) {
				image.emitter.anim = lp.anim;
			}
			
			if (lp.data.type == 'explode') {
				image.emitter.explode();
				image.emitter.explosionTimer = this.scene.time.addEvent({
					delay: ChannelParty.PARTICLE_EXPLODE_INTERVAL,
					callback: () => image.emitter.explode(30),
					loop: true,
				});
			}
		}
	}
	
	removeEmitter(username) {
		let image = this.currentUserImages[username];
		if (image.emitter) {
			if (image.emitter.explosionTimer) {
				image.emitter.explosionTimer.remove(false);
			}
			
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
		// The images should move at base speed when hype is off,
		// so 0 should be treated the same as 1 for the purposes
		// of valocity calculations
		if (level == 0) {
			level = 1;
		}
		
		let sign = Math.sign(image.body.velocity[axis]);
		let absoluteBaseSpeed = Math.abs(image.baseVelocity[axis]);
		let speed = absoluteBaseSpeed + 
			ChannelParty.HYPE_VELOCITY_INCREMENT * (level - 1);
		let finalVelocity = sign * speed;
		
		return finalVelocity;
	}
	
	hypeLevelDeactivated(level) {
		// Remove emitters as necessary
		Object.keys(this.currentUserImages).forEach(username => {
			this.removeEmitter(username);
		});
	}
	
	hypeLevelActivated(level) {
		// Add emitters as necessary
		Object.values(this.currentUserImages).forEach(image => {
			this.addLevelParticles(image, level);
		});
		
		Object.values(this.currentUserImages).forEach(image => {
			image.body.velocity.setTo(
				this.hypeLevelVeolicty(level, image, 'x'),
				this.hypeLevelVeolicty(level, image, 'y'));
		});
	}

	addImage(username) {
		let xpos = randomInt(
			ChannelParty.IMAGE_SIZE / 2,
			this.game.scale.displaySize.width - ChannelParty.IMAGE_SIZE / 2);
		let ypos = randomInt(
			ChannelParty.IMAGE_SIZE / 2,
			this.game.scale.displaySize.height - ChannelParty.IMAGE_SIZE / 2);
		
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
		image.baseVelocity = velocity; // Saved for changing by hype level
		image.body.collideWorldBounds = true;
		image.body.bounce.set(1);
		image.alpha = 0;
		
		image.body.velocity.setTo(
			this.hypeLevelVeolicty(this.hypeManager.currentLevel, image, 'x'),
			this.hypeLevelVeolicty(this.hypeManager.currentLevel, image, 'y'));
		
		
		if (this.useParticles) {
			this.addLevelParticles(image, this.hypeManager.currentLevel);
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
	
	resetFinalVideo() {
		$('#finalVideo').fadeOut(ChannelParty.FADE_DURATION);
		let videoElement = $('#finalVideo').get(0);
		videoElement.pause();
		videoElement.currentTime = 0;
	}
	
	processFinalVideo() {
		$('#finalVideo').on('ended', () => {
			this.sounds.unmute();
			this.resetFinalVideo();
		});
	}
	
	stopAll() {
		this.hypeManager.stop(() => {
			this.resetFinalVideo();
			this.sounds.unmute();
		});
	}
	
	// Start all the network stuff
	startNetwork() {
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
			this.stopAll();
		});
		
		this.server.on('finish', () => {
			this.showFinalVideo();
		});
		
		this.server.emit('getUserImageList');
	}
	
	start() {
		this.processFinalVideo();
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
		location: 'assets/MK/MK-Equalized.mp3',
		loop: true,
	},
	'pokemon': {
		location: 'assets/Pokemon/Theme-Equalized.mp3',
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
			name: 'Sonic',
			particles: {
				// source: 'assets/Sonic/RingSprite.png',
				// animated: true,
				// frameConfig: { frameWidth: 350, frameHeight: 306 },
				// frameRate: 24,
				// scale: 0.5,
				// looping: true,
				source: 'assets/Sonic/Ring.png',
				type: 'flow',
				rotate: false,
			},
			level: new ImageHypeLevel('assets/Sonic/Sonic.jpg', 'sonic'),
		},
		{
			name: 'Zelda',
			particles: {
				source: 'assets/Zelda/RealSword.png',
				type: 'flow',
				rotate: true,
			},
			level: new ImageHypeLevel('assets/Zelda/Zelda-Large.jpg', 'zelda'),
		},
		{
			name: 'Mario',
			particles: {
				source: 'assets/Mario/Star.png',
				type: 'flow',
				rotate: true,
			},
			level: new ImageHypeLevel('assets/Mario/Mario1.jpg', 'mario'),
		},
		{
			name: 'Pokemon',
			particles: {
				source: 'assets/Pokemon/Ball.png',
				type: 'flow',
				rotate: true,
			},
			level: new ImageHypeLevel('assets/Pokemon/Scratch_III.png', 'pokemon'),
		},
		{
			name: 'MK',
			particles: {
				source: 'assets/MK/Blood/TypeBSheet.png',
				animated: true,
				frameConfig: { frameWidth: 252, frameHeight: 119 },
				frameRate: 16,
				scale: 16,
				looping: true,
				speed: 0,
				frequency: 150,
				type: 'flow',
				rotate: false,
			},
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
