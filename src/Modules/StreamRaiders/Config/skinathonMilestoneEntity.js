const StaticObjectEntity = requireConfig('./staticObjectEntity');
const ImageEntity = requireModConfig('ImageDisplay', 'imageEntity');

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
		reward.addNumber('centerX', 0)
			.setName('Center X Position')
			.setDescription('Horizontal center of the reward image, to align it with the background image');
		reward.addNumber('centerY', 0)
			.setName('Center X Position')
			.setDescription('Vertical center of the reward image, to align it with the background image');
		reward.addNumber('offsetX', 0)
			.setName('Reward Image: X Offset')
			.setDescription('Horizontal offset for the reward from the center point');
		reward.addNumber('offsetY', 0)
			.setName('Reward Image: Y Offset')
			.setDescription('Vertical offset for the reward from the center point');

		let enemy = this.addGroup('enemy')
			.setName('Enemy')
			.setDescription('Settings for the enemy guarding the milestone');
		enemy.addChild('image', new ImageEntity())
			.setName('Enemy Image')
			.setDescription('The regular appearance of the enemy guarding this milestone (facing left)');
		enemy.addChild('deathImage', new ImageEntity())
			.setName('Enemy Death Image')
			.setDescription('The appearance of the enemy guarding this milestone when it is killed (facing left)');
		enemy.addNumber('centerX', 0)
			.setName('Center X Position')
			.setDescription('Horizontal center of the enemy image, to align it with the background image');
		enemy.addNumber('centerY', 0)
			.setName('Center X Position')
			.setDescription('Vertical center of the enemy image, to align it with the background image');
		enemy.addNumber('offsetX', 0)
			.setName('X Offset')
			.setDescription('Horizontal offset for the enemy from the center point');
		enemy.addNumber('offsetY', 0)
			.setName('Y Offset')
			.setDescription('Vertical offset for the enemy from the center point');
	}
}

module.exports = SkinathonMilestoneEntity;
