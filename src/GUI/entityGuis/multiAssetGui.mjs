import EntityGui from "./entityGui.mjs";
import AssetGui from "./assetGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import { showError } from "../config.mjs";
import DataContentFactory from "./dataContents/dataContentFactory.mjs";

export default class MultiAssetGui extends AssetGui {
	static get GUITYPE()    { return 'MultiAsset';                                                          }
	static get BUILDER()    { return (entity, guiID, modName) => new MultiAssetGui(entity, guiID, modName); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.fileGrid = null;
		this.fileGuiComponents = {};
	}
	
	get singleFile() {
		return false;
	}
	
	_deleteFile(fileKey, notifyChange) {
		super._deleteFile(fileKey, notifyChange);
		this.entity.removeFile(fileKey);
		this.fileGuiComponents[fileKey].main.remove();
		delete this.fileGuiComponents[fileKey];
	}
	
	_deleteAllFiles() {
		Object.keys(this.fileGuiComponents).forEach(fileKey => {
			this._deleteFile(fileKey, false);
		});
		
		if (Object.keys(this.fileGuiComponents).length > 0) {
			this._changed();
		}
	}
	
	_loadFilesFromServer() {
		$.get(
			this._getFileURL(),
			(res) => {
				let files = JSON.parse(res).files;
				if (files) {
					files.forEach(file => {
						this._addFileDisplay(file, false);
					});
				}
			}
		)
	}
	
	_makeContents() {
		let container = $('<div style="position: relative"></div>');
		let uploadArea = this._makeUploadArea();
		container.append(uploadArea);
		
		let span = $(`<span style="position: absolute; left: 95%; top: 10px"></span>`);
		let deleteAllButton = $(`<a href="#" uk-icon="trash" uk-tooltip="Delete all files"></a>`);
		span.append(deleteAllButton);
		container.append(span);
		deleteAllButton.click(() => this._deleteAllFiles());
		
		this.fileGrid = $(`<div class="uk-margin-small-top uk-grid-match uk-child-width-1-2 uk-child-width-1-4@l uk-child-width-1-5@xl uk-text-center" uk-grid uk-scrollspy="cls: uk-animation-scale-up; target: .uk-card; delay: 80"></div>`);
		uploadArea.append(this.fileGrid);
		
		return container;
	}
	
	_makeCardCloseButton(itemKey) {
		let span = $(`<span class="uk-position-absolute uk-transform-center uk-light uk-invisible-hover" style="left: 90%; top: 5%"></span>`);
		let deleteButton = $(`<button class="" type="button" uk-close></button>`);
		deleteButton.click(() => this._deleteFile(itemKey, true));
		
		span.append(deleteButton);
		return span;
	}
	
	_clearItemStatusIndicators(fileKey) {
		let guiComponents = this.fileGuiComponents[fileKey];
		guiComponents.entityGui.finalizeChanges();
		EntityGui.clearChangeIndicator(guiComponents.nameTag);
		this._updateItemStatusIndicatorsFor(guiComponents.card, false, false);
	}
	
	_updateItemStatusIndicators(fileKey) {
		let guiComponents = this.fileGuiComponents[fileKey];
		guiComponents.entityGui._updateStatusIndicators(guiComponents.nameTag);
		this._updateItemStatusIndicatorsFor(guiComponents.card, this.changed, this.error);
	}
	
	_itemChanged(fileKey) {
		this._changed();
		this._updateItemStatusIndicators(fileKey);
	}
	
	_makeItemCard(data, name, itemEntity, itemModal) {
		let fileKey = itemEntity.getFileKey();
		let card;
		let cardAttributes = `class="uk-height-medium uk-card uk-card-secondary uk-card-hover uk-visible-toggle uk-transition-toggle" tabindex="0"`;
		if (itemModal) {
			card = $(`<a ${cardAttributes}></a>`);
			card.click(() => {
				UIkit.modal(itemModal).show();
			});
		} else {
			card = $(`<div ${cardAttributes}></div>`);
		}
		
		let dataContent = DataContentFactory.build(this.entity.getDataType());
		let content = dataContent.build();
		dataContent.fill(data);
		content.css({
			"position": "absolute",
			"top": "50%",
			"left": "50%",
			"transform": "translate(-50%, -50%)",
			"max-width": "100%",
		});
		
		// let acontent = $(`<img src="${data}" alt="Error Displaying Image" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)" uk-img>`);
		let closeButton = this._makeCardCloseButton(fileKey);
		let nameTag = $(`<span class="uk-margin uk-text-meta uk-text-break uk-transition-slide-bottom-small uk-overlay uk-position-bottom uk-padding-small file-upload-name">${name}</span>`);
		
		this.fileGuiComponents[fileKey].nameTag = nameTag;
		
		card.append(content, closeButton, nameTag);
		return card;
	}
	
