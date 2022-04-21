const SearchSegment = require('./searchSegment');
const FinalSegment = require('./finalSegment');
const MultiSegment = require('./multiSegment');

REPROCESS_MARK = '$';

class TextSegment extends SearchSegment {
	constructor(text) {
		super();
		this.text = text;
	}
	
	process(variable, context) {
		let reprocess = false;
		let matches = this.text && this.text.match(variable.expr);
		let result;
		if (matches) {
			// If the 'g' flag isn't included, the loop will run forever since the RegExp isn't stateful
			let regex = variable.expr;
			if (!regex.flags.includes('g')) {
				regex = new RegExp(regex.source, regex.flags + 'g');
			}
			
			let match;
			let lastStartIndex = 0;
			let parts = [];
			while ((match = regex.exec(this.text)) !== null) {
				let prevEndIndex = match.index;
				if (match.index > 0 && this.text[match.index - 1] === REPROCESS_MARK) {
					reprocess = true;
					prevEndIndex--;
				}
				parts.push(new TextSegment(this.text.substring(lastStartIndex, prevEndIndex)));
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
			
			result = new MultiSegment(parts);
		} else {
			result = this;
		}
		
		return { result, reprocess };
	}
	
	toString() {
		return this.text;
	}
}

module.exports = TextSegment;
