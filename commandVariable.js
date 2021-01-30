const assert = require('assert').strict;
const Utils = require('./utils');

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
	constructor(expr, replacement, name, description, example) {
		assert(
			expr instanceof RegExp || typeof expr === 'string',
			`Expected string or RegExp, got: ${expr}`);
		this.expr = expr;
		if (typeof this.expr === 'string') {
			this.expr = Utils.escapeRegExp(this.expr);
			this.expr = new RegExp(this.expr, 'gi');
		} else {
			this.expr = injectAutomaticFlags(this.expr);
		}
		
		assert(typeof replacement == 'string' || typeof replacement == 'function');
		// if (typeof replacement == 'string' && !useRegex) {
		// 	// Escape strings that aren't regular expressions
		// 	replacement = Utils.escapeRegExp(replacement);
		// }
		this.replacement = replacement;
		
		this.name = name;
		this.description = description;
		this.example = example;
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
	
	consume(user, invocationData, commandData, message) {
		let matches = message.match(this.expr);
		if (matches) {
			return Utils.regExpGroupReplace(
				this.expr,
				message,
				(matchString, matchData) => {
					let replacementData = {
						matchString,
						matchData,
						commandData,
						invocationData,
						user,
						message
					};
					
					return this.getReplacementFor(replacementData);
				});
		} else {
			return message;
		}
	}
	
	static make(variableData) {
		return new Variable(
			variableData.expr,
			variableData.replacement,
			variableData.name,
			variableData.description,
			variableData.example
		);
	}
}

module.exports = Variable;
