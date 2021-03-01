import DataContent from "./dataContent.mjs";
import DataContentFactory from "./dataContentFactory.mjs";

export default class SoundContent extends DataContent {
	static get CONTENT_TYPE()   { return 'SOUND';                   }
	static get BUILDER()        { return () => new SoundContent();  }
	
	_buildAll() {
		let main = $('<audio controls="controls"></audio>');
		let source = $('<source src=""/>').appendTo(main);
		
		return {
			main,
			source,
		}
	}
	
	fill(source) {
		super.fill(source);
		this.components.main.get(0).load();
	}
	
	get allowedMimeTypes() {
		return "audio/*";
	}
}

DataContentFactory.register(SoundContent);
