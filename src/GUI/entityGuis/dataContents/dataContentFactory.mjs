class DataContentFactory {
	constructor() {
		this.classes = {};
	}
	
	register(contentClass) {
		if (!contentClass) throw 'Invalid data content class registered.';
		
		let contentType = contentClass.CONTENT_TYPE;
		console.assert(contentType, `Data content builder registration missing a CONTENT_TYPE value.`);
		
		if (!contentType) throw 'Abstract or invalid data content class registered.';
		if (contentType in this.classes) throw `Duplicate registration for data content type '${contentType}'.`
		
		this.classes[contentType] = contentClass;
	}
	
	build(contentType) {
		console.assert(
			contentType && contentType in this.classes,
			`Unknown content type: ${contentType}.`);
		
		return this.classes[contentType].BUILDER();
	}
	
	getMimeType(contentType) {
		console.assert(
			contentType && contentType in this.classes,
			`Unknown content type: ${contentType}.`);
		
		return this.classes[contentType].MIME_TYPE;
	}
}

const dataContentFactory = new DataContentFactory();
export default dataContentFactory;
