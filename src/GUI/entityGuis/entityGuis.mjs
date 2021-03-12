import GuiRegistry		from "./guiRegistry.mjs";
import EntityGui		from "./entityGui.mjs";
import ValueGui			from "./valueGui.mjs";
import BooleanGui		from "./booleanGui.mjs";
import NumberGui		from "./numberGui.mjs";
import IntegerGui		from "./integerGui.mjs";
import NaturalNumberGui	from "./naturalNumberGui.mjs";
import StringGui		from "./stringGui.mjs";
import HiddenStringGui	from "./hiddenStringGui.mjs";
import FixedArrayGui	from "./fixedArrayGui.mjs";
import DynamicArrayGui	from "./dynamicArrayGui.mjs";
import ObjectGui		from "./objectGui.mjs";
import ChoiceGui		from "./choiceGui.mjs";
import RawObjectGui		from "./rawObjectGui.mjs";
import ConfigGui		from "./configGui.mjs";
import CommandGui		from "./commandGui.mjs";
import AssetGui			from "./assetGui.mjs";
import SingleAssetGui	from "./singleAssetGui.mjs";
import MultiAssetGui		from "./multiAssetGui.mjs";
import KeyGui			from "./keyGui.mjs";

export default {
	GuiRegistry,
	EntityGui,
	ValueGui,
	BooleanGui,
	NumberGui,
	IntegerGui,
	NaturalNumberGui,
	StringGui,
	HiddenStringGui,
	FixedArrayGui,
	DynamicArrayGui,
	ObjectGui,
	ChoiceGui,
	RawObjectGui,
	ConfigGui,
	CommandGui,
	UploadGui: AssetGui,
	SingleAsset: SingleAssetGui,
	MultiAssetGui: MultiAssetGui,
	KeyGui,
};

