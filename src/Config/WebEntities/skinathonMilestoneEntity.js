const StaticObjectEntity = require('././staticObjectEntity');
const ImageEntity = require('./imageEntity');

class SkinathonMilestoneEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'SkinathonMilestone'; 					}
	static get BUILDER()	{ return () => new SkinathonMilestoneEntity(); 	}
	
	constructor() {
		super();
		this.addNaturalNumber('sp', 0)
			.setName('Skin Points')
			.setDescription('How many TOTAL Skin Points are required to unlock this milestone');
		this.addChild('lockedBackImage', new ImageEntity())
			.setName('Locked Back Image')
			.setDescription('"Sign" image on which the reward contents will be shown - before unlocking the reward');
		this.addChild('unlockedBackImage', new ImageEntity())
			.setName('Unlocked Back Image')
			.setDescription('"Sign" image on which the reward contents will be shown - after unlocking the reward');

		let reward = this.addGroup('reward')
			.setName('Reward')
			.setDescription('Settings for the reward granted when unlocking this milestone');
		reward.addChild('image', new ImageEntity())
			.setName('Reward Image')
			.setDescription('The reward that gets unlocked by this milestone');
		reward.addNumber('offsetX', 0)
			.setName('Reward Image: X Offset')
			.setDescription('Horizontal offset for the reward image to align it with the background image');
		reward.addNumber('offsetY', 0)
			.setName('Reward Image: Y Offset')
			.setDescription('Vertical offset for the reward image to align it with the background image');

		let enemy = this.addGroup('enemy')
			.setName('Reward')
			.setDescription('Settings for the reward granted when unlocking this milestone');
		enemy.addChild('image', new ImageEntity())
			.setName('Enemy Image')
			.setDescription('The regular appearance of the enemy guarding this milestone');
		enemy.addChild('deathImage', new ImageEntity())
			.setName('Enemy Death Image')
			.setDescription('The appearance of the enemy guarding this milestone when it is killed');
		enemy.addNumber('offsetX', 0)
			.setName('Reward Image: X Offset')
			.setDescription('Horizontal offset for the images to align them with the milestone sign');
		enemy.addNumber('offsetY', 0)
			.setName('Reward Image: Y Offset')
			.setDescription('Vertical offset for the images to align them with the milestone sign');
	}
}

module.exports = SkinathonMilestoneEntity;
