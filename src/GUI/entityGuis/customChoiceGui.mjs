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
	
	_buildOptionsList(options, parent) {
		options.forEach(option => {
			let selectorOption = $(`<option value="${option}">${option}</option>`);
			parent.append(selectorOption);
		});
	}
	
	_buildOptionCategories(categories, parent) {
		Object.keys(categories).forEach(category => {
			let optionCategory = $(`<optgroup label="${category}"></optgroup>`);
			this._buildOptionsList(categories[category], optionCategory);
			parent.append(optionCategory);
		});
	}
	
	_hasOption(options, option) {
		if (Array.isArray(options)) {
			return options.includes(option);
		} else {
			return Object.values(options).reduce(
				(soFar, current) => soFar || current.includes(option));
		}
	}
	
	_getSomeOption(options) {
		if (Array.isArray(options) && options.length > 0) {
			return options[0];
		} else {
			for (const catOptions of Object.values(options)) {
				if (catOptions && catOptions.length > 0) {
					return catOptions[0];
				}
			}
		}
		
		return null;
	}
	
	_buildOptions(options) {
		this.selector.empty();
		
		if (Array.isArray(options)) {
			this._buildOptionsList(options, this.selector);
		} else {
			this._buildOptionCategories(options, this.selector);
		}
		
		// Set initial selection
		let currentValue = this.entity.getValue();
		if (currentValue && this._hasOption(options, currentValue)) {
			this.selector.val(currentValue);
		} else {
			let someOption = this._getSomeOption(options);
			if (someOption) {
				this.selector.val(someOption);
				this.entity.setValue(someOption);
			}
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
