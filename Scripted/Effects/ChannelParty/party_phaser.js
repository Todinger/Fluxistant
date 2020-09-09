const FETCH_USERS_URL = 'https://tmi.twitch.tv/group/user/fluxistence/chatters';
const GLOW_SIZE = 15;
const GLOW_COLOR = '#ffffcc';
const UPDATE_INTERVAL = 1000;

const FADE_DURATION = 500;
const IMAGE_SIZE = 300;
const VELOCITY_MIN = 200;
const VELOCITY_MAX = 800;
const VELOCITY_X = 600;
const VELOCITY_Y = 600;

var existingUserFiles = {};
var currentUsernames = {};
var currentUserImages = {};

var running = false;
var showAll = false;
var imagesLoadad = false;

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
		preload: preload,
		create: create
	}
};

var game = new Phaser.Game(config);

var scene = null;

// Assumes Math.floor(max) >= Math.ceil(min)
function randomInt(min, max) {
	return min + Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min)));
}

function randomVelocity() {
	return randomInt(VELOCITY_MIN, VELOCITY_MAX);
}

function getSubKeys(obj1, obj2) {
	var k1 = Object.keys(obj1);
	return k1.filter(function(x) {
		return obj2[x] === undefined;
	});
}

function markAsLoaded(username) {
	if (!(username in existingUserFiles)) {
		return;
	}
	
	existingUserFiles[username].loaded = true;
	if (Object.values(existingUserFiles).reduce(
		(soFar, currentUser) => soFar && currentUser.loaded, true)) {
			imagesLoadad = true;
	}
}

function errorLoading(file) {
	console.error(`Could not load file: ${file}`);
}

function preload()
{
	scene = this;
	
	this.load.plugin('rexfadeplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexfadeplugin.min.js', true);
	this.load.on('filecomplete', (key, type, data) => markAsLoaded(key));
	this.load.on('loaderror', errorLoading);
}

function loadUserImages() {
	Object.keys(existingUserFiles).forEach(username => {
		scene.load.image(username, existingUserFiles[username].url);
	});
	
	scene.load.start();
}

function create()
{
	// TODO: Make the game scale with the window
	
	// game.scale.scaleMode = Phaser.Scale.ScaleManager.RESIZE;
	// game.scale.parentIsWindow = true;
	
	// game.physics.startSystem(Phaser.Physics.ARCADE);
	// game.physics.enable(image, Phaser.Physics.ARCADE);
	
	this.physics.world.setBoundsCollision(true, true, true, true);
}


function userFileExists(username) {
	return username in existingUserFiles;
}

function addImage(username) {
	let xpos = randomInt(IMAGE_SIZE / 2, 1920 - IMAGE_SIZE / 2);
	let ypos = randomInt(IMAGE_SIZE / 2, 1080 - IMAGE_SIZE / 2);
	// let xpos = randomInt(IMAGE_SIZE / 2, game.scale.displaySize.width - IMAGE_SIZE / 2);
	// let ypos = randomInt(IMAGE_SIZE / 2, game.scale.displaySize.height - IMAGE_SIZE / 2);
	
	let image = scene.physics.add.image(xpos, ypos, username);
	image.displayWidth = IMAGE_SIZE;
	image.scaleY = image.scaleX;
	
	if (image.texture.key == "__MISSING") {
		console.log(`Image missing for ${username}`);
	}
	
	image.body.velocity.setTo(randomVelocity(), randomVelocity());
	image.body.collideWorldBounds = true;
	image.body.bounce.set(1);
	
	image.alpha = 0;
	scene.tweens.add({
		targets: image,
		alpha: 1,
		duration: FADE_DURATION,
	});
	
	return image;
}

function updateUserImages(newUsers) {
	let newUsernames = {};
	let newUserImages = {};
	
	newUsers.forEach(username => {
		if (userFileExists(username)) {
			newUsernames[username] = existingUserFiles[username].url;
		}
	});
	
	if (showAll) {
		Object.keys(existingUserFiles).forEach(user => {
			newUsernames[user] = existingUserFiles[user].url;
		});
	}
	
	let usersToRemove = getSubKeys(currentUsernames, newUsernames);
	let usersToAdd = getSubKeys(newUsernames, currentUsernames);
	
	usersToRemove.forEach(username => {
		let image = currentUserImages[username];
		scene.tweens.add({
			targets: image,
			alpha: 0,
			duration: FADE_DURATION,
			onComplete: () => {
				image.destroy();
			},
		});
		
		delete currentUsernames[username];
		delete currentUserImages[username];
	});
	
	usersToAdd.forEach(username => {
		currentUsernames[username] = newUsernames[username];
		currentUserImages[username] = addImage(username);
	});
}

function updateUsers() {
	$.ajax({
		url: FETCH_USERS_URL,
		dataType: "jsonp",
		success: function( response ) {
			let newUsers = [];
			Object.values(response.data.chatters).forEach(
				groupUsers => newUsers.push(...groupUsers));
			updateUserImages(newUsers);
		}
	});
}

var socket = io();
socket.on('userImageList', userList => {
	Object.keys(userList).forEach(user => {
		existingUserFiles[user] = {
			url: userList[user],
			loaded: false,
		};
	});
	
	loadUserImages();
	if (!running) {
		running = true;
		updateUsers();
		setInterval(updateUsers, UPDATE_INTERVAL);
	}
});

socket.emit('connectTo', 'Channel Party');

socket.on('hide', () => {
	console.log('Hiding');
	$('#gameContainer').fadeOut(FADE_DURATION);
});

socket.on('show', () => {
	console.log('Showing');
	$('#gameContainer').fadeIn(FADE_DURATION);
});

socket.emit('getUserImageList');
