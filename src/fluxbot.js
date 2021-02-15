const express = require('express');
const path = require('path');
const Utils = require('./utils');

// Directory locations
const APP_DATA_DIR = path.join(process.env.APPDATA, 'Fluxbot');
const DATA_DIR_MAIN = APP_DATA_DIR;
const DATA_DIR_MODULES = path.join(APP_DATA_DIR, 'Modules');

const CONFIG_DIR = './Config/';
const WEB_ENTITIES_SUBDIR = 'WebEntities/';
const CONFIG_ENTITIES_PATH = CONFIG_DIR + 'Entities/';
const CONFIG_WEB_ENTITIES_PATH = CONFIG_DIR + WEB_ENTITIES_SUBDIR;
const CONFIG_WEB_ENTITIES_LIST_FILE = CONFIG_DIR + 'webEntitiesList.js';

const GUI_DIR = './GUI';
const GUI_DIR_WEB = '/gui/';

// TODO: Remove
// Bot configuration - that is where you make it work with your bot and channel
const Config = require('./botConfig.json');

// Globals object, used to work around circular dependencies
const Globals = require('./globals');

const KEYCODES = require('./enums').KEYCODES;



class FluxBot {
	constructor() {
		// Basic server setup
		this.app = express();
		this.server = require('http').createServer(this.app);
		this.io = require('socket.io')(this.server);
	}
	
	prepareDirectories() {
		Utils.ensureDirExists(APP_DATA_DIR);
		Utils.ensureDirExists(DATA_DIR_MAIN);
		Utils.ensureDirExists(DATA_DIR_MODULES);
	}
	
	// Read configuration entities and generate web client files if prompted to
	readConfigEntities(generationOutputDir) {
		this.entityFileManager = require('./entityFileManager');
		this.entityFileManager.registerEntities(CONFIG_ENTITIES_PATH, generationOutputDir);
	}
	
	// Initialize configurations (do this BEFORE loading the modules)
	loadConfig() {
		this.configManager = require('./configManager');
		this.mainConfig = require('./mainConfig');
		this.configManager.init(APP_DATA_DIR);
		this.configManager.setMain(this.mainConfig);
		this.configManager.loadMain();
	}
	
	setupCLI() {
		// CLI input and output
		this.cli = require('./cliManager');
		Globals.cli = this.cli;
		this.cli.on(['q', 'quit', 'exit'], () => process.exit(0)); // Exit command
	}
	
	// Asset- and file-related registration
	setupAssets() {
		this.assets = require('./assets');
		this.assets.init(this.app);
		this.assets.registerAll();
		
	}
	
	setupWebDirs() {
		// The files here are needed by the HTML pages of the various modules
		this.assets.registerDir(path.join(__dirname, 'ClientsCommon'), '/common');
		this.app.use(GUI_DIR_WEB, express.static(GUI_DIR));
	}
	
	// Gets a collection of { username: imageurl } pairs for all the users who have
	// self-images in the user self-image directory
	getUserImageList(socket) {
		this.cli.log('User image list requested.');
		this.assets.getUserImages(imageList => socket.emit('userImageList', imageList));
	}
	
	// Initialize keyboard interaction
	setupKeyboard() {
		this.keyboardManager = require('./keyboardManager');
		this.keyboardManager.start();
		
		// Alt + WinKey + F5 = Reload all configurations
		this.keyboardManager.registerShortcut(
			'ModuleManager:ReloadConfigs',
			[
				KEYCODES.VC_ALT_L,
				KEYCODES.VC_META_L,
				KEYCODES.VC_F5
			],
			() => this.configManager.loadAll()
		);
	}
	
	// Load channel rewards
	// NOTE: This needs to be done BEFORE anything registers to listen for reward
	// redemptions, or an error will be thrown
	setupChannelRewards() {
		const RewardsManager = require('./rewardsManager');
		RewardsManager.init();
	}
	
	// Load all the modules we have
	setupModules(generationOutputDir) {
		this.moduleManager = require('./moduleManager');
		this.moduleManager.readAndLoadAll(
			'/mod/',
			'Modules',
			this.app,
			express,
			generationOutputDir);
	}
	
	// Load Twitch interaction
	setupTwitch() {
		this.twitchManager = require('./twitchManager');
		// TODO: Switch to new configuration system
		this.twitchManager.init(Config.channel, Config.username, Config.oAuth);
	}
	
	// Set up StreamElements integration
	setupStreamElements() {
		this.seManager = require('./seManager');
		this.seManager.init();
	}
	
	// Save the current configuration (main and modules) - this is to create default
	// configuration files if they did not exist.
	// Do this AFTER loading the modules.
	saveConfig() {
		this.configManager.saveAll();
	}
	
	exportConfig() {
	
	}
	
	// Register to handle general server events
	registerServerEvents() {
		this.io.on('connection', socket => {
			this.cli.log('Client connected.');
			
			// Requests for the list of user self-images
			socket.on('getUserImageList', () => this.getUserImageList(socket));
			
			// Requests for a list of all the Modules we have
			socket.on('getScripts', () =>
				socket.emit('scriptList', this.moduleManager.clientModules));
			
			// Attachment requests:
			// Direct attachment, by Module name
			socket.on('attachTo', moduleName => {
				this.cli.log(`Attaching client to ${moduleName}`);
				this.moduleManager.attachClient(moduleName, socket);
			});
			
			// Attachment by tag
			socket.on('attachToTag', tag => {
				this.cli.log(`Attaching client by tag to ${tag}`);
				this.moduleManager.attachClientToTag(tag, socket);
			});
			
			// Makes our bot say something to a specific user
			socket.on('sayTo', data => {
				this.twitchManager.say(`@${data.username} ${data.message}`);
			});
			
			socket.on('configRequest', () => {
				let data = this.configManager.exportAll();
				socket.emit('loadConfig', data);
			});
			
			socket.on('saveConfig', config => {
				this.cli.log('Received configuration for saving.');
				this.configManager.importAll(config);
				this.configManager.saveAll();
				socket.emit('configSaved');
			});
		});
	}
	
	// Starts the server. Do this last.
	startServer() {
		let port = this.mainConfig.getPort();
		this.server.listen(port);
		this.cli.log(`Listening on port ${port}...`);
		this.cli.start();
	}
	
	setupAllAndStart() {
		this.prepareDirectories();
		this.readConfigEntities();
		this.loadConfig();
		this.setupCLI();
		this.setupAssets();
		this.setupWebDirs();
		this.setupKeyboard();
		this.setupChannelRewards();
		this.setupModules();
		this.setupTwitch();
		this.setupStreamElements();
		this.saveConfig();
		this.registerServerEvents();
		this.startServer();
	}
	
	setupConfigOnly() {
		Utils.ensureDirExists(CONFIG_WEB_ENTITIES_PATH);
		this.readConfigEntities(CONFIG_WEB_ENTITIES_PATH);
		this.setupModules(CONFIG_WEB_ENTITIES_PATH);
		this.entityFileManager.createRequirementsFile(
			CONFIG_WEB_ENTITIES_LIST_FILE,
			'./' + WEB_ENTITIES_SUBDIR);
	}
}

module.exports = new FluxBot();
