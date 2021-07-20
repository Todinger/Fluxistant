const OBSWebSocket = require('obs-websocket-js');

const Module = requireMain('./module');
const ObsFunctionFactory = require('./Functions/obsFunctionFactory');
const ConfigSourceManager = requireMain('./configSourceManager');
const Timers = requireMain('./timers');
const Utils = requireMain('./utils');

const DEFAULT_ADDRESS = 'localhost';
const DEFAULT_PORT = 4444;
const CONNECT_ATTEMPT_INTERVAL = 5000; // 5 seconds

const SCENES_SOURCE_NAME = 'obsScenes';

const DESCRIPTION =
`Provides functions for controlling OBS using the bot.

In order for this to work, you need to install OBS WebSocket on your system.
You can get it by going here:
https://obsproject.com/forum/resources/obs-websocket-remote-control-obs-studio-from-websockets.466/

Click on "Go to download" to the right of the title, then go to the end and download the Windows installer.

Once you have it installed (requires restarting OBS probably) you'll be able to configure it in OBS through
Tools -> WebSocket Server Settings. You can choose the server port there, and if you enable authentication then
connecting to it will require a password. If you do so, you will need to enter the same details in the configuration
here in order for it to work.`;

class ObsControl extends Module {
	constructor() {
		super({
			name: 'OBS Control',
			description: DESCRIPTION,
		});
		
		this.obs = new OBSWebSocket();
		this.connected = false;
		this.attemptingConnection = false;
		this.authErrorMessageShown = false;
		this.connectAttemptTimer = Timers.repeating();
		this.connectionSettings = {
			address: undefined,
			port: undefined,
			password: undefined,
		};
		
		this.obsFunctions = {};
		this.scenes = [];
		this.previousScene = null;
		this.currentScene = null;
		
		this._registerForEvents();
	}
	
	_setCurrentScene(sceneName) {
		this.previousScene = this.currentScene;
		this.currentScene = sceneName;
	}
	
	_attemptToConnect(settings) {
		this.obs.connect(settings)
			.then(() => {
				this.log('Connected to OBS.');
				this.connected = true;
				this.attemptingConnection = false;
				this.connectAttemptTimer.clear();
				
				return this._loadScenes();
			})
			.catch(err => {
				this.debug(`Failed to connect to OBS: ${Utils.errMessage(err)}`);
				if (err.error === 'Authentication Failed.' && !this.authErrorMessageShown) {
					this.error('Failed to authenticate with OBS. Are you sure you set the right password in the configuration?');
					this.authErrorMessageShown = true;
				}
			});
	}
	
	_connect() {
		if (!this.connected && !this.attemptingConnection) {
			this.attemptingConnection = true;
			let settings = {};
			if (this.connectionSettings.address || this.connectionSettings.port) {
				let address = this.connectionSettings.address || DEFAULT_ADDRESS;
				let port = this.connectionSettings.port || DEFAULT_PORT;
				settings.address = `${address}:${port}`;
			}
			
			if (this.connectionSettings.password) {
				settings.password = this.connectionSettings.password;
			}
			
			this.connectAttemptTimer.set(
				CONNECT_ATTEMPT_INTERVAL,
				() => this._attemptToConnect(settings));
		}
	}
	
	_disconnect() {
		if (this.connected) {
			// Ignore errors in disconnections since they mean we're not
			// connected and that's what we want
			try {
				this.obs.disconnect();
			} catch (err) {}
			
			this.connected = false;
		} else if (this.attemptingConnection) {
			this.connectAttemptTimer.clear();
			this.attemptingConnection = false;
		}
	}
	
	_reconnect() {
		this._disconnect();
		this._connect();
	}
	
	_loadScenes() {
		return this.obs.send('GetSceneList')
			.then(data => {
				this.scenes = data.scenes;
				this._setCurrentScene(data.currentScene);
				ConfigSourceManager.setSourceOptions(
					SCENES_SOURCE_NAME,
					data.scenes.map(scene => scene.name))
			})
			.catch(err => {
				this.error(`Failed to load scenes from OBS: ${Utils.errMessage(err)}`);
			});
	}
	
	_registerForEvents() {
		this.obs.on(
			'ScenesChanged',
			(...p) => this._scenesChanged(...p));
		this.obs.on(
			'SwitchScenes',
			(...p) => this._sceneSwitched(...p));
	}
	
	_scenesChanged() {
		this._loadScenes()
			.then();
	}
	
	_sceneSwitched(data) {
		this._setCurrentScene(data.sceneName);
	}
	
	_functionActivated(funcObject) {
		if (this.connected) {
			funcObject.obsFunction.invoke()
				.catch(err => {
					if (err.code === 'NOT_CONNECTED') {
						this._reconnect();
						this.info('Disconnected from OBS.');
					} else {
						this.error(Utils.errMessage(err));
					}
				});
		}
	}
	
	_remakeFunctions(conf) {
		this.deactivateFunctions(this.obsFunctions || {});
		
		this.obsFunctions = {};
		if (conf.enabled && conf.obsFunctions) {
			for (let i = 0; i < conf.obsFunctions.length; i++) {
				let func = conf.obsFunctions[i];
				let funcObject = this.createFunctionObject(func);
				funcObject.details = func.details;
				
				if (!funcObject.funcID) {
					funcObject.funcID = `OBS Func[${i}]`;
				}
				
				funcObject.obsFunction = ObsFunctionFactory.build(
					func.details.type,
					this,
					func.details);
				
				funcObject.details = func.details;
				funcObject.action = () => {
					this._functionActivated(funcObject);
				};
				
				this.obsFunctions[funcObject.funcID] = funcObject;
			}
		}
		
		this.activateFunctions(this.obsFunctions);
	}
	
	enable() {
		this._connect();
	}
	
	disable() {
		this._disconnect();
	}
	
	defineModConfig(modConfig) {
		modConfig.addString('address')
			.setName('WebSocket Address')
			.setDescription('Address of the OBS WebSocket on the network (defaults to "localhost")')
			.setAdvanced();
		modConfig.addNaturalNumber('port')
			.setName('WebSocket Port')
			.setDescription('Port for the OBS WebSocket on the network (defaults to 4444)')
			.setAdvanced();
		modConfig.addHiddenString('password')
			.setName('Password')
			.setDescription('Connection password for the socket (only necessary if you defined one in OBS)')
			.setAdvanced();
		
		modConfig.add(
			'obsFunctions',
			'DynamicArray',
			'ObsFunction')
			.setName('Functions')
			.setDescription('Functions for controlling OBS');
	}
	
	loadModConfig(conf) {
		if (!Utils.isKeyAndValueSubset(this.connectionSettings, conf)) {
			this.connectionSettings = {
				address: conf.address,
				port: conf.port,
				password: conf.password,
			};
			this._reconnect();
		}
		
		this._remakeFunctions(conf);
	}
}

module.exports = new ObsControl();
