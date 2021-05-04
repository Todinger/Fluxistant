import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class WheelSegmentGui extends EntityGui {
	static get GUITYPE()    { return 'WheelSegment'; }
	static get BUILDER()    { return (...p) => new WheelSegmentGui(...p); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.guis = null;
	}
	
	_buildGUI() {
		let container = $(`<div class="uk-margin-small-left uk-child-width-expand uk-grid padding uk-margin-small-top uk-flex-nowrap"></div>`);
		this.guis = {
			value: GuiRegistry.buildGui(this.entity.valueEntity),
			color: GuiRegistry.buildGui(this.entity.colorEntity),
		};
		
		this.guis.value.onChangedOrError(() => this._changed());
		this.guis.color.onChangedOrError(() => this._changed());
		
		let jValueGUI = this.guis.value.getGUI();
		let jColorGUI = this.guis.color.getGUI();
		
		// Ugly fix for padding added by the uk-grid class (not researching a
		// proper fix since this entire configuration GUI page is going to be
		// scrapped soon)
		jValueGUI.css('padding-left', 10);
		
		container.append(jValueGUI, jColorGUI);
		return container;
	}
	
	// Visually marks that this value has been changed
	activateChangedIndicators() {
		this.guis.value.activateChangedIndicators();
		this.guis.color.activateChangedIndicators();
	}
	
	// Accept changes and remove change markers
	finalizeChanges() {
		super.finalizeChanges();
		this.guis.value.finalizeChanges();
		this.guis.color.finalizeChanges();
	}
	
	refreshContents() {
		super.refreshContents();
		this.guis.value.refreshContents();
		this.guis.color.refreshContents();
	}
}

GuiRegistry.register(WheelSegmentGui);

/*
	<div class="uk-child-width-expand uk-grid uk-margin-small-top uk-flex-nowrap" uk-tooltip="Server port">
		<h3 class="uk-width-1-6">Value</h3>
		<div class="uk-width-expand">
			<input id="wheel-segment-value" class="uk-input" type="text">
		</div>
		<h3 class="uk-width-small">Color</h3>
		<input type="color" class="uk-width-small">
	</div>
*/
