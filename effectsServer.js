const path = require('path');
const glob = require('glob');

// Basic server setup
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const PORT = 3333;

// Bot configuration - that is where you make it work with your bot and channel
const Config = require('./botConfig.json');

// Globals object, used to work around circular dependencies
const Globals = require('./globals');

// CLI input and output
const cli = require('./cliManager');
Globals.cli = cli;
cli.on(['q', 'quit', 'exit'], () => process.exit(0)); // Exit command

cli.on('a', () => cli.log('\x08\x08\x08\nHello'));

// Asset- and file-related registration
const Assets = require('./assets');
Assets.init(app);
Assets.registerAll();

// Gets a collection of { username: imageurl } pairs for all the users who have
// self-images in the user self-image directory
function getUserImageList(socket) {
	cli.log('User image list requested.');
	Assets.getUserImages(imageList => socket.emit('userImageList', imageList));
}

// The files here are needed by the HTML pages of the various effects
Assets.registerDir(path.join(__dirname, 'ClientsCommon'), '/common');


// Initialize keyboard interaction
const KEYCODES = require('./enums').KEYCODES;
const KeyboardManager = require('./keyboardManager');
KeyboardManager.start();


// Load channel rewards
// NOTE: This needs to be done BEFORE anything registers to listen for reward
// redemptions, or an error will be thrown
const RewardsManager = require('./rewardsManager');
RewardsManager.init();


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
	cli.log('Client connected.');
	
	// Requests for the list of user self-images
	socket.on('getUserImageList', () => getUserImageList(socket));
	
	// Requests for a list of all the Effects we have
	socket.on('getScripts', () => 
		socket.emit('scriptList', EffectManager.clientEffects));
	
	// Attachment requests:
	// Direct attachment, by Effect name
	socket.on('attachTo', effectName => {
		cli.log(`Attaching client to ${effectName}`);
		EffectManager.attachClient(effectName, socket);
	});
	
	// Attachment by tag
	socket.on('attachToTag', tag => {
		cli.log(`Attaching client by tag to ${tag}`);
		EffectManager.attachClientToTag(tag, socket);
	});
	
	// Makes our bot say something to a specific user
	socket.on('sayTo', data => {
		TwitchManager.say(`@${data.username} ${data.message}`);
	});
});

// Start the server
server.listen(PORT);
cli.log(`Listening on port ${PORT}...`);
cli.start();
