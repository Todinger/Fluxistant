import GuiRegistry from "./entityGuis/guiRegistry.mjs";
import EntityGui from "./entityGuis/entityGui.mjs";
import MainManager from "./mainManager.mjs";
import SourceManager from "./sourceManager.mjs";

function setStyleRule(sheetName, selector, property, value) {
	let styleSheet = document.querySelector('link[href*=' + sheetName + ']')
	
	if (styleSheet){
		let rule = Object.values(styleSheet.sheet.rules).filter(rule => rule.selectorText === selector)[0];
		if (value !== undefined) {
			rule.style[property] = value;
		} else {
			delete rule.style[property];
		}
	}
}

function setAdvancedVisibility(value) {
	setStyleRule('cfg', '.advanced', 'display', value);
}

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
			tabTitles: null,
		}
		
		this.error = false;
	}
	
	init() {
		MainManager.init(this);
		
		this.loadingSwitcher = $('#loadingSwitcher');
		this.loadingProgress = $('#loadingProgress');
		$('#btn-apply').click(() => this.applyButtonClicked());
		$('#btn-revert').click(() => this.revertButtonClicked());
		$('#chk-advanced').change(function() {
			if (this.checked) {
				setAdvancedVisibility('');
			} else {
				setAdvancedVisibility('none');
			}
		});
		
		this.configViewSwitcher = $('#configViewSwitcher');
		this.mainTabTitle = $('#mainTabTitle');
		this.allModulesTabTitle = $('#modulesTabTitle');
		
		this.question = {
			modal: $('#question'),
			title: $('#question-title'),
			body: $('#question-body'),
			buttons: $('#question-buttons'),
		};
		
		this.rewardsChangedHandler = () => this.rewardsChanged();
	}
	
	disableButton(btn) {
		btn.addClass('uk-text-muted');
		btn.attr('disabled', '');
	}
	
	enableButton(btn) {
		btn.removeAttr('disabled');
		btn.removeClass('uk-text-muted');
	}
	
	applyButtonClicked() {
		let error = this.guis.main.error;
		error = Object.values(this.guis.modules).reduce((soFar, modGui) => soFar || modGui.error, error);
		if (error) {
			this.showError('Please fix all errors before saving the configuration.');
		} else {
			this.saveConfigs();
		}
	}
	
	revertButtonClicked() {
		this.buildPageFromActive();
		this.updateStatusIndicators();
	}
	
	updateStatusIndicators() {
		this.guis.main._updateStatusIndicators(this.mainTabTitle);
		let modsChanged = false;
		let modsError = false;
		Object.keys(this.guis.modules).forEach(modName => {
			this.guis.modules[modName]._updateStatusIndicators(this.guis.tabTitles[modName]);
			modsChanged = modsChanged || this.guis.modules[modName].changed;
			modsError = modsError || this.guis.modules[modName].error;
		});
		
		EntityGui.updateStatusIndicator(this.allModulesTabTitle, modsChanged, modsError);
	}
	
	clearTabChangeIndicators() {
		EntityGui.clearChangeIndicator(this.mainTabTitle);
		EntityGui.clearChangeIndicator(this.allModulesTabTitle);
	}
	
	finalizeContentChanges() {
		this.guis.main.finalizeChanges();
		Object.keys(this.guis.modules).forEach(modName => {
			this.guis.modules[modName].finalizeChanges();
			EntityGui.clearChangeIndicator(this.guis.tabTitles[modName]);
		});
	}
	
	finalizeChanges() {
		this.clearTabChangeIndicators();
		this.finalizeContentChanges();
	}
	
	showMain() {
		UIkit.switcher(this.configViewSwitcher).show(0);
	}
	
	showError(message) {
		UIkit.notification({
			message: `<span uk-icon=\'icon: close\'></span> ${message}`,
			status: 'danger',
			timeout: 5000,
		});
	}
	
	showQuestion(details) {
		this.question.title.text(details.title);
		this.question.body.text(details.body);
		this.question.buttons.empty();
		UIkit.modal(this.question.modal).show();
		return new Promise((resolve) => {
			details.options.forEach(option => {
				let optionText = option, buttonClass = 'uk-button-default';
				if (typeof option === 'object') {
					optionText = option.text;
					buttonClass = option.cls;
				}
				
				let optionButton = $(`<button class="uk-button ${buttonClass} uk-modal-close uk-margin-small-right uk-margin-small-left" type="button"></button>`)
					.text(optionText)
					.click(() => resolve(optionText));
				this.question.buttons.append(optionButton);
			});
		});
	}
	
	buildPage() {
		UIkit.switcher(this.loadingSwitcher).show(0);
		
		if (this.guis.main) {
			this.guis.main.getChildGui('channelRewards').removeChangedHandler(this.rewardsChangedHandler);
		}
		
		let mainContainer = $('#main');
		mainContainer.empty();
		let mainGUI = GuiRegistry.buildGui(this.displayedConfig.main, 'main-contents', null, 'RawObject');
		mainContainer.append(mainGUI.getGUI());
		mainGUI.onChanged(() => mainGUI._updateStatusIndicators(this.mainTabTitle));
		mainGUI.onError((err) => {
			mainGUI._updateStatusIndicators(this.mainTabTitle);
			this.showError(err.message || err);
		});
		this.guis.main = mainGUI;
		this.guis.main.getChildGui('channelRewards').onChanged(this.rewardsChangedHandler);
		
		this.guis.modules = {};
		this.guis.tabTitles = {};
		let moduleTabs = $('#modules-tabs');
		moduleTabs.empty();
		let allModulesContainer = $('#modules-contents');
		allModulesContainer.empty();
		if (this.displayedConfig.modules) {
			let moduleNames = Object.keys(this.displayedConfig.modules).sort();
			moduleNames.forEach(modName => {
				let moduleTabTitle = $(`<a href="#">${modName}</a>`);
				let moduleTabItem = $(`<li></li>`);
				moduleTabItem.append(moduleTabTitle);
				moduleTabs.append(moduleTabItem);
				
				let moduleID = `mod-${modName}`;
				let moduleContainer = $(`<li id="${moduleID}"></li>`);
				let moduleGUI = GuiRegistry.buildGui(
					this.displayedConfig.modules[modName],
					moduleID,
					modName,
					'RawObject');
				let moduleGUIContents = moduleGUI.getGUI();
				moduleGUI.onChanged(() => this.updateStatusIndicators());
				moduleGUI.onError((err) => {
					this.updateStatusIndicators();
					this.showError(err.message);
				});
				this.guis.modules[modName] = moduleGUI;
				this.guis.tabTitles[modName] = moduleTabTitle;
				
				// The GUI construction method normally adds the GUI's ID as
				// the id attribute of the root element returned, but in this
				// case we'd rather have that on the container so we're
				// removing it from the constructed GUI object
				moduleGUIContents.removeAttr('id');
				
				moduleContainer.append(moduleGUIContents);
				allModulesContainer.append(moduleContainer);
			});
		}
		
		this.clearTabChangeIndicators();
		setTimeout(
			() => UIkit.switcher(this.loadingSwitcher).show(1),
			100);
	}
	
	copyConfigs(src, dest) {
		dest.main = src.main.clone();
		
		dest.modules = {};
		let mods = src.modules || {};
		Object.keys(src.modules).forEach(modName => {
			dest.modules[modName] = mods[modName].clone();
		});
	}
	
	buildPageFromActive() {
		UIkit.switcher(this.loadingSwitcher).show(0);
		setTimeout(
			() => {
				this.copyConfigs(this.activeConfigs, this.displayedConfig);
				this.buildPage();
				$(document).trigger('configReady');
				this.showMain();
			},
			100);
	}
	
	createFromData(exportedData, id) {
		// let entity = EntityFactory.build('DynamicObject');
		// entity.importDesc(exportedData.descriptor);
		// // Entities.ConfigEntity.readEntity(exportedData);
		// // entity.import(exportedData);
		// return entity;
		
		let entity = Entities.ConfigEntity.buildEntity(exportedData, id);
		entity.import(exportedData);
		return entity;
	}
	
	exportConfigs(cfg) {
		let main = cfg.main.export();
		
		let modules = {};
		let cfgMods = cfg.modules || {};
		Object.keys(cfg.modules).forEach(modName => {
			modules[modName] = cfgMods[modName].export();
		});
		
		return { main, modules };
	}
	
	loadConfigs(data) {
		if (data) {
			if (data.main) {
				this.activeConfigs.main = this.createFromData(data.main, 'main');
			}
			
			if (data.modules) {
				// WebStorm still thinks that data.modules can be null, so I added this
				// line which would obviously not do anything just to shut it up
				data.modules = data.modules || {};
				
				this.activeConfigs.modules = {};
				Object.keys(data.modules).forEach(modName => {
					this.activeConfigs.modules[modName] = this.createFromData(data.modules[modName], `mod.${modName}`);
				});
			}
			
			this.buildPageFromActive();
		}
	}
	
	saveConfigs() {
		this.socket.emit('saveConfig', this.exportConfigs(this.displayedConfig));
	}
	
	configsSaved() {
		this.copyConfigs(this.displayedConfig, this.activeConfigs);
		this.finalizeChanges();
		UIkit.notification({
			message: '<span uk-icon=\'icon: check\'></span> Configuration saved',
			status: 'success',
			timeout: 5000,
		});
	}
	
	saveError(error) {
		let errorMessage;
		if (error.path) {
			errorMessage = error.path.join(' > ');
			errorMessage = `${errorMessage}: ${error.message}`;
		} else {
			errorMessage = error.message;
		}
		
		this.showError(errorMessage);
	}
	
	listenForReward() {
		this.socket.emit('listenForReward');
	}
	
	stopListeningForReward() {
		this.socket.emit('stopListeningForReward');
	}
	
	rewardRedeemed(details) {
		if (MainManager.isListeningForReward()) {
			this.showQuestion({
				title: 'Channel Reward Selection',
				body: `A channel reward was just redeemed on your channel by ${details.user} with the message: "${details.message}" - is this the channel reward you wish to set?`,
				options: [
					{
						text: 'Yes',
						cls: 'uk-button-primary',
					},
					{
						text: 'No',
						cls: 'uk-button-secondary',
					},
					{
						text: 'Cancel',
						cls: 'uk-button-danger',
					},
				]
			}).then(answer => {
				if (answer === 'Yes') {
					this.socket.emit('stopListeningForReward');
					MainManager.rewardRedeemed(details.rewardID);
				} else if (answer === 'Cancel') {
					this.socket.emit('stopListeningForReward');
					MainManager.stopListeningForReward();
				}
				// If they selected 'No' then we don't need to do anything - continue listening
			});
		}
	}
	
	getRewardsList() {
		if (this.displayedConfig.main) {
			return this.displayedConfig.main
				.getChild('channelRewards')
				.getElements()
				.map(el => el.toConf());
		} else {
			return [];
		}
	}
	
	rewardsChanged() {
		MainManager.rewardsChanged();
	}
	
	start() {
		this.socket.on('loadConfig', data => this.loadConfigs(data));
		this.socket.on('configSaved', () => this.configsSaved());
		this.socket.on('configSaveError', error => this.saveError(error));
		this.socket.on('rewardRedeemed', details => this.rewardRedeemed(details));
		this.socket.on('helpData', helpData => MainManager.setHelpData(helpData));
		this.socket.on('sourceChanged', data => SourceManager.setSourceOptions(data.source, data.options));
		this.socket.on('allSources', sources => SourceManager.setSources(sources));
		
		this.socket.emit('getHelpData');
		this.socket.emit('getSources');
		this.socket.emit('configRequest');
	}
}

let cfg = new Configurator();

$(document).ready(function() {
	cfg.init();
	cfg.start();
});

// TODO: Remove
window.cfg = cfg;

function showError(...params) {
	return cfg.showError(...params);
}

export {
	showError,
};


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
