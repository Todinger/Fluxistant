import EntityGui from "./entityGui.mjs";
import DataContentRegistry from "./dataContents/dataContentFactory.mjs";
import { showError } from "../config.mjs";

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
	
	_getFileURL(fileKey) {
		return `${this._getCollectionURL()}?fileKey=${fileKey}`;
	}
	
	_sendDeleteRequest(fileKey) {
		let xHttp = new XMLHttpRequest();
		xHttp.open('DELETE', this._getFileURL(fileKey), true);
		xHttp.send();
	}
	
	_deleteFile(fileKey, notifyChange) {
		if (fileKey) {
			this._sendDeleteRequest(fileKey);
			if (notifyChange) {
				this._changed();
			}
		}
	}
	
	_loadFilesFromServer() {
		throw 'Abstract method invoked.';
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
		let dataContent = DataContentRegistry.build(this.entity.getDataType());
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
		return $(`<input type="file" multiple accept="${DataContentRegistry.getMimeType(this.entity.getDataType())}">`);
	}
	
	_makeUploadArea() {
		let areaContainer = $('<div class="js-upload uk-placeholder uk-text-center uk-margin-remove"></div>');
		let icon = $('<span uk-icon="icon: upload"></span>');
		let text = $('<span class="uk-text-middle">Upload image by dropping it here or </span>');
		
		let uploadForm = $('<div uk-form-custom></div>');
		let uploadInput = this._makeUploadInput();
		let uploadLink = $('<span class="uk-link">selecting one</span>');
		uploadForm.append(uploadInput, uploadLink, '.'); // Include end-of-sentence period
		this._createUploader(areaContainer);
		
		areaContainer.append(icon, text, uploadForm);
		return areaContainer;
	}
	
	_makeContents() {
		throw 'Abstract function called.';
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
	
	_fileUploaded(savedFile) {
		throw 'Abstract method invoked.';
	}
	
	_createUploader(uploadForm) {
		let _this = this;
		window.up = UIkit.upload(uploadForm, {
			url: _this._getCollectionURL(),
			name: 'fileUpload',
			multiple: true,
			// allow: _this.dataContent.allowedTypes,
			// ["cls-dragover"]: _this.dataContent.allowedTypes,
			mime: DataContentRegistry.getMimeType(this.entity.getDataType()),
			
			completeAll: function() {
				setTimeout(function () {
					_this.progressBar.attr('hidden', 'hidden');
				}, 1000);
				
				// _this._toggleView();
				_this._changed();
			},
			
			complete: function(req) {
				let files = JSON.parse(req.response);
				// let file = files[_this._getFileKey()];
				let file = files['fileUpload'];
				if (file.success) {
					_this._fileUploaded(file);
				} else {
					showError(file.err);
				}
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
	
	_selfRemoved() {
		throw 'Abstract method invoked.';
	}
	
	_buildGUI() {
		let fullResult = $(`<div id="${this.guiID}"></div>`);
		let contents = this._makeContents();
		let progressBar = this._makeProgressBar();
		fullResult.append(contents, progressBar);
		
		fullResult.on('remove', () => this._selfRemoved());
		
		this._loadFilesFromServer();
		
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
