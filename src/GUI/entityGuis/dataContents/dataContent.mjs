
export default class DataContent {
	static get CONTENT_TYPE()   { return null;  }   // Abstract type, do not instantiate
	
	constructor() {
		this.components = null;
	}
	
	build() {
		if (!this.components) {
			this.components = this._buildAll();
		}
		
		return this.components.main;
	}
	
	// Should return an object with a 'main' component and a 'source' component
	_buildAll() {
		throw 'Abstract function called.';
	}
	
	fill(source) {
		this.components.source.attr('src', source);
	}
	
	clear() {
		this.components.source.attr('src', '');
	}
	
	get allowedMimeTypes() {
		throw 'Abstract function called.';
	}
}
