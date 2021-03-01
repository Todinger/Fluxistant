import DataContent from "./dataContent.mjs";
import DataContentFactory from "./dataContentFactory.mjs";

export default class ImageContent extends DataContent {
	static get CONTENT_TYPE()   { return 'IMAGE';                   }
	static get BUILDER()        { return () => new ImageContent();  }
	
	_buildAll() {
		let img = $('<img alt="Error Loading Image" src="" uk-img>');
		return {
			main: img,
			source: img,
		}
	}
	
	get allowedMimeTypes() {
		return "image/*";
	}
}

DataContentFactory.register(ImageContent);
