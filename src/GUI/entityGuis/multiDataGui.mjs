import DataGui from "./dataGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import { showError } from "../config.mjs";

export default class MultiDataGui extends DataGui {
	static get GUITYPE()    { return 'MultiData';                                                          }
	static get BUILDER()    { return (entity, guiID, modName) => new MultiDataGui(entity, guiID, modName); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.fileGrid = null;
		this.fileGuiComponents = {};
	}
	
	_deleteFile(fileKey, notifyChange) {
		super._deleteFile(fileKey, notifyChange);
		this.fileGuiComponents[fileKey].main.remove();
		delete this.fileGuiComponents[fileKey];
	}
	
	_loadFilesFromServer() {
		$.get(
			this._getFileURL(),
			(res) => {
				let files = JSON.parse(res).files;
				if (files) {
					files.forEach(file => {
						this._addFileDisplay(file);
					});
				}
			}
		)
	}
	
	_makeContents() {
		this.fileGrid = $(`<div class="uk-grid-match uk-child-width-1-2 uk-child-width-1-4@l uk-child-width-1-5@xl uk-text-center" uk-grid uk-scrollspy="cls: uk-animation-scale-up; target: .uk-card; delay: 80"></div>`);
		let uploadArea = this._makeUploadArea();
		uploadArea.append(this.fileGrid);
		
		return uploadArea;
	}
	
	_makeCardCloseButton(itemKey) {
		let span = $(`<span class="uk-position-absolute uk-transform-center uk-light uk-invisible-hover" style="left: 90%; top: 5%"></span>`);
		let deleteButton = $(`<button class="" type="button" uk-close></button>`);
		deleteButton.click(() => this._deleteFile(itemKey, true));
		
		span.append(deleteButton);
		return span;
	}
	
	_updateItemStatusIndicators(fileKey) {
		let guiComponents = this.fileGuiComponents[fileKey];
		guiComponents.entityGui._updateItemStatusIndicators(guiComponents.nameTag);
		MultiDataGui.updateCardStatusIndicator(guiComponents.main);
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
		
		let image = $(`<img src="${data}" alt="Error Displaying Image" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)">`);
		let closeButton = this._makeCardCloseButton(fileKey);
		let nameTag = $(`<span class="uk-text-meta uk-text-break uk-transition-slide-bottom-small uk-overlay uk-position-bottom uk-padding-small file-upload-name">${name}</span>`);
		
		this.fileGuiComponents[fileKey] = nameTag;
		
		card.append(image, closeButton, nameTag);
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
			this._changed();
			this._updateItemStatusIndicators(fileKey);
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
		
		return container;
	}
	
	_addFileDisplay(file) {
		if (file.fileKey in this.fileGuiComponents) {
			showError(`Duplicate file key: ${file.fileKey}`);
			return;
		}
		
		let newEntity = this.entity.createAndAddFile(file.fileKey);
		
		this.fileGuiComponents[file.fileKey] = {};
		let item = this._makeItem(
			file.data,
			file.name,
			newEntity);
		
		this.fileGuiComponents[file.fileKey].main = item;
		this.fileGrid.append(item);
	}
	
	_fileUploaded(savedFile) {
		this._addFileDisplay(savedFile);
	}
	
	_selfRemoved() {
		Object.keys(this.fileGuiComponents).forEach(fileKey => {
			this._deleteFile(fileKey, false);
		});
	}
	
	
	static updateCardStatusIndicator(jElement, changed, error) {
		if (error) {
			MultiDataGui.addCardErrorIndicator(jElement);
			MultiDataGui.clearCardChangeIndicator(jElement);
		} else if (changed) {
			MultiDataGui.addCardChangeIndicator(jElement);
			MultiDataGui.clearCardErrorIndicator(jElement);
		} else {
			MultiDataGui.clearCardErrorIndicator(jElement);
			MultiDataGui.clearCardChangeIndicator(jElement);
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

/*
<div id="multi-preview" class="uk-grid-match uk-child-width-1-2 uk-child-width-1-4@l uk-child-width-1-5@xl uk-text-center" uk-grid uk-scrollspy="cls: uk-animation-scale-up; target: .list-item; delay: 80">
	<!-- 3 (THIS ONE!) --><div>
		<a class="uk-card uk-card-secondary uk-card-hover uk-visible-toggle uk-transition-toggle" tabindex="0" href="#my-modal" uk-toggle>
			<img src="https://i.stack.imgur.com/1yMhJ.png?s=32" alt="Nope" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)">
			<span class="uk-position-absolute uk-transform-center uk-light uk-invisible-hover" style="left: 90%; top: 5%">
				<button id="axbtn" class="" type="button" uk-close></button>
			</span>
			<span class="uk-text-meta uk-text-break uk-transition-slide-bottom-small uk-overlay uk-position-bottom uk-padding-small file-upload-name">Bloop</span>
		</a>
		<!-- Modal --> <div id="my-modal" class="" uk-modal>
			<div class="uk-modal-dialog uk-modal-body uk-light uk-background-secondary">
				<button class="uk-modal-close-default" type="button" uk-close></button>
				<div>Contents here!</div>
			</div>
		</div>
	</div>
</div>
*/

GuiRegistry.register(MultiDataGui);
