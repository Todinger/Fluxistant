import GuiElement from './guiElement.mjs';

export default class ContainerElement extends GuiElement {
	constructor() {
		super();
		this.pre = null;
		this.contents = null;
		this.post = null;
	}
	
	getPre() {
		return this.pre;
	}
	
	getPost() {
		return this.post;
	}
	
	getContents() {
		return this.contents;
	}
	
	setPre(pre) {
		this.pre = pre;
	}
	
	setContents(contents) {
		this.contents = contents;
	}
	
	setPost(post) {
		this.post = post;
	}
}
