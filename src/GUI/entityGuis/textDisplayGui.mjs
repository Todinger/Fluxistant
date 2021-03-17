import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import GuiElements from "./guiElements/guiElements.mjs";

const markdownConverter = new showdown.Converter({simplifiedAutoLink: true});

export default class TextDisplayGui extends EntityGui {
	static get GUITYPE()    { return 'TextDisplay';                      }
	static get BUILDER()    { return (...p) => new TextDisplayGui(...p); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.mainGui = null;
	}
	
	_buildGUI() {
		let textDisplay = $(`<span class="unselectable">${markdownConverter.makeHtml(this.entity.getValue())}</span>`);
		this.mainGui = GuiElements.folder({
			header: 'Module Description',
			contents: textDisplay,
		});
		return this.mainGui;
	}
	
	// Visually marks that this value has been changed
	activateChangedIndicators() {
		EntityGui.addChangeIndicator(this.jInput);
	}
	
	// Accept changes and remove change markers
	finalizeChanges() {
		super.finalizeChanges();
		EntityGui.clearChangeIndicator(this.jInput);
	}
}

GuiRegistry.register(TextDisplayGui);
