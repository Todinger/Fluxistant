import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import FocusManager from "../focusManager.mjs";
import SourceManager from "../sourceManager.mjs";

export default class CustomChoiceGui extends EntityGui {
	static get GUITYPE()    { return 'CustomChoice';                      }
	static get BUILDER()    { return (...p) => new CustomChoiceGui(...p); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
	}
	
	_buildOptions(options) {
		this.selector.empty();
		
		options.forEach(option => {
			let selectorOption = $(`<option value="${option}">${option}</option>`);
			this.selector.append(selectorOption);
		});
		
		// Set initial selection
		let currentValue = this.entity.getValue();
		if (currentValue && options.includes(currentValue)) {
			this.selector.val(currentValue);
		} else if (options.length > 0) {
			this.selector.val(options[0]);
			this.entity.setValue(options[0]);
		}
	}
	
	_buildGUI() {
		let selector = $(`<select id="${this.guiID}" class="uk-select"></select>`);
		this.selector = selector;
		
		let source = this.entity.getSource();
		let options = SourceManager.getSourceOptions(source);
		this._buildOptions(options);
		SourceManager.on(source, options => this._buildOptions(options));
		
		let description = this.entity.getDescription();
		if (description !== '') {
			selector.attr('uk-tooltip', description);
		}
		
		let _this = this;
		selector.change(function() {
			if (!this.value || this.value === '') {
				_this.entity.clearValue();
			} else {
				_this.entity.setValue(this.value);
			}
			
			_this._changed();
		});
		
		// Announce when we get focus
		selector.focusin(() => FocusManager.obtainedMainFocus());
		
		return selector;
	}
	
	// Visually marks that this value has been changed
	activateChangedIndicators() {
		EntityGui.addChangeIndicator(this.selector);
	}
	
	// Accept changes and remove change markers
	finalizeChanges() {
		super.finalizeChanges();
		EntityGui.clearChangeIndicator(this.selector);
	}
	
	refreshContents() {
		this._buildOptions();
	}
}

GuiRegistry.register(CustomChoiceGui);
