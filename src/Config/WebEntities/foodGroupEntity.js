const NamedEntity = require('././namedEntity');

class FoodGroupEntity extends NamedEntity {
	static get TYPE()		{ return 'FoodGroup'; 					}
	static get BUILDER()	{ return () => new FoodGroupEntity(); 	}
	
	constructor() {
		super();
		this.addString('groupName')
			.setName('Name')
			.setDescription('Name of this food group');
		this.add(
			'foodItems',
			'MultiAsset',
			{
				collection: 'Images',
				dataType: 'IMAGE',
				elementValueType: 'FoodItem',
			})
		.setName('Food Items')
		.setDescription('Foodstuffs that are part of this food group');
	}
	
	getGroupName() {
		return this.getChild('groupName').getValue();
	}
	
	getNameOverride() {
		return this.getGroupName();
	}
}

module.exports = FoodGroupEntity;
