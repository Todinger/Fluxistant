const assert = require('assert').strict;
const ImageFileEntity = requireConfig('Assets/imageFileEntity');

// Based on:
// https://stackoverflow.com/questions/3820381/need-a-basename-function-in-javascript
function baseName(str)
{
	let base = str.substring(str.lastIndexOf('/') + 1);
	if(base.lastIndexOf(".") !== -1)
		base = base.substring(0, base.lastIndexOf("."));
	return base;
}

class FoodItemEntity extends ImageFileEntity {
	static get TYPE()		{ return 'FoodItem';					}
	static get BUILDER()	{ return () => new FoodItemEntity(); 	}
	
	constructor(fileKey) {
		super(fileKey);
		this.addString('foodName')
			.setName('Name')
			.setDescription('Name for this food item');
		this.addNaturalNumber('minValue', 10)
			.setName('Minimum Nutrition Value')
			.setDescription('Minimum amount of food units that will be added when the cat eats this food item');
		this.addNaturalNumber('maxValue', 20)
			.setName('Maximum Nutrition Value')
			.setDescription('Maximum amount of food units that will be added when the cat eats this food item');
		this.addNaturalNumber('points', 100)
			.setName('Points')
			.setDescription('Base amount of points added for successfully feeding the cat this item (multiplied by current level factor)');
	}
	
	getFoodName() {
		return this.getChild('foodName').getValue();
	}
	
	setFoodName(foodName) {
		return this.getChild('foodName').setValue(foodName);
	}
	
	getMinValue() {
		return this.getChild('minValue').getValue();
	}
	
	getMaxValue() {
		return this.getChild('maxValue').getValue();
	}
	
	// ---- Overrides ---- //
	validate() {
		super.validate();
		
		assert(this.getMinValue() <= this.getMaxValue(),
			   'Minimum value must be <= maximum value.');
	}
	
	setFileName(fileName) {
		if (!this.getFoodName()) {
			this.setFoodName(baseName(fileName));
		}
	}
}

module.exports = FoodItemEntity;
