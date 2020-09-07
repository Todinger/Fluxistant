const FETCH_USERS_URL = 'https://tmi.twitch.tv/group/user/fluxistence/chatters';
// const CORS_PROXY_URL = "http://localhost:8080/";
const CORS_PROXY_URL = "https://cors-anywhere.herokuapp.com/";
const USER_IMAGE_DIR = './User-Specific/';
// const USER_IMAGE_DIR = '../../Images/User-Specific/';
const USER_LIST_FILE = USER_IMAGE_DIR + '_Users.txt';
const GLOW_SIZE = 15;
const GLOW_COLOR = '#ffffcc';
const UPDATE_INTERVAL = 1000;

const FADE_DURATION = 500;
const IMAGE_SIZE = 300;
const VELOCITY_X = 200;
const VELOCITY_Y = 200;

var currentUsernames = {};
var currentUserImages = {};

var config = {
	type: Phaser.AUTO,
	transparent: true,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 200 }
		}
	},
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

function getSubKeys(obj1, obj2) {
	var k1 = Object.keys(obj1);
	return k1.filter(function(x) {
		return obj2[x] === undefined;
	});
}

function preload ()
{
	scene = this;
	
	this.load.plugin('rexfadeplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexfadeplugin.min.js', true);
	
	// this.load.setBaseURL(USER_IMAGE_DIR);
	
	let _this = this;
	Object.keys(existingUserFiles).forEach(username => {
		_this.load.image(username, existingUserFiles[username]);
	});
}

function create ()
{
	game.scale.scaleMode = Phaser.Scale.ScaleManager.RESIZE;
	game.scale.parentIsWindow = true;
	
	game.physics.startSystem(Phaser.Physics.ARCADE);
	game.physics.enable(image, Phaser.Physics.ARCADE);
}


function userFileExists(username) {
	return username in existingUserFiles;
}

function addImage(username) {
	let xpos = randomInt(IMAGE_SIZE / 2, game.scale.displaySize.width - IMAGE_SIZE / 2);
	let ypos = randomInt(IMAGE_SIZE / 2, game.scale.displaySize.height - IMAGE_SIZE / 2);
	
	let image = game.add.sprite(xpos, ypos, username);
	image.displayWidth = IMAGE_SIZE;
	image.scaleY = image.scaleX;
	
	image.body.velocity.setTo(VELOCITY_X, VELOCITY_Y);
	image.body.collideWorldBounds = true;
	image.body.bounce.set(1);
	
	image.alpha = 0;
	scene.tweens.add({
		targets: image,
		alpha: 1,
		duration: FADE_DURATION,
	});
}

function updateUserImages(newUsers) {
	// console.log('New users:'); console.log(newUsers);
	let newUsernames = {};
	let newUserImages = {};
	
	// console.log('New users Images:'); console.log(newUserImages);
	newUsers.forEach(username => {
		if (userFileExists(username)) {
			newUsernames[username] = existingUserFiles[username];
		}
	});
	
	let usersToRemove = getSubKeys(currentUsernames, newUsernames);
	let usersToAdd = getSubKeys(newUsernames, currentUsernames);
	
	// console.log('To remove:'); console.log(usersToRemove);
	usersToRemove.forEach(username => {
		scene.plugins.get('rexfadeplugin').fadeOutDestroy(
			currentUserImages[username],
			FADE_DURATION);
		// game.add.tween(currentUserImages[username]).to( { alpha: 1 }, 2000, Phaser.Easing.Linear.None, true, 0, 1000, true);
	});
	
	// console.log('To add:'); console.log(usersToAdd);
	usersToAdd.forEach(username => {
		newUserImages[username] = addImage(username);
	});
	
	currentUsernames = newUsernames;
	currentUserImages = newUserImages;
}

function updateUsers() {
	doCORSGet(FETCH_USERS_URL, function(data) {
		chattersData = JSON.parse(data);
		let newUsers = [];
		Object.values(chattersData.chatters).forEach(
			groupUsers => newUsers.push(...groupUsers));
		updateUserImages(newUsers);
	});
}

setInterval(updateUsers, UPDATE_INTERVAL);
