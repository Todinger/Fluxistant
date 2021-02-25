import EntityGui from "./entityGui.mjs";

export default class DataGui extends EntityGui {
	static get GUITYPE()    { return null; }   // Abstract class, should not be instantiated
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
	}
	
	// This should create our this.jInput variable and set it up to detect and react to changes
	_setupInput() {
		throw 'Abstract method invoked.';
	}
	
	_guiValueChanged(newValue) {
		this.entity.setValue(newValue);
		this._changed();
		this._updateStatusIndicators(this.jInput);
	}
	
	_getFileKey() {
		return this.entity.getID();
	}
	
	_makeItemPreview() {
		// TODO: Move to image-specific object
		this.itemPreview =  $('<img alt="" src="" uk-img>');
		return this.itemPreview;
	}
	
	_makeNameTag() {
		let outerSpan = $('<span class="uk-text-meta uk-text-break uk-width-small file-upload-name"></span>');
		let innerSpan = $('<span class="uk-flex uk-flex-center uk-text-truncate"></span>');
		outerSpan.append(innerSpan);
		
		this.nameTag = innerSpan;
		
		return outerSpan;
	}
	
	_showItemPreview(contentType, data) {
		this.itemPreview.attr('src', `data:${contentType}; base64,${data}`);
	}
	
	_showItemName(itemName) {
		this.nameTag.text(itemName);
	}
	
	_makeItemContainer() {
		let container = $('<div class="uk-inline"></div>');
		let preview = this._makeItemPreview();
		
		let deleteButtonContainer = $('<span class="uk-invisible-hover uk-position-absolute uk-transform-center" style="left: 90%; top: 10%">');
		let deleteButton = $('<button class="uk-invisible-hover" type="button" uk-close></button>');
		deleteButtonContainer.append(deleteButton);
		
		container.append(preview, deleteButtonContainer);
		return container;
	}
	
	_makePreview() {
		let previewContainer = $('<div class="uk-visible-toggle uk-flex uk-flex-column uk-width-small uk-padding-remove" tabindex="-1" hidden></div>');
		
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
		let text = $('<span class="uk-text-middle">Upload image by dropping it here or</span>');
		
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
			url: `/data/mod/${this.modName}/${this.entity.getCollectionID()}`,
			name: this._getFileKey(),
			multiple: true,
			
			completeAll: function() {
				setTimeout(function () {
					_this.progressBar.setAttribute('hidden', 'hidden');
				}, 1000);
				
				_this._toggleView();
			},
			
			complete: function(req) {
				let files = JSON.parse(req.response);
				let contentType = req.getResponseHeader('content-type');
				let fileName = files.dataFile.name;
				
				_this._showItemPreview(contentType, files.dataFile.data);
				_this._showItemName(fileName);
			},
			
			loadStart: function (e) {
				console.log('loadStart', arguments);
				
				_this.progressBar.removeAttribute('hidden');
				_this.progressBar.max = e.total;
				_this.progressBar.value = e.loaded;
			},
			
			progress: function (e) {
				console.log('progress', arguments);
				
				_this.progressBar.max = e.total;
				_this.progressBar.value = e.loaded;
			},
			
			loadEnd: function (e) {
				console.log('loadEnd', arguments);
				
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
