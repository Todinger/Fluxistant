// This is actually exactly the same as the GUI for an object, with two differences:
// 1. No child markers for the properties.
// 2. No header folder it opens from.
//
// It's meant for places where the entity being configured is an object, but we don't
// want to show it as a "parent title + children" kind of thing.
// This is used for the top level of a configuration object (main config / modules)
// and for choice entities, where the "title" is the choice selection.

import ObjectGui from "./objectGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import GuiElements from "./guiElements/guiElements.mjs";

export default class CommandGui extends ObjectGui {
	static get GUITYPE()    { return 'Command';                                         }
	static get BUILDER()    { return (entity, guiID) => new CommandGui(entity, guiID);  }
	
	constructor(entity, guiID) {
		super(entity, guiID);
	}
	
	_getName() {
		let name = this.entity.getName();
		if (!name || name === '') {
			name = this.entity.getCmdName();
		}
		
		return name;
	}
	
	_buildGUI() {
		let childrenContainer = this._buildChildrenContainer();
		
		
		this.mainGui = GuiElements.folder({
			header: this._getName(),
			contents: childrenContainer,
			tooltip: this.entity.getDescription(),
		});
		
		this.childrenGUIs['cmdname'].onChanged(() => {
			this.mainGui.guiData.header.text(this._getName());
		});
		
		return this.mainGui;
	}
}

GuiRegistry.register(CommandGui);
