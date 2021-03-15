const assert = require('assert').strict;
const Utils = require('../../utils');

const REGEX_AUTOMATIC_FLAGS = 'gi';
function injectAutomaticFlags(regex) {
	let flags = regex.flags;
	for (let i = 0; i < REGEX_AUTOMATIC_FLAGS; i++) {
		if (!flags.includes(REGEX_AUTOMATIC_FLAGS[i])) {
			flags += REGEX_AUTOMATIC_FLAGS[i];
		}
	}
	
	return new RegExp(regex.source, flags);
}

class Variable {
	constructor(variableData) {
		assert(
			variableData.expr instanceof RegExp || typeof variableData.expr === 'string',
			`Expected string or RegExp, got: ${variableData.expr}`);
		this.expr = variableData.expr;
		if (typeof this.expr === 'string') {
			this.expr = Utils.escapeRegExp(this.expr);
			this.expr = new RegExp(this.expr, 'gi');
		} else {
			this.expr = injectAutomaticFlags(this.expr);
		}
		
		assert(typeof variableData.replacement == 'string' || typeof variableData.replacement == 'function');
		this.replacement = variableData.replacement;
		
		this.name = variableData.name;
		this.description = variableData.description;
		this.example = variableData.example;
	}
	
	getReplacementFor(replacementData) {
		let result;
		if (typeof this.replacement === 'function') {
			result = this.replacement(replacementData);
		} else {
			result = this.replacement;
		}
		
		return result;
	}
	
	consume(message, context) {
		let matches = message.match(this.expr);
		if (matches) {
			return Utils.regExpGroupReplace(
				this.expr,
				message,
				(matchString, matchData) => {
					let replacementData = {
						matchString,
						matchData,
						context,
						message
					};
					
					return this.getReplacementFor(replacementData);
				});
		} else {
			return message;
		}
	}
	
	toMarkdown() {
		return `  - ${this.name}:
    - ${this.description}
    - Example: ${this.example}`;
	}
}

module.exports = Variable;
