const SearchSegment = require('./searchSegment');
const FinalSegment = require('./finalSegment');
const MultiSegment = require('./multiSegment');

class TextSegment extends SearchSegment {
	constructor(text) {
		super();
		this.text = text;
	}
	
	process(variable, context) {
		let matches = this.text.match(variable.expr);
		if (matches) {
			// return Utils.regExpGroupReplace(
			// 	this.expr,
			// 	message,
			// 	(matchString, matchData) => {
			// 		let replacementData = {
			// 			matchString,
			// 			matchData,
			// 			context,
			// 			message
			// 		};
			//
			// 		return this.getReplacementFor(replacementData);
			// 	});
			
			// If the 'g' flag isn't included, the loop will run forever since the RegExp isn't stateful
			let regex = variable.expr;
			if (!regex.flags.includes('g')) {
				regex = new RegExp(regex.source, regex.flags + 'g');
			}
			
			let match;
			let lastStartIndex = 0;
			let parts = [];
			while ((match = regex.exec(this.text)) !== null) {
				parts.push(new TextSegment(this.text.substring(lastStartIndex, match.index)));
				parts.push(new FinalSegment(variable.getReplacementFor({
					matchString: match[0],
					matchData: match,
					context,
				})));
				lastStartIndex = match.index + match[0].length;
			}
			
			// If the last expression didn't cover the rest of the string, we need to add the suffix
			// to our result string
			if (lastStartIndex < this.text.length) {
				parts.push(new TextSegment(this.text.substring(lastStartIndex)));
			}
			
			return new MultiSegment(parts);
		} else {
			return this;
		}
	}
	
	toString() {
		return this.text;
	}
}

module.exports = TextSegment;
