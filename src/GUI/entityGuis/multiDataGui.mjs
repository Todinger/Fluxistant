import DataGui from "./dataGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class MultiDataGui extends DataGui {
	static get GUITYPE()    { return 'MultiData';                                                          }
	static get BUILDER()    { return (entity, guiID, modName) => new MultiDataGui(entity, guiID, modName); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.showingItem = false;
	}
	
	_makeContents() {
		let contents = $('<div class="uk-width-expand"></div>');
		let preview = this._makePreview();
		let uploadArea = this._makeUploadArea();
		contents.append(preview, uploadArea);
		
		return contents;
	}
	
	_showItem(data, name) {
		if (!this.showingItem) {
			this._showItemPreview(data);
			this._showItemName(name);
			this.showingItem = true;
		}
	}
	
	_hideItem() {
	}
}

GuiRegistry.register(MultiDataGui);
