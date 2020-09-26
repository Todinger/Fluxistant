const path = require('path');
const glob = require('glob');

// Basic server setup
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

const PORT = 3333;

const Config = require('./botConfig.json');

const Assets = require('./assets');
Assets.registerAll(app);

// // Self-Images
// const USERIMAGE_DIR = '../../Images/User-Specific';
// const USERIMAGE_URL = '/assets/user-images/';
// app.use(USERIMAGE_URL,
// 	express.static(path.join(__dirname, USERIMAGE_DIR)));

// // Image Display
// const IMAGEDISPLAY_DIR = '../../Images/Display Images';
// const IMAGEDISPLAY_URL = '/assets/image-display/';
// app.use(IMAGEDISPLAY_URL,
// 	express.static(path.join(__dirname, IMAGEDISPLAY_DIR)));

// // Sound Effects
// const SOUNDEFFECTS_DIR = '../../sfx';
// const SOUNDEFFECTS_URL = '/assets/sfx/';
// app.use(SOUNDEFFECTS_URL,
// 	express.static(path.join(__dirname, SOUNDEFFECTS_DIR)));


function getUserImageList(socket) {
	console.log('User image list requested.');
	Assets.getUserImages(imageList => socket.emit('userImageList', imageList));
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
app.use('/fx/clientUtils.js',
	express.static(path.join(__dirname, 'Effects', 'clientUtils.js')));

var TwitchManager = require('./twitchManager');
TwitchManager.init(Config.channel, Config.username, Config.oAuth);

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

var SEManager = require('./seManager');
setTimeout(() => {
	SEManager.getUserPoints('fluxistence', points => console.log(`Flux's points: ${points}`), error => console.error(error));
	// SEManager.addUserPoints('fluxistence', 500, newAmount => console.log(`After adding 500: ${newAmount}`), error => console.error(error));
	// SEManager.subtractUserPoints('fluxistence', 1, newAmount => console.log(`After subtracting 1: ${newAmount}`), error => console.error(error));
	// SEManager.consumeUserPoints(
	// 	'fluxistence',
	// 	500,
	// 	newAmount => console.log(`New amount after consuming 500: ${newAmount}`),
	// 	(amount, points) => console.log(`User only has ${points} points, not enough to consume ${amount}.`),
	// 	error => console.error(error)
	// );
}, 5000);


io.on('connection', socket => {
	console.log('Client connected.');
	socket.on('getUserImageList', () => getUserImageList(socket));
	socket.on('getScripts', () => 
		socket.emit('scriptList', EffectManager.clientEffects));
	
	socket.on('attachTo', effectName => {
		console.log(`Attaching client to ${effectName}`);
		EffectManager.attachClient(effectName, socket);
	});
	
	socket.on('attachToTag', tag => {
		console.log(`Attaching client by tag to ${tag}`);
		EffectManager.attachClientToTag(tag, socket);
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
