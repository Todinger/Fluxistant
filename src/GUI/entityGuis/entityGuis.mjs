import GuiRegistry					from "./guiRegistry.mjs";
import EntityGui					from "./entityGui.mjs";
import ValueGui						from "./valueGui.mjs";
import BooleanGui					from "./booleanGui.mjs";
import ColorGui						from "./colorGui.mjs";
import NumberGui					from "./numberGui.mjs";
import IntegerGui					from "./integerGui.mjs";
import NaturalNumberGui				from "./naturalNumberGui.mjs";
import NonNegativeNumberGui			from "./nonNegativeNumberGui.mjs";
import PercentageNumberGui			from "./percentageNumberGui.mjs";
import DegreesGui					from "./degreesGui.mjs";
import StringGui					from "./stringGui.mjs";
import HiddenStringGui				from "./hiddenStringGui.mjs";
import FixedArrayGui				from "./fixedArrayGui.mjs";
import DynamicArrayGui				from "./dynamicArrayGui.mjs";
import ObjectGui					from "./objectGui.mjs";
import ChoiceGui					from "./choiceGui.mjs";
import ExpandableChoiceGui			from "./expandableChoiceGui.mjs";
import RawObjectGui					from "./rawObjectGui.mjs";
import ConfigGui					from "./configGui.mjs";
import CommandGui					from "./commandGui.mjs";
import AssetGui						from "./assetGui.mjs";
import SingleAssetGui				from "./singleAssetGui.mjs";
import MultiAssetGui				from "./multiAssetGui.mjs";
import KeyGui						from "./keyGui.mjs";
import ExpandableTextDisplayGui		from "./expandableTextDisplayGui.mjs";
import TextDisplayGui				from "./textDisplayGui.mjs";
import ChannelRewardGui				from "./channelRewardGui.mjs";
import ChannelRewardSelectionGui	from "./channelRewardSelectionGui.mjs";
import FunctionGui					from "./functionGui.mjs";
import CustomChoiceGui				from "./customChoiceGui.mjs";
import WheelSegmentGui				from "./wheelSegmentGui.mjs";

export default {
	GuiRegistry,
	EntityGui,
	ValueGui,
	BooleanGui,
	ColorGui,
	NumberGui,
	IntegerGui,
	NaturalNumberGui,
	NonNegativeNumberGui,
	PercentageNumberGui,
	DegreesGui,
	StringGui,
	HiddenStringGui,
	FixedArrayGui,
	DynamicArrayGui,
	ObjectGui,
	ChoiceGui,
	ExpandableChoiceGui,
	RawObjectGui,
	ConfigGui,
	CommandGui,
	UploadGui: AssetGui,
	SingleAsset: SingleAssetGui,
	MultiAssetGui: MultiAssetGui,
	KeyGui,
	TextDisplayGui,
	ExpandableTextDisplayGui,
	ChannelRewardGui,
	ChannelRewardSelectionGui,
	FunctionGui,
	CustomChoiceGui,
	WheelSegmentGui,
};
