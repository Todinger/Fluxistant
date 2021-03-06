const entities = {
	ArrayEntity: require('./WebEntities/arrayEntity.js'),
	ChannelRewardEntity: require('./WebEntities/channelRewardEntity.js'),
	ChannelRewardSelectionEntity: require('./WebEntities/channelRewardSelectionEntity.js'),
	ChoiceEntity: require('./WebEntities/choiceEntity.js'),
	ChoiceValueEntity: require('./WebEntities/choiceValueEntity.js'),
	CommandEntity: require('./WebEntities/commandEntity.js'),
	ConfigEntity: require('./WebEntities/configEntity.js'),
	CooldownEntity: require('./WebEntities/cooldownEntity.js'),
	CustomChoiceEntity: require('./WebEntities/customChoiceEntity.js'),
	DynamicArrayEntity: require('./WebEntities/dynamicArrayEntity.js'),
	DynamicAssetArrayEntity: require('./WebEntities/dynamicAssetArrayEntity.js'),
	DynamicObjectEntity: require('./WebEntities/dynamicObjectEntity.js'),
	ExpandableTextDisplayEntity: require('./WebEntities/expandableTextDisplayEntity.js'),
	FixedArrayEntity: require('./WebEntities/fixedArrayEntity.js'),
	ObjectEntity: require('./WebEntities/objectEntity.js'),
	SimpleObjectEntity: require('./WebEntities/simpleObjectEntity.js'),
	StaticObjectEntity: require('./WebEntities/staticObjectEntity.js'),
	TextDisplayEntity: require('./WebEntities/textDisplayEntity.js'),
	UserEntity: require('./WebEntities/userEntity.js'),
	UserFilterEntity: require('./WebEntities/userFilterEntity.js'),
	UserFilter_BaseEntity: require('./WebEntities/userFilter_BaseEntity.js'),
	UserFilter_IsAtLeastModEntity: require('./WebEntities/userFilter_IsAtLeastModEntity.js'),
	UserFilter_IsModEntity: require('./WebEntities/userFilter_IsModEntity.js'),
	UserFilter_IsOneOfEntity: require('./WebEntities/userFilter_IsOneOfEntity.js'),
	UserFilter_IsSubEntity: require('./WebEntities/userFilter_IsSubEntity.js'),
	UserFilter_IsUserEntity: require('./WebEntities/userFilter_IsUserEntity.js'),
	AssetEntity: require('./WebEntities/Assets/assetEntity.js'),
	AssetFileEntity: require('./WebEntities/Assets/assetFileEntity.js'),
	ImageFileEntity: require('./WebEntities/Assets/imageFileEntity.js'),
	MultiAssetEntity: require('./WebEntities/Assets/multiAssetEntity.js'),
	SingleAssetEntity: require('./WebEntities/Assets/singleAssetEntity.js'),
	SoundFileEntity: require('./WebEntities/Assets/soundFileEntity.js'),
	VideoEntity: require('./WebEntities/Assets/videoEntity.js'),
	FunctionEntity: require('./WebEntities/Functions/functionEntity.js'),
	FilterChoiceEntity: require('./WebEntities/Functions/Filters/filterChoiceEntity.js'),
	FilterEntity: require('./WebEntities/Functions/Filters/filterEntity.js'),
	Filter_IsModEntity: require('./WebEntities/Functions/Filters/filter_IsModEntity.js'),
	Filter_IsSubEntity: require('./WebEntities/Functions/Filters/filter_IsSubEntity.js'),
	Filter_OneOfUsersEntity: require('./WebEntities/Functions/Filters/filter_OneOfUsersEntity.js'),
	Filter_SpecificUserEntity: require('./WebEntities/Functions/Filters/filter_SpecificUserEntity.js'),
	Filter_WindowActiveEntity: require('./WebEntities/Functions/Filters/filter_WindowActiveEntity.js'),
	Filter_WindowRunningEntity: require('./WebEntities/Functions/Filters/filter_WindowRunningEntity.js'),
	ResponseChoiceEntity: require('./WebEntities/Functions/Responses/responseChoiceEntity.js'),
	ResponseEntity: require('./WebEntities/Functions/Responses/responseEntity.js'),
	Response_ChatEntity: require('./WebEntities/Functions/Responses/response_ChatEntity.js'),
	Response_ConsoleEntity: require('./WebEntities/Functions/Responses/response_ConsoleEntity.js'),
	Response_SEEntity: require('./WebEntities/Functions/Responses/response_SEEntity.js'),
	TriggerChoiceEntity: require('./WebEntities/Functions/Triggers/triggerChoiceEntity.js'),
	TriggerEntity: require('./WebEntities/Functions/Triggers/triggerEntity.js'),
	Trigger_ChannelRewardEntity: require('./WebEntities/Functions/Triggers/trigger_ChannelRewardEntity.js'),
	Trigger_CommandEntity: require('./WebEntities/Functions/Triggers/trigger_CommandEntity.js'),
	Trigger_HostEntity: require('./WebEntities/Functions/Triggers/trigger_HostEntity.js'),
	Trigger_KeyDownEntity: require('./WebEntities/Functions/Triggers/trigger_KeyDownEntity.js'),
	Trigger_KeyUpEntity: require('./WebEntities/Functions/Triggers/trigger_KeyUpEntity.js'),
	Trigger_RaidEntity: require('./WebEntities/Functions/Triggers/trigger_RaidEntity.js'),
	Trigger_ShortcutEntity: require('./WebEntities/Functions/Triggers/trigger_ShortcutEntity.js'),
	Trigger_WindowActivatedEntity: require('./WebEntities/Functions/Triggers/trigger_WindowActivatedEntity.js'),
	Trigger_WindowDeactivatedEntity: require('./WebEntities/Functions/Triggers/trigger_WindowDeactivatedEntity.js'),
	Trigger_WindowExitedEntity: require('./WebEntities/Functions/Triggers/trigger_WindowExitedEntity.js'),
	Trigger_WindowStartedEntity: require('./WebEntities/Functions/Triggers/trigger_WindowStartedEntity.js'),
	Trigger_WindowStatusBaseEntity: require('./WebEntities/Functions/Triggers/trigger_WindowStatusBaseEntity.js'),
	ImageEffectEntity: require('./WebEntities/ImageEffects/imageEffectEntity.js'),
	ImageEffect_DunDunDunEntity: require('./WebEntities/ImageEffects/imageEffect_DunDunDunEntity.js'),
	ImageEffect_GlowEntity: require('./WebEntities/ImageEffects/imageEffect_GlowEntity.js'),
	ImageEffect_ShadowEntity: require('./WebEntities/ImageEffects/imageEffect_ShadowEntity.js'),
	KeyEntity: require('./WebEntities/Keys/keyEntity.js'),
	KeyShortcutEntity: require('./WebEntities/Keys/keyShortcutEntity.js'),
	KeyShortcutsEntity: require('./WebEntities/Keys/keyShortcutsEntity.js'),
	LogLevelEntity: require('./WebEntities/LogLevel/logLevelEntity.js'),
	LogLevel_BaseEntity: require('./WebEntities/LogLevel/logLevel_BaseEntity.js'),
	LogLevel_DebugEntity: require('./WebEntities/LogLevel/logLevel_DebugEntity.js'),
	LogLevel_ErrorEntity: require('./WebEntities/LogLevel/logLevel_ErrorEntity.js'),
	LogLevel_InfoEntity: require('./WebEntities/LogLevel/logLevel_InfoEntity.js'),
	LogLevel_WarnEntity: require('./WebEntities/LogLevel/logLevel_WarnEntity.js'),
	BooleanEntity: require('./WebEntities/Values/booleanEntity.js'),
	ColorEntity: require('./WebEntities/Values/colorEntity.js'),
	DurationEntity: require('./WebEntities/Values/durationEntity.js'),
	HiddenStringEntity: require('./WebEntities/Values/hiddenStringEntity.js'),
	IntegerEntity: require('./WebEntities/Values/integerEntity.js'),
	NaturalNumberEntity: require('./WebEntities/Values/naturalNumberEntity.js'),
	NonNegativeNumberEntity: require('./WebEntities/Values/nonNegativeNumberEntity.js'),
	NumberEntity: require('./WebEntities/Values/numberEntity.js'),
	PositiveNumberEntity: require('./WebEntities/Values/positiveNumberEntity.js'),
	StringEntity: require('./WebEntities/Values/stringEntity.js'),
	ValueEntity: require('./WebEntities/Values/valueEntity.js'),
	CandyFileEntity: require('./WebEntities/candyFileEntity.js'),
	CandyInflationEntity: require('./WebEntities/candyInflationEntity.js'),
	CandyInflation_BaseEntity: require('./WebEntities/candyInflation_BaseEntity.js'),
	CandyInflation_ExponentialEntity: require('./WebEntities/candyInflation_ExponentialEntity.js'),
	CandyInflation_LinearEntity: require('./WebEntities/candyInflation_LinearEntity.js'),
	CandyInflation_NoneEntity: require('./WebEntities/candyInflation_NoneEntity.js'),
	UserGroupEntity: require('./WebEntities/userGroupEntity.js'),
	ImageCommandEntity: require('./WebEntities/imageCommandEntity.js'),
	ImageFunctionEntity: require('./WebEntities/imageFunctionEntity.js'),
	ImageEntity: require('./WebEntities/imageEntity.js'),
	SoundEntity: require('./WebEntities/soundEntity.js'),
	ObsFunctionDetailsEntity: require('./WebEntities/obsFunctionDetailsEntity.js'),
	ObsFunctionDetails_BaseEntity: require('./WebEntities/obsFunctionDetails_BaseEntity.js'),
	ObsFunctionDetails_SetCurrentSceneEntity: require('./WebEntities/obsFunctionDetails_SetCurrentSceneEntity.js'),
	ObsFunctionDetails_SetSourceVisibilityEntity: require('./WebEntities/obsFunctionDetails_SetSourceVisibilityEntity.js'),
	ObsFunctionDetails_SwitchToPreviousSceneEntity: require('./WebEntities/obsFunctionDetails_SwitchToPreviousSceneEntity.js'),
	ObsFunctionEntity: require('./WebEntities/obsFunctionEntity.js'),
	UserMediaEntity: require('./WebEntities/userMediaEntity.js'),
	TextFunctionEntity: require('./WebEntities/textFunctionEntity.js'),
	TriviaGameTypeEntity: require('./WebEntities/triviaGameTypeEntity.js'),
	TriviaGameType_BaseEntity: require('./WebEntities/triviaGameType_BaseEntity.js'),
	TriviaGameType_LettersEntity: require('./WebEntities/triviaGameType_LettersEntity.js'),
	TriviaGameType_MultipleChoiceEntity: require('./WebEntities/triviaGameType_MultipleChoiceEntity.js'),
	WelcomeEntity: require('./WebEntities/welcomeEntity.js'),
	WheelEntity: require('./WebEntities/wheelEntity.js'),
	WheelSegmentEntity: require('./WebEntities/wheelSegmentEntity.js'),
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