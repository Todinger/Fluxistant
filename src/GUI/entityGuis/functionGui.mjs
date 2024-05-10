import ObjectGui from "./objectGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import MainManager from "../mainManager.mjs";

export default class FunctionGui extends ObjectGui {
	static get GUITYPE()    { return 'Function';                       }
	static get BUILDER()    { return (...p) => new FunctionGui(...p);  }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
	}
	
	_getHelpText() {
		return MainManager.getHelpFor(this.modName, this.entity);
	}
	
	get _responsesGUI() {
		return this.childrenGUIs['responses'];
	}
	
	_getMessageGUIs(responseGUI) {
		let messageGUIs = [];
		Object.values(responseGUI.optionGUIs).forEach(optionGUI => {
			if ('message' in optionGUI.childrenGUIs) {
				messageGUIs.push(optionGUI.childrenGUIs['message']);
			} else if ('messages' in optionGUI.childrenGUIs) {
				let childMessagesGUI = optionGUI.childrenGUIs['messages'];
				childMessagesGUI.on(
					'elementAdded',
					messageGUI => this._onMessageGUIAdded(messageGUI),
				);
				childMessagesGUI.elementGUIs.forEach(messageGUI => {
					messageGUIs.push(messageGUI);
				});
			}
		});
		return messageGUIs;
	}
	
	_updateResponseMessageGUIs(responseGUI, helpText) {
		let messageGUIs = this._getMessageGUIs(responseGUI);
		messageGUIs.forEach(messageGUI => {
			messageGUI.setHelpText(helpText);
		});
	}
	
	_refreshResponseGUIs() {
		let helpText = this._getHelpText();
		let responseGUIs = this._responsesGUI.elementGUIs;
		responseGUIs.forEach(responseGUI => {
			this._updateResponseMessageGUIs(responseGUI, helpText);
		});
	}

	_onMessageGUIAdded(messageGUI) {
		messageGUI.setHelpText(this._getHelpText());
	}
	
	_buildGUI() {
		let gui = super._buildGUI();
		
		this._refreshResponseGUIs();
		this.entity.eOnTriggersChanged(() => this._refreshResponseGUIs());
		this._responsesGUI.on('elementAdded', responseGUI => {
			this._updateResponseMessageGUIs(responseGUI, this._getHelpText());
		});

		return gui;
	}
}

GuiRegistry.register(FunctionGui);
