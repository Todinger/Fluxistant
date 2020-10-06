const path = require('path');
const glob = require('glob');

// Basic server setup
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const PORT = 3333;

const Config = require('./botConfig.json');


// Asset- and file-related registration
const Assets = require('./assets');
Assets.init(app);
Assets.registerAll();

function getUserImageList(socket) {
	console.log('User image list requested.');
	Assets.getUserImages(imageList => socket.emit('userImageList', imageList));
}

// The files here are needed by the HTML pages of the various effects
Assets.registerDir(path.join(__dirname, 'ClientsCommon'), '/common');


// Initialize keyboard interaction
const KEYCODES = require('./enums').KEYCODES;
const KeyboardManager = require('./keyboardManager');
// KeyboardManager.logAllUp = true;
KeyboardManager.start();


// Load all the effects we have
const EffectManager = require('./effectManager');
EffectManager.loadAll('/fx/', 'Effects', app, express);

// Load Twitch interaction
const TwitchManager = require('./twitchManager');
TwitchManager.init(Config.channel, Config.username, Config.oAuth);


// Set up StreamElements integration
const SEManager = require('./seManager');
SEManager.init();


// Register to handle general server events
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
});

// Start the server
server.listen(PORT);
console.log(`Listening on port ${PORT}...`);
