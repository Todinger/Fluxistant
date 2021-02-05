import GuiRegistry from "./entityGuis/guiRegistry.mjs";

class Configurator {
	constructor() {
		this.socket = io();
		this.activeConfigs = {
			main: null,
			modules: null,
		}
		
		this.displayedConfig = {
			main: null,
			modules: null,
		}
		
		this.guis = {
			main: null,
			modules: null,
		}
	}
	
	buildPage() {
		let mainContainer = $('#main');
		mainContainer.empty();
		let mainGUI = GuiRegistry.buildGui(this.displayedConfig.main, 'main-contents', 'RawObject');
		mainContainer.append(mainGUI.getGUI());
		
		
		let moduleTabs = $('#modules-tabs');
		moduleTabs.empty();
		let allModulesContainer = $('#modules-contents');
		allModulesContainer.empty();
		if (this.displayedConfig.modules) {
			let moduleNames = Object.keys(this.displayedConfig.modules).sort();
			moduleNames.forEach(modName => {
				moduleTabs.append($(`<li><a href="#">${modName}</a></li>`));
				let moduleID = `mod-${modName}`;
				let moduleContainer = $(`<li id="${moduleID}"></li>`);
				let moduleGUI = GuiRegistry.buildGui(
					this.displayedConfig.modules[modName],
					moduleID,
					'RawObject');
				let moduleGUIContents = moduleGUI.getGUI();
				
				// The GUI construction method normally adds the GUI's ID as
				// the id attribute of the root element returned, but in this
				// case we'd rather have that on the container so we're
				// removing it from the constructed GUI object
				moduleGUIContents.removeAttr('id');
				
				moduleContainer.append(moduleGUIContents);
				allModulesContainer.append(moduleContainer);
			});
		}
	}
	
	copyConfigs(src, dest) {
		dest.main = src.main.clone();
		dest.modules = {};
		if (src.modules) {
			Object.keys(src.modules).forEach(modName => {
				dest.modules[modName] = src.modules[modName].clone();
			});
		}
	}
	
	createFromData(exportedData) {
		// let entity = EntityFactory.build('DynamicObject');
		// entity.importDesc(exportedData.descriptor);
		// // Entities.ConfigEntity.readEntity(exportedData);
		// // entity.import(exportedData);
		// return entity;
		
		let entity = Entities.ConfigEntity.buildEntity(exportedData);
		entity.import(exportedData);
		return entity;
	}
	
	loadConfigs(data) {
		if (data) {
			if (data.main) {
				this.activeConfigs.main = this.createFromData(data.main);
			}
			
			if (data.modules) {
				// WebStorm still thinks that data.modules can be null, so I added this
				// line which would obviously not do anything just to shut it up
				data.modules = data.modules || {};
				
				this.activeConfigs.modules = {};
				Object.keys(data.modules).forEach(modName => {
					this.activeConfigs.modules[modName] = this.createFromData(data.modules[modName]);
				});
			}
			
			this.copyConfigs(this.activeConfigs, this.displayedConfig);
			this.buildPage();
		}
	}
	
	saveConfigs() {
		this.socket.emit('saveConfig', this.displayedConfig.export());
	}
	
	configsSaved() {
		this.copyConfigs(this.displayedConfig, this.activeConfigs);
		// TODO: Show confirmation to user
	}
	
	start() {
		this.socket.on('loadConfig', data => this.loadConfigs(data));
		this.socket.on('configSaved', () => this.configsSaved());
		this.socket.emit('configRequest');
	}
}

let cfg = new Configurator();

$(document).ready(function() {
	cfg.start();
});

/*
Graph editing:
- https://github.com/d3/d3/wiki
- https://stackoverflow.com/questions/31221387/directed-graph-representation-in-html
- [!] https://bl.ocks.org/cjrd/6863459
- http://bl.ocks.org/rkirsling/5001347
- https://bl.ocks.org/d3noob/8375092
- https://observablehq.com/@d3/force-directed-graph

Useful components in UIKit:
- [!!] Accordion: expanding rows
- Animation: yay, animations!
- Button: button!
- Container: basic component? Used for alignment.
- Dropdown: for choice entities
- (?) Filter: allows filtering things out. Maybe to go together with a search if I implement one.
- (?) Grid: grid layout
- (?) Icon: might be nice to add in various places
- (?) Label: for making things. Not sure I need it at all.
- (?) List: Lists, possibly only text though
- [!] Nav: Expandable lists, for expanding anything with children
- (?) Navbar: Maybe as a general control panel or a crumb bar showing where we are
- (?) Search: if I want to implement searching at some point
- (?) Slider: for managing many modules in the list?
- Sortable: for dragging list items around
- Switcher: for changing between options (choice entity?)
- [!] Tab: for switching between modules
- (?) Toggle: for boolean values?
- Tooltip: display descriptions
- Transition: More animations
- (?) Upload: Could be useful interface for image selections
- Utility: Panel, Scrollable panel, Drag, Disabled, possibly also box shadows
- Visibility: for showing icons and such on hover or the like
*/
