const express = require('express');
const path = require('path');
const fileUpload = require('express-fileupload');

// Directory locations
const APP_DATA_DIR = path.join(process.env.APPDATA, 'Fluxbot');
const DATA_DIR_MAIN = APP_DATA_DIR;
const DATA_DIR_MODULES = path.join(APP_DATA_DIR, 'Modules');
const DATA_DIR_TEMP = path.join(APP_DATA_DIR, 'Temp');

const CONFIG_DIR = './Config/';
const WEB_ENTITIES_SUBDIR = 'WebEntities/';
const CONFIG_ENTITIES_PATH = CONFIG_DIR + 'Entities/';
const CONFIG_WEB_ENTITIES_PATH = CONFIG_DIR + WEB_ENTITIES_SUBDIR;
const CONFIG_WEB_ENTITIES_LIST_FILE = CONFIG_DIR + 'webEntitiesList.js';

const GUI_DIR = './GUI';
const GUI_DIR_WEB = '/gui/';


// Globals object, used to work around circular dependencies
const Globals = require('./globals');
Globals.userDir = APP_DATA_DIR;
Globals.userModulesDir = DATA_DIR_MODULES;
const Utils = require('./utils');


const KEYCODES = require('./enums').KEYCODES;



class FluxBot {
	constructor() {
		// Basic server setup
		this.app = express();
		this.server = require('http').createServer(this.app);
		this.io = require('socket.io')(this.server);
	}
	
	debug(msg) {
		this.cli.debug(`[Main] ${msg}`);
	}
	
	log(msg) {
		this.cli.log(`[Main] ${msg}`);
	}
	
	prepareDirectories() {
		Utils.ensureDirExists(APP_DATA_DIR);
		Utils.ensureDirExists(DATA_DIR_MAIN);
		Utils.ensureDirExists(DATA_DIR_MODULES);
		Utils.ensureDirExists(DATA_DIR_TEMP);
	}
	
	setupConfigSources() {
		this.configSourceManager = require('./configSourceManager');
		this.configSourceManager.onAny(data => {
			this.io.emit('sourceChanged', data);
		});
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
		
		const { MakeBroadcasterUser } = require('./user');
		// TODO: Get name from channel name or use a default
		let username = this.mainConfig.getStreamerName();
		if (!Utils.isNonEmptyString(username)) {
			username = 'streamer';
		}
		Globals.StreamerUser = MakeBroadcasterUser(username);
	}
	
	setupLogs() {
		this.logger = require('./logger');
	}
	
	setupCLI() {
		// CLI input and output
		this.cli = require('./cliManager');
		Globals.cli = this.cli;
		this.cli.on(['q', 'quit', 'exit'], () => process.exit(0)); // Exit command
		this.logger.registerCliCommands();
	}
	
	// Asset- and file-related registration
	setupAssets() {
		this.webDirs = require('./webDirs');
		this.webDirs.init(this.app);
		this.webDirs.registerAll();
		
	}
	
	setupWebDirs() {
		// The files here are needed by the HTML pages of the various modules
		this.webDirs.registerDir(path.join(__dirname, 'ClientsCommon'), '/common');
		this.app.use(GUI_DIR_WEB, express.static(GUI_DIR));
		console.log(`Configuration UI address: http://localhost:${this.mainConfig.getPort()}${GUI_DIR_WEB}cfg.html`);
		console.log(`Main overlay address: http://localhost:${this.mainConfig.getPort()}/mod/ScriptedModules/ScriptedModules.html`);
	}
	
	// Gets a collection of { username: imageurl } pairs for all the users who have
	// self-images in the user self-image directory
	getUserImageList(socket) {
		this.log('User image list requested.');
		this.webDirs.getUserImages(imageList => socket.emit('userImageList', imageList));
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
		
		// Numpad- = Reconnect streamer account to Twitch
		this.keyboardManager.registerShortcut(
			'TwitchManager:ReconnectStreamer',
			[
				KEYCODES.VC_KP_SUBTRACT,
			],
			() => this.twitchManager.reconnectStreamer()
		);
	}
	
