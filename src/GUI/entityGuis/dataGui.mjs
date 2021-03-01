import EntityGui from "./entityGui.mjs";
import DataContentRegistry from "./dataContents/dataContentFactory.mjs";

export default class DataGui extends EntityGui {
	static get GUITYPE()    { return null; }   // Abstract class, should not be instantiated
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.showingItem = false;
		this.dataContent = null;
	}
	
	_getFileKey() {
		return this.entity.getID();
	}
	
	_getCollectionURL() {
		return `/data/mod/${this.modName}/${this.entity.getCollectionID()}`;
	}
	
	_getFileURL() {
		return `${this._getCollectionURL()}/${this._getFileKey()}`;
	}
	
	_sendDeleteRequest() {
		let xHttp = new XMLHttpRequest();
		xHttp.open('DELETE', this._getFileURL(), true);
		xHttp.send();
	}
	
	_deleteFile(notifyChange) {
		this.entity.clear();
		this._hideItem();
		this._sendDeleteRequest();
		this._clearItem();
		if (notifyChange) {
			this._changed();
		}
	}
	
	_loadFileFromServer() {
		$.get(
			this._getFileURL(),
			(res) => {
				let file = JSON.parse(res);
				this._showItem(file.data, file.name);
			}
		)
	}
	
	_makeItemPreview() {
		// TODO: Move to image-specific object
		// this.dataContent =  $('<img alt="" src="" uk-img>');
		// this.dataContent = PREVIEW_BUILDERS[this.entity.getDataType()](container);
		this.dataContent = DataContentRegistry.build(this.entity.getDataType());
		return this.dataContent.build();
	}
	
	_makeNameTag() {
		let outerSpan = $('<span class="uk-text-meta uk-text-break uk-width-auto file-upload-name"></span>');
		let innerSpan = $('<span class="uk-flex uk-flex-center uk-text-truncate"></span>');
		outerSpan.append(innerSpan);
		
		this.nameTag = innerSpan;
		
		return outerSpan;
	}
	
	_showItemPreview(data) {
		this.dataContent.fill(data);
	}
	
	_showItemName(itemName) {
		this.nameTag.text(itemName);
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
	
	_clearItemPreview() {
		this.dataContent.clear();
	}
	
	_clearItemName() {
		this.nameTag.text('');
	}
	
	_clearItem() {
		this._clearItemPreview();
		this._clearItemName();
	}
	
	_makeItemContainer() {
		let container = $('<div class="uk-inline uk-flex uk-flex-center"></div>');
		let preview = this._makeItemPreview();
		
		let deleteButtonContainer = $('<span class="uk-invisible-hover uk-position-absolute uk-transform-center" style="left: 90%; top: 10%">');
		let deleteButton = $('<button class="uk-invisible-hover" type="button" uk-close></button>');
		deleteButton.click(() => this._deleteFile(true));
		deleteButtonContainer.append(deleteButton);
		
		container.append(preview, deleteButtonContainer);
		return container;
	}
	
	_makePreview() {
		let previewContainer = $('<div class="uk-visible-toggle uk-flex uk-flex-column uk-width-auto uk-padding-remove" tabindex="-1" hidden></div>');
		
		let previewItemContainer = this._makeItemContainer();
		let nameTag = this._makeNameTag();
		previewContainer.append(previewItemContainer, nameTag);
		
		return previewContainer;
	}
	/*
			<div class="uk-visible-toggle" tabindex="-1" hidden>
				<div class="uk-flex uk-flex-column uk-width-small uk-padding-remove">
					<div class="uk-inline">
						<img id="upload-image" class="uk-width-small" alt="" src="" uk-img>
						<span class="uk-invisible-hover uk-position-absolute uk-transform-center" style="left: 90%; top: 10%">
							<button id="xbtn" class="uk-invisible-hover" type="button" uk-close></button>
						</span>
					</div>
					<span class="uk-text-meta uk-text-break uk-width-small file-upload-name">
						<span id="imgNameTag" class="uk-flex uk-flex-center uk-text-truncate"></span>
					</span>
				</div>
			</div>
	 */
	
	_makeUploadInput() {
		// TODO: Move to concrete subclasses for single/multiple uploads
		return $('<input type="file" multiple>');
	}
	
	_makeUploadArea() {
		let areaContainer = $('<div class="js-upload uk-placeholder uk-text-center uk-margin-remove"></div>');
		let icon = $('<span uk-icon="icon: upload"></span>');
		let text = $('<span class="uk-text-middle">Upload image by dropping it here or </span>');
		
		let uploadForm = $('<div id="uploader" uk-form-custom></div>');
		let uploadInput = this._makeUploadInput();
		let uploadLink = $('<span class="uk-link">selecting one</span>');
		uploadForm.append(uploadInput, uploadLink, '.'); // Include end-of-sentence period
		this._createUploader(uploadForm);
		
		areaContainer.append(icon, text, uploadForm);
		return areaContainer;
	}
	
	_makeContents() {
		let contents = $('<div class="uk-width-expand"></div>');
		let toggleButton = $('<button class="uk-button uk-button-default" type="button" uk-toggle="target: ~ *" hidden></button>');
		let preview = this._makePreview();
		let uploadArea = this._makeUploadArea();
		contents.append(toggleButton, preview, uploadArea);
		
		this.toggler = toggleButton;
		return contents;
/*
		<div class="uk-width-expand">
			<button id="upload-toggler" class="uk-button uk-button-default" type="button" uk-toggle="target: ~ *" hidden></button>
			
			<div class="uk-visible-toggle" tabindex="-1" hidden>
				<div>
					<img id="upload-image" alt="" src="" uk-img>
					<span class="uk-invisible-hover uk-width-auto uk-padding-remove">
						<button id="xbtn" class="uk-invisible-hover" type="button" uk-close></button>
					</span>
				</div>
				<span id="imgNameTag" class="uk-text-meta uk-text-break file-upload-name"></span>
			</div>
			
			<div class="uk-visible-toggle" tabindex="-1" hidden>
				<div class="uk-flex uk-flex-column uk-width-small uk-padding-remove">
					<div class="uk-inline">
						<img id="upload-image" class="uk-width-small" alt="" src="" uk-img>
						<span class="uk-invisible-hover uk-position-absolute uk-transform-center uk-light" style="left: 90%; top: 10%">
							<button id="xbtn" class="uk-invisible-hover" type="button" uk-close></button>
						</span>
					</div>
					<span class="uk-text-meta uk-text-break uk-width-small file-upload-name">
						<span id="imgNameTag" class="uk-flex uk-flex-center uk-text-truncate"></span>
					</span>
				</div>
			</div>
			
			
			<div class="js-upload uk-placeholder uk-text-center uk-margin-remove">
				<span uk-icon="icon: upload"></span>
				<span class="uk-text-middle">Upload image by dropping it here or</span>
				<div id="uploader" uk-form-custom>
					<input type="file" multiple>
					<span class="uk-link">selecting one</span>.
				</div>
			</div>
		</div>
 */
	}
	
	_makeProgressBar() {
		this.progressBar = $('<progress id="js-progressbar" class="uk-progress" value="0" max="100" hidden></progress>');
		return this.progressBar;
	}
	
	_toggleView() {
		UIkit.toggle(this.toggler).toggle();
	}
	
	_createUploader(uploadForm) {
		let _this = this;
		window.up = UIkit.upload(uploadForm, {
			url: _this._getCollectionURL(),
			name: this._getFileKey(),
			multiple: true,
			
			completeAll: function() {
				setTimeout(function () {
					_this.progressBar.attr('hidden', 'hidden');
				}, 1000);
				
				// _this._toggleView();
				_this._changed();
			},
			
			complete: function(req) {
				let files = JSON.parse(req.response);
				let file = files[_this._getFileKey()];
				let fileName = file.name;
				
				_this.entity.set();
				_this._showItem(file.data, fileName);
			},
			
			loadStart: function (e) {
				_this.progressBar.removeAttr('hidden');
				_this.progressBar.max = e.total;
				_this.progressBar.value = e.loaded;
			},
			
			progress: function (e) {
				_this.progressBar.max = e.total;
				_this.progressBar.value = e.loaded;
			},
			
			loadEnd: function (e) {
				_this.progressBar.max = e.total;
				_this.progressBar.value = e.loaded;
			},
		});
	}
	
	_buildGUI() {
		let fullResult = $(`<div id="${this.guiID}"></div>`);
		let contents = this._makeContents();
		let progressBar = this._makeProgressBar();
		fullResult.append(contents, progressBar);
		
		fullResult.on('remove', () => this._deleteFile(false));
		
		if (this.entity.isSet()) {
			this._loadFileFromServer();
		}
		
		return fullResult;
	}
	
	/*
	<div>
		<div class="uk-width-expand">
			<button id="upload-toggler" class="uk-button uk-button-default" type="button" uk-toggle="target: ~ *" hidden></button>
			<div class="uk-visible-toggle" tabindex="-1" hidden>
				<div>
					<div class="uk-flex uk-flex-column uk-width-small uk-padding-remove">
						<div class="uk-inline">
							<img id="upload-image" class="uk-width-small" alt="" src="" uk-img>
							<span class="uk-invisible-hover uk-position-absolute uk-transform-center uk-light" style="left: 90%; top: 10%">
								<button id="xbtn" class="uk-invisible-hover" type="button" uk-close></button>
							</span>
						</div>
						<span class="uk-text-meta uk-text-break uk-width-small file-upload-name">
							<span id="imgNameTag" class="uk-flex uk-flex-center uk-text-truncate"></span>
						</span>
					</div>
				</div>
			</div>
			<div class="js-upload uk-placeholder uk-text-center uk-margin-remove">
				<span uk-icon="icon: upload"></span>
				<span class="uk-text-middle">Upload image by dropping it here or</span>
				<div id="uploader" uk-form-custom>
					<input type="file" multiple>
					<span class="uk-link">selecting one</span>.
				</div>
			</div>
		</div>
		<progress id="js-progressbar" class="uk-progress" value="0" max="100" hidden></progress>
	</div>
	*/
}
