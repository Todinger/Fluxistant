import AssetGui from "./assetGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import DataContentFactory from "./dataContents/dataContentFactory.mjs";
import { showError } from "../config.mjs";

export default class SingleAssetGui extends AssetGui {
	static get GUITYPE()    { return 'SingleData';                                                          }
	static get BUILDER()    { return (entity, guiID, modName) => new SingleAssetGui(entity, guiID, modName); }
	
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
				this._getFileURL([ this.entity.getFileKey() ]),
				(res) => {
					let files = JSON.parse(res).files || []; // Added the [] to shut the IDE up
					if (!files || files.length === 0) {
						showError('No file received from server.');
						return;
					}
					
					let file = files[0];
					this._showItem(file.data, file.name);
				}
			)
		}
	}
	
	_makeNameTag() {
		let outerSpan = $('<span class="uk-text-meta uk-text-break uk-width-auto file-upload-name"></span>');
		let innerSpan = $('<span class="uk-flex uk-flex-center uk-text-truncate"></span>');
		outerSpan.append(innerSpan);
		
		return {
			main: outerSpan,
			nameTag: innerSpan,
		};
	}
	
	_makeItemContainer(onDelete) {
		let container = $('<div class="uk-inline uk-flex uk-flex-center"></div>');
		let dataContent = DataContentFactory.build(this.entity.getDataType());
		let preview = dataContent.build();
		
		let deleteButtonContainer = $('<span class="uk-invisible-hover uk-position-absolute uk-transform-center" style="left: 90%; top: 10%">');
		let deleteButton = $('<button class="uk-invisible-hover" type="button" uk-close></button>');
		// deleteButton.click(() => this._deleteFile(true));
		deleteButton.click(onDelete);
		deleteButtonContainer.append(deleteButton);
		
		container.append(preview, deleteButtonContainer);
		return {
			main: container,
			dataContent: dataContent,
		};
	}
	
	_makePreview(onDeleteButtonClicked) {
		let previewContainer = $('<div class="uk-visible-toggle uk-flex uk-flex-column uk-width-auto uk-padding-remove" tabindex="-1" hidden></div>');
		
		let previewItemContainer = this._makeItemContainer(onDeleteButtonClicked);
		let nameTagContainer = this._makeNameTag();
		previewContainer.append(previewItemContainer.main, nameTagContainer.main);
		
		return {
			main: previewContainer,
			nameTag: nameTagContainer.nameTag,
			dataContent: previewItemContainer.dataContent,
		};
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

GuiRegistry.register(SingleAssetGui);
