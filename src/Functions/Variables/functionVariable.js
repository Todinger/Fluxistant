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
	// static get EXPRESSION_PREFIX() { return '$'; }
	
	constructor(variableData) {
		assert(
			variableData.expr instanceof RegExp || typeof variableData.expr === 'string',
			`Expected string or RegExp, got: ${variableData.expr}`);
		this.plainExpr = variableData.expr;
		this.expr = variableData.expr;
		if (typeof this.expr === 'string') {
			// This was my previous attempt at dealing with users writing $ in the chat.
			// It caused a problem when, for example, a user would write "$1" and "$all".
			// Then whichever global variable was processed first between the positional
			// one and the "all" one, it would create a new placeholder which then the
			// second one took to mean a replacement should be made, which is very bad.
			// This attempt was me trying to escape these sequences. It worked.
			// However, it failed if the *streamer* in their configuration made the
			// response message contain a backslash before the special expression, e.g.:
			//      Here is a message: 1: \$1 2: \$2 3: \$3 all: \$all.
			// This blended in with the escape, which assumes two slashes are not an
			// escape sequence (otherwise we can't type "\$" literally), and made the
			// chat user's $all, which was escaped into \$all, turn into \\$all, so it
			// once again processed it.
			// I have therefore opted to just do away with this entire concept and
			// instead make the replacements separately, rather than searching and
			// replacing the previous results over and over.
			// This means you can't output a special expression and have it processed.
			// You shouldn't do that to begin with, so yes, it's not going to be
			// supported.
			
			// assert(
			// 	this.expr.startsWith(Variable.EXPRESSION_PREFIX),
			// 	`Variable expressions must start with "${Variable.EXPRESSION_PREFIX}". Got: ${this.expr}`);
			//
			// this.expr = Utils.escapeRegExp(this.expr);
			// this.expr = `(?<!\\\\)(?:\\\\\\\\)*(${this.expr})`; // Avoid escaped prefixes
			// this.expr = new RegExp(this.expr, 'gi');
			
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
		this.condition = variableData.condition;
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
		let markdown = `  - ${this.name}:
    - ${this.description}
    - Example: ${this.example}`;
		if (this.condition) {
			markdown = `${markdown}
	- Condition: ${this.condition}`;
		}
		
		return markdown;
	}
}

module.exports = Variable;
