const StaticObjectEntity = require('./staticObjectEntity');

class CustomChoiceEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'CustomChoice'; 							}
	static get GUITYPE()	{ return 'CustomChoice'; 							}
	static get BUILDER()	{ return data => new CustomChoiceEntity(data);		}
	
	constructor(data) {
		super();
		this.addString('value', data && data.value)
			.hide();
		this.addString('source', data && data.source)
			.hide();
	}
	
	get _valueChild() {
		return this.getChild('value');
	}
	
	getSource() {
		return this.getChild('source').getValue();
	}
	
	getValue() {
		return this._valueChild.getValue();
	}
	
	setValue(value) {
		this._valueChild.setValue(value);
	}
	
	clearValue() {
		this._valueChild.clearValue();
	}
	
	hasValue() {
		return this.getValue() !== undefined;
	}
	
	// ---- Overrides ---- //
	
	toConf() {
		return this.getValue();
	}
}

module.exports = CustomChoiceEntity;
