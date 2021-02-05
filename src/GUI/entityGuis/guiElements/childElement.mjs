import GuiElement from './guiElement.mjs';

export default class ChildElement extends GuiElement {
	build(data) {
		let outerContainer = $(`<div class="uk-child-width-expand uk-child uk-grid uk-grid-small uk-margin-small-top uk-flex-nowrap"></div>`);
		let marker = $(`<span class="uk-width-auto uk-preserve-width uk-margin-auto-top uk-margin-auto-bottom uk-margin-remove-right" uk-icon="icon: triangle-right"></span>`);
		let innerContainer = $(`<div></div>`);
		let separatorHTML = `<span class="uk-width-auto"></span>`;
		
		outerContainer.append(marker);
		
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
		
		return outerContainer;
	}
}
