import FolderElement from "./folderElement.mjs";
import ChildElement from "./childElement.mjs";
import IconButtonElement from "./iconButtonElement.mjs";
import LabeledContainerElement from "./labeledContainerElement.mjs";

let allElements = {
	folder: new FolderElement(),
	child: new ChildElement(),
	iconButton: new IconButtonElement(),
	labeledContainer: new LabeledContainerElement(),
}

const GuiElements = {
	folder: (data) => allElements.folder.build(data),
	child: (data) => allElements.child.build(data),
	iconButton: (data) => allElements.iconButton.build(data),
	labeledContainer: (data) => allElements.labeledContainer.build(data),
}

export default GuiElements;
