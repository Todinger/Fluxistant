const path = require('path');
const glob = require('glob');

// Basic server setup
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

const PORT = 3333;


// Self-Images
const USERIMAGE_DIR = '../../Images/User-Specific';
const USERIMAGE_URL = '/assets/user-images/';
app.use(USERIMAGE_URL,
	express.static(path.join(__dirname, USERIMAGE_DIR)));

function getUserImageList(socket) {
	console.log('User image list requested.');
	glob(path.join(USERIMAGE_DIR, '*.png'), {}, (err, files) => {
		let imageList = {};
		files.forEach(file => {
			let username = path.parse(file).name;
			let imageext = path.parse(file).ext;
			let imageurl = USERIMAGE_URL + username + imageext;
			imageList[username] = imageurl;
		});
		
		socket.emit('userImageList', imageList);
	});
}

var KEYCODES = require('./enums').KEYCODES;
var KeyboardManager = require('./keyboardManager');
// KeyboardManager.logAllUp = true;
KeyboardManager.start();


// Load all the effects we have
var Effect = require('./effect');
var EffectManager = require('./effectManager');
EffectManager.loadAll('/fx/', 'Effects', app, express);
app.use('/fx/effectClient.js',
	express.static(path.join(__dirname, 'Effects', 'effectClient.js')));

var TwitchManager = require('./twitchManager');
TwitchManager.init('fluxistence', 'fluxistant', 'oauth:luxvl6vwq0r0o9t03p7m1s3kf482lc');

/* Testing Code

TwitchManager.on('message', (user, message) => {
	console.log(`${user.displayName}: ${message}`);
});
TwitchManager.on('action', (user, message) => {
	console.log(`${user.displayName} ${message}`);
});
TwitchManager.onCommand('a', (user, x, y, z) => {
	console.log(`Ha! ${user.displayName} does ${x} to the ${y} with the ${z}!`);
})

TwitchManager.onCommand('a', [], (user, x, y, z) => {
	console.log(`Ha! ${user.displayName} does ${x} to the ${y} with the ${z}!`);
});
TwitchManager.onCommand('b', [User.isMod()], (user, x) => {
	console.log(`b: ${user.displayName} does ${x}!`);
});
TwitchManager.onCommand('c', [User.isUser('fluxistence')], (user, x) => {
	console.log(`c: ${user.displayName} does ${x}!`);
});
TwitchManager.onCommand('d', [User.isUser('yecatsmailbox')], (user, x) => {
	console.log(`d: ${user.displayName} does ${x}!`);
});
TwitchManager.onCommand('e', [User.isAtLeastMod()], (user, x) => {
	console.log(`e: ${user.displayName} does ${x}!`);
});
*/




io.on('connection', socket => {
	console.log('Client connected.');
	socket.on('getUserImageList', () => getUserImageList(socket));
	socket.on('getScripts', () => 
		socket.emit('scriptList', EffectManager.clientEffects));
	
	socket.on('attachTo', scriptName => {
		console.log(`Attaching client to ${scriptName}`);
		EffectManager.attachClient(scriptName, socket);
	});
	
	socket.on('sayTo', data => {
		TwitchManager.say(`@${data.username} ${data.message}`);
	});
	
	// TODO: REMOVE!!! DEBUG ONLY!
	socket.on('ask', request => {
		socket.emit(request.event, request.data);
	});
});

server.listen(PORT);
console.log(`Listening on port ${PORT}...`);
