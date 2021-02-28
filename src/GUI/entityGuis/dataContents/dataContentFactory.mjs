class DataContentFactory {
	constructor() {
		this.builders = {};
	}
	
	register(contentClass) {
		if (!contentClass) throw 'Invalid data content class registered.';
		
		let contentType = contentClass.CONTENT_TYPE;
		console.assert(contentType, `Data content builder registration missing a CONTENT_TYPE value.`);
		
		if (!contentType) throw 'Abstract or invalid data content class registered.';
		if (contentType in this.builders) throw `Duplicate registration for data content type '${contentType}'.`
		
		this.builders[contentType] = contentClass.BUILDER;
	}
	
	build(contentType) {
		console.assert(
			contentType && contentType in this.builders,
			`Unknown content type type: ${contentType}.`);
		
		return this.builders[contentType]();
	}
}

const dataContentFactory = new DataContentFactory();
export default dataContentFactory;