	// Load channel rewards
	// NOTE: This needs to be done BEFORE anything registers to listen for reward
	// redemptions, or an error will be thrown
	setupChannelRewards() {
		this.rewardsManager = require('./rewardsManager');
		this.rewardsManager.init();
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
	
	// Collect all Function-related help information for response variables
	setupFunctionHelper() {
		this.functionHelper = require('./Functions/functionHelper');
		this.functionHelper.collectHelpData(this.moduleManager.getModules());
	}
	
	// Load Twitch interaction
	setupTwitch() {
		this.twitchManager = require('./twitchManager');
		// TODO: Switch to new configuration system
		this.twitchManager.init();
	}
	
	// Set up StreamElements integration
	setupStreamElements() {
		this.seManager = require('./seManager');
	}
	
	// Save the current assets for the modules - this is to create default
	// asset files if they did not exist.
	// Do this AFTER loading the modules.
	saveData() {
		this.assetManager.saveAll();
	}
	
	// Save the current configuration (main and modules) - this is to create default
	// configuration files if they did not exist.
	// Do this AFTER loading the modules.
	saveConfig() {
		this.configManager.saveAll();
	}
	
	emptyDataTempDir() {
		Utils.emptyDirPromise(DATA_DIR_TEMP).then();
	}
	
	setupUserData() {
		this.assetManager = require('./assetManager');
		this.assetManager.init(APP_DATA_DIR);
		
		this.app.use(fileUpload({
			useTempFiles: true,
			tempFileDir: DATA_DIR_TEMP,
		}));
		
		this.app.get('/assets/mod/:modName/:collection', async (req, res) => {
			let modName = req.params.modName;
			let collection = req.params.collection;
			let fileKey = req.query.fileKey;
			
			try {
				let files = await this.assetManager.getFilesWeb({
					modName,
					collection,
					fileKey
				});
				
				let contentType = null;
				let filesToSend = files.map(file => {
					if (file.success) {
						contentType = file.contentType;
						return {
							success: true,
							name: file.name,
							data: file.data,
							fileKey: file.fileKey,
						};
					} else {
						return {
							success: false,
							fileKey: file.fileKey,
						}
					}
				});
				
				if (contentType) {
					res.set('Content-Type', contentType);
				}
				
				let sentObject = { files: filesToSend };
				res.send(JSON.stringify(sentObject));
			} catch (err) {
				return res.status(500).send(err);
			}
		});
		
		this.app.post('/assets/mod/:modName/:collection', (req, res) => {
			if (!req.files || Object.keys(req.files).length === 0) {
				return res.status(400).send('No files were uploaded.');
			}
			
			let modName = req.params.modName;
			let collection = req.params.collection;
			
			let encodedFiles = {};
			let files = req.files || {}; // The empty object here is to shut WebStorm's inspector up
			
			let uploadPromises = [];
			Object.keys(files).forEach(uploadKey => {
				let file = files[uploadKey];
				let promise = this.assetManager.upload({
					modName,
					collection,
					file,
				}).then(savedFile => {
					encodedFiles[uploadKey] = {
						success: true,
						fileKey: savedFile.fileKey,
						name: savedFile.name,
						data: savedFile.data,
					};
				}).catch(err => {
					encodedFiles[uploadKey] = {
						success: false,
						err: `Error saving file: ${err}`,
					};
				});
				
				uploadPromises.push(promise);
			});
			
			Promise.all(uploadPromises).then(() => {
				res.send(encodedFiles);
			});
		});
		
		this.app.delete('/assets/mod/:modName/:collection', (req, res) => {
			let modName = req.params.modName;
			let collection = req.params.collection;
			let fileKey = req.query.fileKey;
			
			try {
				this.assetManager.delete({
					modName,
					collection,
					fileKey,
				}).then(() => {
					res.send(`File 'mod/${modName}/${collection}/${fileKey}' deleted.`);
				});
			} catch (err) {
				return res.status(500).send(err);
			}
		});
		
		this.io.on('dropDataChanges', () => {
			this.assetManager.dropChanges().then(() => this.emptyDataTempDir());
		});
	}
	
	// Register to handle general server events
	registerServerEvents() {
		this.io.on('connection', socket => {
			this.log('Client connected.');
			
			// Requests for the list of user self-images
			socket.on('getUserImageList', () => this.getUserImageList(socket));
			
			// Requests for a list of all the Modules we have
			socket.on('getScripts', () =>
				socket.emit('scriptList', this.moduleManager.clientModules));
			
			// Attachment requests:
			// Direct attachment, by Module name
			socket.on('attachTo', moduleName => {
				this.log(`Attaching client to ${moduleName}`);
				this.moduleManager.attachClient(moduleName, socket);
			});
			
			// Attachment by tag
			socket.on('attachToTag', tag => {
				this.log(`Attaching client by tag to ${tag}`);
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
			
			socket.on('saveConfig', async config => {
				this.debug('Received configuration for saving.');
				try {
					this.configManager.validateAll(config);
				} catch (err) {
					socket.emit(
						'configSaveError',
						{
							message: err.message,
							path: err.path,
						});
					
					return;
				}
				
				try {
					// Apply the configuration (also makes sure it's valid)
					this.configManager.importAll(config);
					
					// Create a backup of the current configuration, and then save the new one
					this.configManager.createNewBackup();
					this.configManager.saveAll();
					
					this.rewardsManager.setRewards(this.mainConfig.getChannelRewards());
					await this.assetManager.commitChanges();
					
					this.applyMainConfig();
					
					socket.emit('configSaved');
				} catch (err) {
					let message = err && err.message ? err.message : `${err}`;
					socket.emit('configSaveError', { message });
				}
			});
			
			socket.on('listenForReward', () => {
				this.rewardsManager.listenForReward((user, rewardID, msg) => {
					socket.emit('rewardRedeemed', {
						user: user.displayName,
						rewardID,
						message: msg,
					});
				});
			});
			
			socket.on('stopListeningForReward', () => {
				this.rewardsManager.stopListeningForReward();
			});
			
			socket.on('getHelpData', () => {
				socket.emit('helpData', this.functionHelper.getHelpData());
			});
			
			socket.on('getSources', () => {
				socket.emit('allSources', this.configSourceManager.getAllSources());
			});
		});
	}

	startStreamRaidersManager() {
		this.streamRaidersManager = require('./streamRaidersManager');
	}
	
	// Starts the server. Do this last.
	startServer() {
		let port = this.mainConfig.getPort();
		this.server.listen(port, 'localhost');
		this.log(`Listening on port ${port}...`);
		this.cli.start();
	}
	
	applyMainConfig() {
		this.twitchManager.connect(this.mainConfig.getTwitchParams());
		this.seManager.connect(this.mainConfig.getStreamElementsParams());
		this.streamRaidersManager.applyConfig(this.mainConfig.getStreamRaidersParams());
		this.moduleManager.toggleAutoSave(this.mainConfig.getAutoSaveEnabled());

		// this.logger.init(this.mainConfig.getLoggerParams());
	}
	
	deleteOldBackups() {
		this.configManager.deleteOldBackups();
	}
	
	setupAllAndStart() {
		this.prepareDirectories();
		this.setupConfigSources();
		this.readConfigEntities();
		this.loadConfig();
		this.emptyDataTempDir();
		this.setupUserData();
		this.setupLogs();
		this.setupCLI();
		this.setupAssets();
		this.setupWebDirs();
		this.setupKeyboard();
		this.setupChannelRewards();
		this.setupModules();
		this.setupFunctionHelper();
		this.setupTwitch();
		this.setupStreamElements();
		this.saveData();
		this.saveConfig();
		this.registerServerEvents();
		this.deleteOldBackups();
		this.startStreamRaidersManager();
		this.applyMainConfig();
		this.startServer();
	}
	
	setupConfigOnly() {
		this.setupLogs();
		this.setupCLI();
		Utils.ensureDirExists(CONFIG_WEB_ENTITIES_PATH);
		this.readConfigEntities(CONFIG_WEB_ENTITIES_PATH);
		this.setupModules(CONFIG_WEB_ENTITIES_PATH);
		this.entityFileManager.createRequirementsFile(
			CONFIG_WEB_ENTITIES_LIST_FILE,
			'./' + WEB_ENTITIES_SUBDIR);
		
		console.log('Configs compiled successfully.');
	}
}

module.exports = new FluxBot();
