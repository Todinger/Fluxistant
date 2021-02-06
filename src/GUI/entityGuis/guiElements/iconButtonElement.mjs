import GuiElement from './guiElement.mjs';

export default class IconButtonElement extends GuiElement {
	build(data) {
		let button = $(`<button class="uk-button uk-button-default uk-width-auto uk-padding-remove"></button>`);
		let icon = $(`<span uk-icon="icon: trash"></span>`);
		button.append(icon);
		
		if (data.onClick) {
			button.click(data.onClick);
		}
		
		if (data.icon) {
			icon.attr('uk-icon', `icon: ${data.icon}`);
		}
		
		button.guiData = {
			icon,
		}
		
		return button;
	}
}
