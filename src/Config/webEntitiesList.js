const entities = {
	ArrayEntity: require('./WebEntities/arrayEntity.js'),
	AssetEntity: require('./WebEntities/assetEntity.js'),
	AssetFileEntity: require('./WebEntities/assetFileEntity.js'),
	BooleanEntity: require('./WebEntities/booleanEntity.js'),
	ChoiceEntity: require('./WebEntities/choiceEntity.js'),
	ChoiceValueEntity: require('./WebEntities/choiceValueEntity.js'),
	CommandEntity: require('./WebEntities/commandEntity.js'),
	ConfigEntity: require('./WebEntities/configEntity.js'),
	CooldownEntity: require('./WebEntities/cooldownEntity.js'),
	DynamicArrayEntity: require('./WebEntities/dynamicArrayEntity.js'),
	DynamicAssetArrayEntity: require('./WebEntities/dynamicAssetArrayEntity.js'),
	DynamicObjectEntity: require('./WebEntities/dynamicObjectEntity.js'),
	FixedArrayEntity: require('./WebEntities/fixedArrayEntity.js'),
	HiddenStringEntity: require('./WebEntities/hiddenStringEntity.js'),
	ImageEffectEntity: require('./WebEntities/imageEffectEntity.js'),
	ImageEffect_DunDunDunEntity: require('./WebEntities/imageEffect_DunDunDunEntity.js'),
	ImageEffect_GlowEntity: require('./WebEntities/imageEffect_GlowEntity.js'),
	ImageEffect_ShadowEntity: require('./WebEntities/imageEffect_ShadowEntity.js'),
	ImageFileEntity: require('./WebEntities/imageFileEntity.js'),
	IntegerEntity: require('./WebEntities/integerEntity.js'),
	KeyEntity: require('./WebEntities/keyEntity.js'),
	KeyShortcutEntity: require('./WebEntities/keyShortcutEntity.js'),
	KeyShortcutsEntity: require('./WebEntities/keyShortcutsEntity.js'),
	MultiAssetEntity: require('./WebEntities/multiAssetEntity.js'),
	NaturalNumberEntity: require('./WebEntities/naturalNumberEntity.js'),
	NumberEntity: require('./WebEntities/numberEntity.js'),
	ObjectEntity: require('./WebEntities/objectEntity.js'),
	PositiveNumberEntity: require('./WebEntities/positiveNumberEntity.js'),
	SimpleObjectEntity: require('./WebEntities/simpleObjectEntity.js'),
	SingleDataEntity: require('./WebEntities/singleDataEntity.js'),
	SoundFileEntity: require('./WebEntities/soundFileEntity.js'),
	StaticObjectEntity: require('./WebEntities/staticObjectEntity.js'),
	StringEntity: require('./WebEntities/stringEntity.js'),
	UserEntity: require('./WebEntities/userEntity.js'),
	UserFilterEntity: require('./WebEntities/userFilterEntity.js'),
	UserFilter_BaseEntity: require('./WebEntities/userFilter_BaseEntity.js'),
	UserFilter_IsAtLeastModEntity: require('./WebEntities/userFilter_IsAtLeastModEntity.js'),
	UserFilter_IsModEntity: require('./WebEntities/userFilter_IsModEntity.js'),
	UserFilter_IsOneOfEntity: require('./WebEntities/userFilter_IsOneOfEntity.js'),
	UserFilter_IsSubEntity: require('./WebEntities/userFilter_IsSubEntity.js'),
	UserFilter_IsUserEntity: require('./WebEntities/userFilter_IsUserEntity.js'),
	ValueEntity: require('./WebEntities/valueEntity.js'),
	CandyFileEntity: require('./WebEntities/candyFileEntity.js'),
	CandyInflationEntity: require('./WebEntities/candyInflationEntity.js'),
	CandyInflation_BaseEntity: require('./WebEntities/candyInflation_BaseEntity.js'),
	CandyInflation_ExponentialEntity: require('./WebEntities/candyInflation_ExponentialEntity.js'),
	CandyInflation_LinearEntity: require('./WebEntities/candyInflation_LinearEntity.js'),
	CandyInflation_NoneEntity: require('./WebEntities/candyInflation_NoneEntity.js'),
	UserGroupEntity: require('./WebEntities/userGroupEntity.js'),
	ImageCommandEntity: require('./WebEntities/imageCommandEntity.js'),
	ImageEntity: require('./WebEntities/imageEntity.js'),
	SoundEntity: require('./WebEntities/soundEntity.js'),
	UserMediaEntity: require('./WebEntities/userMediaEntity.js'),
	WelcomeEntity: require('./WebEntities/welcomeEntity.js'),
};

const factory = require('./entityFactory');
const enums = require('../enums');

function registerAll() {
	Object.values(entities).forEach(entity => {
		factory.processEntityClass(entity, 'server');
	});
}

module.exports = {
	Entities: entities,
	Factory: factory,
	RegisterAll: registerAll,
	Enums: enums,
}