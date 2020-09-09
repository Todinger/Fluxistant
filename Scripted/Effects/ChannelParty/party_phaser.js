const FETCH_USERS_URL = 'https://tmi.twitch.tv/group/user/fluxistence/chatters';
const GLOW_SIZE = 15;
const GLOW_COLOR = '#ffffcc';
const UPDATE_INTERVAL = 1000;

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


class ChannelParty {
	static get IMAGE_SIZE()		{ return 300; }
	static get VELOCITY_MIN()	{ return 200; }
	static get VELOCITY_MAX()	{ return 800; }
	static get FADE_DURATION()	{ return 500; }
	
	
	constructor() {
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
		console.log('Phaser game started.');
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
			console.log('All ready');
			console.log(this.currentUserImages);
			this.processInitialUsers();
			
			this.socket.on('userJoined', username => {
				console.log(`User joined: ${username}; present = ${username in this.currentUserImages}`);
				let hasImage = username in this.existingUserFiles;
				this.currentUsersInChat[username] = hasImage;
				if ((username in this.currentUserImages) || !hasImage) {
					return;
				}
				
				this.currentUserImages[username] = this.addImage(username);
			});
			
			this.socket.on('userLeft', username => {
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
		console.log('Userlist loaded');
		this.userlistLoadad = true;
		this.updateAllReady();
	}

	markImagesLoaded() {
		console.log('Images loaded');
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
		console.log('Adding all initial images.');
		Object.keys(this.currentUsersInChat).forEach(username => {
			console.log(`Processing ${username}`);
			let hasImage = username in this.existingUserFiles;
			this.currentUsersInChat[username] = hasImage;
			if (hasImage) {
				console.log(`${username} has an image!`);
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
				console.log('Initial users:');
				console.log(newUsers);
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
		this.socket = io();
		
		this.socket.on('userImageList', userList => {
			Object.keys(userList).forEach(user => {
				this.existingUserFiles[user] = {
					url: userList[user],
					loaded: false,
				};
			});
			
			this.loadUserImages();
			// if (!this.running) {
			// 	this.running = true;
			// 	this.updateUsers();
			// 	// setInterval(updateUsers, UPDATE_INTERVAL);
			// }
		});

		this.socket.emit('connectTo', 'Channel Party');

		this.socket.on('hide', () => {
			console.log('Hiding');
			$('#gameContainer').fadeOut(ChannelParty.FADE_DURATION);
		});

		this.socket.on('show', () => {
			console.log('Showing');
			$('#gameContainer').fadeIn(ChannelParty.FADE_DURATION);
		});

		this.socket.emit('getUserImageList');
		
		console.log('Network started.');
	}
	
	start() {
		this.startPhaser();
		this.fetchCurrentUserlist();
		this.startNetwork();
	}
}

var cp = new ChannelParty();
cp.start();
