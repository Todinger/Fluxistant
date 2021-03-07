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
	
	_getCollectionURL() {
		return `/data/mod/${this.modName}/${this.entity.getCollectionID()}`;
	}
	
	_getFileURL(fileKey) {
		let url = this._getCollectionURL();
		if (fileKey) {
			url += `?fileKey=${fileKey}`;
		}
		
		return url;
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
	
	_makeUploadInput() {
		// TODO: Move to concrete subclasses for single/multiple uploads
		return $(`<input type="file" multiple accept="${DataContentRegistry.getMimeType(this.entity.getDataType())}">`);
	}
	
	_makeUploadArea() {
		let areaContainer = $('<div class="js-upload uk-placeholder uk-text-center uk-margin-remove"></div>');
		let icon = $('<span uk-icon="icon: upload"></span>');
		let text = $(`<span class="uk-text-middle">Upload ${this.entity.getDataType().toLowerCase()} by dropping it here or </span>`);
		
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
		
		fullResult.attr('id', this.guiID);
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
