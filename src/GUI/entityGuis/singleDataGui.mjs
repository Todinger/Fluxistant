import DataGui from "./dataGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class SingleDataGui extends DataGui {
	static get GUITYPE()    { return 'Data';                                                                }
	static get BUILDER()    { return (entity, guiID, modName) => new SingleDataGui(entity, guiID, modName); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.showingItem = false;
		this.toggler = null;
		this.preview = null;
	}
	
	_deleteFile(savedFile, notifyChange) {
		this.entity.clearKey();
		this._hideItem();
		this._clearItem();
		super._deleteFile(savedFile, notifyChange);
	}
	
	_loadFilesFromServer() {
		if (this.entity.isSet()) {
			$.get(
				this._getFileURL(this.entity.getFileKey()),
				(res) => {
					let file = JSON.parse(res);
					this._showItem(file.data, file.name);
				}
			)
		}
	}
	
	_showItemPreview(data) {
		this.preview.dataContent.fill(data);
	}
	
	_showItemName(itemName) {
		this.preview.nameTag.text(itemName);
	}
	
	_clearItemPreview() {
		this.preview.dataContent.clear();
	}
	
	_clearItemName() {
		this.preview.nameTag.text('');
	}
	
	_clearItem() {
		this._clearItemPreview();
		this._clearItemName();
	}
	
	_makeContents() {
		let contents = $('<div class="uk-width-expand"></div>');
		let toggleButton = $('<button class="uk-button uk-button-default" type="button" uk-toggle="target: ~ *" hidden></button>');
		this.preview = this._makePreview(() => this._deleteFile(this.entity.getFileKey(), true));
		let uploadArea = this._makeUploadArea();
		contents.append(toggleButton, this.preview.main, uploadArea);
		
		this.toggler = toggleButton;
		return contents;
	}
	
	_toggleView() {
		UIkit.toggle(this.toggler).toggle();
	}
	
	_showItem(data, name) {
		if (!this.showingItem) {
			this._showItemPreview(data);
			this._showItemName(name);
			this._toggleView();
			this.showingItem = true;
		}
	}
	
	_hideItem() {
		if (this.showingItem) {
			this._toggleView();
			this.showingItem = false;
		}
	}
	
	_fileUploaded(savedFile) {
		this.entity.setFileKey(savedFile.fileKey);
		this._showItem(savedFile.data, savedFile.name);
	}
	
	_selfRemoved() {
		this._deleteFile(this.entity.getFileKey(), false);
	}
}

GuiRegistry.register(SingleDataGui);
