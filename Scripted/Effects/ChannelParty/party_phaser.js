const FETCH_USERS_URL = 'https://tmi.twitch.tv/group/user/fluxistence/chatters';
// const CORS_PROXY_URL = "http://localhost:8080/";
const CORS_PROXY_URL = "https://cors-anywhere.herokuapp.com/";
const USER_IMAGE_DIR = '../assets/user-images/';
// const USER_IMAGE_DIR = '../../Images/User-Specific/';
const USER_LIST_FILE = USER_IMAGE_DIR + '_Users.txt';
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
	// physics: {
	// 	default: 'arcade',
	// 	arcade: {
	// 		gravity: { y: 200 }
	// 	}
	// },
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
	console.log(`markAsLoaded(${username})`);
	if (!(username in existingUserFiles)) {
		return;
	}
	
	console.log(`*Fully* loaded image ${username}`);
	existingUserFiles[username].loaded = true;
	if (Object.values(existingUserFiles).reduce(
		(soFar, currentUser) => soFar && currentUser.loaded, true)) {
			console.log('Images *fully* loaded');
			imagesLoadad = true;
	}
}

function errorLoading(file) {
	console.log(`Could not load file: ${file}`);
}

function preload()
{
	scene = this;
	
	this.load.plugin('rexfadeplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexfadeplugin.min.js', true);
	this.load.on('filecomplete', (key, type, data) => markAsLoaded(key));
	this.load.on('loaderror', errorLoading);
	
	console.log('preload finished');
}

function loadUserImages() {
	Object.keys(existingUserFiles).forEach(username => {
		scene.load.image(username, existingUserFiles[username].url);
		console.log(`Loaded image ${username} from ${existingUserFiles[username].url}`);
	});
	
	scene.load.start();
	console.log('Images loaded');
}

function create()
{
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
	
	console.log(`Adding image ${username}`);
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
	// console.log('New users:'); console.log(newUsers);
	console.log('Users images update');
	let newUsernames = {};
	let newUserImages = {};
	
	// console.log('New users Images:'); console.log(newUserImages);
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
	
	// console.log('To remove:'); console.log(usersToRemove);
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
	
	// console.log('To add:'); console.log(usersToAdd);
	usersToAdd.forEach(username => {
		currentUsernames[username] = newUsernames[username];
		currentUserImages[username] = addImage(username);
	});
}

function updateUsers() {
	// doCORSGet(FETCH_USERS_URL, function(data) {
	// 	if (!imagesLoadad) {
	// 		return;
	// 	}
		
	// 	chattersData = JSON.parse(data);
	// 	let newUsers = [];
	// 	Object.values(chattersData.chatters).forEach(
	// 		groupUsers => newUsers.push(...groupUsers));
	// 	updateUserImages(newUsers);
	// });
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
	
	// existingUserFiles = userList;
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
