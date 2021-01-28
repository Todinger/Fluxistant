// Basic libraries
// const { createRequire } = require('module');
const path = require('path');
// const createRequireFromPath = relativePath => createRequire(path.resolve(relativePath));
function createRequireFromPath(relativePath) {
	return modulePath => require('./' + path.join(relativePath, modulePath));
}

const CONFIG_ENTITIES_PATH = './Config/Entities/';

// Global require() shortcuts
global.requireMain = createRequireFromPath('./');
global.requireMod = createRequireFromPath('./Modules/');

let requireConfig = createRequireFromPath(CONFIG_ENTITIES_PATH);
global.requireConfig = entityName => requireConfig(`./${entityName}`);
global.requireModConfig = 
	(modname, entityName) => global.requireMod(`./${modname}/Config/${entityName}`);

// const glob = require('glob');
// const fs = require('fs');

// Basic server setup
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
// const PORT = 3333;



// Config directory structure setup
const APP_DATA_DIR = path.join(process.env.APPDATA, 'Fluxbot');
const DATA_DIR_MAIN = APP_DATA_DIR;
const DATA_DIR_MODULES = path.join(APP_DATA_DIR, 'Modules');

const Utils = require('./utils');

Utils.ensureDirExists(APP_DATA_DIR);
Utils.ensureDirExists(DATA_DIR_MAIN);
Utils.ensureDirExists(DATA_DIR_MODULES);



// Bot configuration - that is where you make it work with your bot and channel
const Config = require('./botConfig.json');

// Globals object, used to work around circular dependencies
const Globals = require('./globals');

// CLI input and output
const cli = require('./cliManager');
Globals.cli = cli;
cli.on(['q', 'quit', 'exit'], () => process.exit(0)); // Exit command

cli.on('a', () => cli.log('\x08\x08\x08\nHello'));


// Initialize configurations (do this BEFORE loading the modules)
const EntityFactory = require('./Config/entityFactory');
EntityFactory.registerAll(CONFIG_ENTITIES_PATH);

// const Configuration = require('./configuration');
const ConfigManager = require('./configManager');
const MainConfig = require('./mainConfig');
ConfigManager.init(APP_DATA_DIR);
ConfigManager.setMain(MainConfig);
ConfigManager.loadMain();

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

// The files here are needed by the HTML pages of the various modules
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


// Load all the modules we have
const ModuleManager = require('./moduleManager');
ModuleManager.readAndLoadAll('/mod/', 'Modules', app, express);


// Load Twitch interaction
const TwitchManager = require('./twitchManager');
TwitchManager.init(Config.channel, Config.username, Config.oAuth);


// Set up StreamElements integration
const SEManager = require('./seManager');
SEManager.init();

// Save the current configuration (main and modules) - this is to create default
// configuration files if they did not exist
ConfigManager.saveAll();

// Alt + WinKey + F5 = Reload all configurations
KeyboardManager.registerShortcut(
	'ModuleManager:ReloadConfigs',
	[
		KEYCODES.VC_ALT_L,
		KEYCODES.VC_META_L,
		KEYCODES.VC_F5
	],
	() => ConfigManager.loadAll()
);


// Register to handle general server events
io.on('connection', socket => {
	cli.log('Client connected.');
	
	// Requests for the list of user self-images
	socket.on('getUserImageList', () => getUserImageList(socket));
	
	// Requests for a list of all the Modules we have
	socket.on('getScripts', () => 
		socket.emit('scriptList', ModuleManager.clientModules));
	
	// Attachment requests:
	// Direct attachment, by Module name
	socket.on('attachTo', moduleName => {
		cli.log(`Attaching client to ${moduleName}`);
		ModuleManager.attachClient(moduleName, socket);
	});
	
	// Attachment by tag
	socket.on('attachToTag', tag => {
		cli.log(`Attaching client by tag to ${tag}`);
		ModuleManager.attachClientToTag(tag, socket);
	});
	
	// Makes our bot say something to a specific user
	socket.on('sayTo', data => {
		TwitchManager.say(`@${data.username} ${data.message}`);
	});
});

// Start the server
let port = MainConfig.getPort();
server.listen(port);
cli.log(`Listening on port ${port}...`);
cli.start();

/*
class Test {
	constructor() {
		this.bla = 7;
	}
	
	hello = 9;
	
	thing = {
		hi: 3,
	}
}

class X extends Test {
	yo = {
		hi: 5,
	}
}

let t = new X();
console.log(`t.bla = ${t.bla}`);
console.log(`t.hello = ${t.hello}`);
console.log(`t.thing = ${t.thing}`);
console.log(`t.thing.hi = ${t.thing.hi}`);
*/

// const Errors = require('./errors');
// function Blabla() {
// 	Errors.abstract();
// }
// class A {
// 	B() {
// 		Errors.abstract();
// 	}
// }
// let a = new A();
// a.B();
// Errors.typeTest(3, 'boolean');
