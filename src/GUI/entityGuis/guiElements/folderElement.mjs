import GuiElement from './guiElement.mjs';

export default class FolderElement extends GuiElement {
	build(data) {
		let accordion = $(`<ul uk-accordion class="uk-margin-small-top uk-box-shadow-large uk-padding-small"></ul>`);
		let accordionItem = $(`<li></li>`);
		accordion.append(accordionItem);
		
		let header = $(`<a class="uk-accordion-title" href="#"></a>`);
		if (data.header) {
			header.append(data.header);
		}
		if (data.tooltip) {
			header.attr('uk-tooltip', data.tooltip);
		}
		accordionItem.append(header);
		
		let contentsContainer = $(`<div class="uk-accordion-content"></div>`);
		if (data.contents) {
			contentsContainer.append(data.contents);
		}
		accordionItem.append(contentsContainer);
		
		accordion.guiData = {
			accordionItem,
			header,
			contentsContainer,
		};
		
		return accordion;
	}
}
