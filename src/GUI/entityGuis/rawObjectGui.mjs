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
import EntityGui from "./entityGui.mjs";

export default class RawObjectGui extends ObjectGui {
	static get GUITYPE()    { return 'RawObject';                                         }
	static get BUILDER()    { return (entity, guiID) => new RawObjectGui(entity, guiID);  }
	
	constructor(entity, guiID) {
		super(entity, guiID);
	}
	
	_contentsChanged() {
		// Skip the modification of the main GUI since we don't have one
		super._changed();
	}
	
	_buildChildEntry(childGui, childLabeledContainer) {
		return childLabeledContainer;
	}
	
	_buildGUI() {
		return this._buildChildrenContainer();
	}
	
	// Clear the indication that this value has been changed
	clearChangedIndicators() {
		Object.keys(this.childrenGUIs).forEach(key => {
			this.childrenGUIs[key].clearChangedIndicators();
			if (!this.childrenGUIs[key].isContainer) {
				EntityGui.clearChangeIndicator(
					this.childrenEntries[key].guiData.label);
			}
		});
	}
}

GuiRegistry.register(RawObjectGui);