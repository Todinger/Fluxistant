import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

const markdownConverter = new showdown.Converter({simplifiedAutoLink: true});

export default class TextDisplayGui extends EntityGui {
	static get GUITYPE()    { return 'TextDisplay';                      }
	static get BUILDER()    { return (...p) => new TextDisplayGui(...p); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.textDisplay = null;
	}
	
	_buildGUI() {
		this.textDisplay = $(`<span class="unselectable uk-margin-auto"></span>`);
		this.refreshContents();
		return this.textDisplay;
	}
	
	// Visually marks that this value has been changed
	activateChangedIndicators() {
		EntityGui.addChangeIndicator(this.textDisplay);
	}
	
	// Accept changes and remove change markers
	finalizeChanges() {
		super.finalizeChanges();
		EntityGui.clearChangeIndicator(this.textDisplay);
	}
	
	refreshContents() {
		this.textDisplay.html(markdownConverter.makeHtml(this.entity.getValue()));
		this.textDisplay.find('p').addClass('uk-margin-remove');
	}
}

GuiRegistry.register(TextDisplayGui);
