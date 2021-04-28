import DataContent from "./dataContent.mjs";
import DataContentFactory from "./dataContentFactory.mjs";

export default class VideoContent extends DataContent {
	static get CONTENT_TYPE()   { return 'VIDEO';                   }
	static get BUILDER()        { return () => new VideoContent();  }
	static get MIME_TYPE()      { return 'video/*';                 }
	
	_buildAll() {
		let main = $('<video controls="controls"></video>');
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
}

DataContentFactory.register(VideoContent);