	_makeItemModal(itemEntity) {
		let modal = $(`<div uk-modal></div>`);
		let modalDialog = $(`<div class="uk-modal-dialog uk-modal-body uk-margin-auto-vertical uk-light uk-background-secondary"></div>`);
		let closeButton = $(`<button class="uk-modal-close-default" type="button" uk-close></button>`);
		
		let fileKey = itemEntity.getFileKey();
		let entityGui = GuiRegistry.buildGui(
			itemEntity,
			`${this.guiID}-${fileKey}`,
			this.modName);
		entityGui.onChangedOrError(() => {
			this._itemChanged(fileKey);
		});
		
		modalDialog.append(closeButton, entityGui.getGUI());
		modal.append(modalDialog);
		this.fileGuiComponents[fileKey].entityGui = entityGui;
		return modal;
	}
	
	_makeItem(data, name, itemEntity) {
		let container = $(`<div></div>`);
		
		let itemModal;
		if (itemEntity.hasExtraData) {
			itemModal = this._makeItemModal(itemEntity);
		}
		
		let itemCard = this._makeItemCard(data, name, itemEntity, itemModal);
		container.append(itemCard);
		
		if (itemEntity.hasExtraData) {
			container.append(itemModal);
		}
		
		this.fileGuiComponents[itemEntity.getFileKey()].card = itemCard;
		return container;
	}
	
	_addFileDisplay(file, newFile) {
		if (file.fileKey && file.fileKey in this.fileGuiComponents) {
			showError(`Duplicate file key: ${file.fileKey}`);
			return;
		}
		
		let newEntity;
		if (newFile) {
			newEntity = this.entity.createAndAddFile(file.fileKey);
		} else {
			newEntity = this.entity.getFileElementByKey(file.fileKey);
			// Ignore images that aren't part of the configuration
			if (!newEntity) {
				return;
			}
		}
		
		this.fileGuiComponents[file.fileKey] = {};
		let item = this._makeItem(
			file.data,
			file.name,
			newEntity);
		
		if (newFile) {
			this._itemChanged(file.fileKey);
		}
		
		this.fileGuiComponents[file.fileKey].main = item;
		this.fileGrid.append(item);
	}
	
	_fileUploaded(savedFile) {
		this._addFileDisplay(savedFile, true);
	}
	
	_selfRemoved() {
		Object.keys(this.fileGuiComponents).forEach(fileKey => {
			this._deleteFile(fileKey, false);
		});
	}
	
	// Accept changes and remove change markers
	finalizeChanges() {
		Object.keys(this.fileGuiComponents).forEach(fileKey => {
			this._clearItemStatusIndicators(fileKey);
		});
	}
	
	
	_updateItemStatusIndicatorsFor(jElement, changed, error) {
		if (error) {
			MultiAssetGui.addCardErrorIndicator(jElement);
			MultiAssetGui.clearCardChangeIndicator(jElement);
		} else if (changed) {
			MultiAssetGui.addCardChangeIndicator(jElement);
			MultiAssetGui.clearCardErrorIndicator(jElement);
		} else {
			MultiAssetGui.clearCardErrorIndicator(jElement);
			MultiAssetGui.clearCardChangeIndicator(jElement);
		}
	}
	
	// Utility function for marking changes
	static addCardChangeIndicator(jElement) {
		jElement.addClass('status-changed');
	}
	
	// Utility function for unmarking changes
	static clearCardChangeIndicator(jElement) {
		jElement.removeClass('status-changed');
	}
	
	// Utility function for marking errors
	static addCardErrorIndicator(jElement) {
		jElement.addClass('status-error');
	}
	
	// Utility function for unmarking errors
	static clearCardErrorIndicator(jElement) {
		jElement.removeClass('status-error');
	}
}

GuiRegistry.register(MultiAssetGui);
