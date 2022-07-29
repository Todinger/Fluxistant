import GuiElement from './guiElement.mjs';

export default class ChildElement extends GuiElement {
	build(data) {
		let outerContainer = $(`<div class="uk-child-width-expand uk-child uk-grid uk-grid-small uk-margin-small-top uk-flex-nowrap"></div>`);
		let innerContainer = $(`<div></div>`);
		let separatorHTML = `<span class="uk-width-auto"></span>`;
		
		if (data.pre) {
			outerContainer.append(data.pre);
		}
		
		if (data.pre && data.contents) {
			outerContainer.append($(separatorHTML));
		}
		
		if (data.contents) {
			innerContainer.append(data.contents);
		}
		outerContainer.append(innerContainer);
		
		if (data.contents && data.post) {
			outerContainer.append($(separatorHTML));
		}
		
		if (data.post) {
			outerContainer.append(data.post);
		}
		
		outerContainer.guiData = {
			innerContainer,
			pre: data.pre,
			contents: data.contents,
			post: data.post,
		};
		
		return outerContainer;
	}
}
