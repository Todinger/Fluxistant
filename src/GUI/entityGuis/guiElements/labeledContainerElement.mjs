import GuiElement from './guiElement.mjs';

export default class LabeledContainerElement extends GuiElement {
	build(data) {
		if (!data) data = {}; // To avoid needing to test if data is valid everywhere
		
		let outerContainer = $(`<div class="uk-child-width-expand uk-grid uk-margin-small-top uk-flex-nowrap"></div>`);
		outerContainer.guiData = {};
		
		if (data.label && data.label !== '') {
			let label = $(`<h4 class="uk-width-1-6 unselectable"></h4>`);
			label.append(data.label);
			
			outerContainer.append(label);
			outerContainer.guiData.label = label;
		}
		
		if (data.contents) {
			let innerContainer = $(`<div class="uk-width-expand"></div>`);
			innerContainer.append(data.contents);
			outerContainer.append(innerContainer);
			outerContainer.guiData.innerContainer = innerContainer;
		}
		
		return outerContainer;
	}
}
