const Module = requireMain('module');
const Utils = requireMain('utils');

const PLACEHOLDERS = {
	NUM:       '$num',
	TEXT:      '$text',
	TIME:      '$time',
	QUOTER:    '$quoter',
	CATEGORY:  '$category',
};

const BAD_QUOTE_SET_PARAMS = -1;

class Quotes extends Module {
	constructor() {
		super({
			name: 'Quotes',
		});
		
		this.data.quotes = [];
		this.currentCategory = null;
	}
	
	get quoteCount() {
		return this.data.quotes.length;
	}
	
	defineModConfig(modConfig) {
		modConfig.addString('format', 'Quote #$num: "$text" ($time, streaming $category)')
			.setName('Quote Format')
			.setDescription('How to write the quote to the channel ' +
				'($num = quote #, $text = the quote, $time = when it was quoted, $quoter = who quoted it, ' +
				'$category = the stream category at the time, or "???" if it is not known)');
		modConfig.addString('noCategory', 'cat-like things')
			.setName('No-Category Default')
			.setDescription('What to show as "category" for quotes that have no category set');
	}
	
	setChannelCategory(data) {
		let category = data.allParams;
		if (category === "") {
			this.currentCategory = null;
			this.tell(data.user, "Current category reset to none.");
		} else {
			this.currentCategory = category;
			this.tell(data.user, `Set current category to: ${category}`);
		}
	}
	
	makeQuoteText(text) {
		// Get rid of enclosing quotes and spaces
		return text.match(/^["' ]*(.*?)["' ]*$/)[1];
	}
	
	makeQuote(data) {
		let text = this.makeQuoteText(data.allParams);
		
		return {
			text,
			quoter: data.user.name,
			time: new Date().toLocaleDateString(),
			category: this.currentCategory,
		};
	}
	
	addQuote(data) {
		let quote = this.makeQuote(data);
		
		if (quote.text === "") {
			this.tellError(data.user, "Please enter a quote to add.");
			return false;
		}
		
		this.data.quotes.push(quote);
		this.saveData();
		
		this.tell(data.user, `Added quote #${this.quoteCount}.`);
	}
	
	validateHasNumAndContentsAndGetNum(data) {
		if (data.params.length < 2 || !Utils.isNaturalNumberString(data.params[0])) {
			this.tellError(data.user, "Please specify a quote number and the fixed quote.");
			return -1;
		}
		
		let num = Number(data.params[0]);
		if (!Utils.inRange(1, num, this.quoteCount)) {
			this.tellError(data.user, `Could not find quote #${num}. Our quotes only go up to ${this.quoteCount}.`);
			return BAD_QUOTE_SET_PARAMS;
		}
		
		return num;
	}
	
	editQuote(data) {
		let num = this.validateHasNumAndContentsAndGetNum(data);
		if (num === BAD_QUOTE_SET_PARAMS) {
			return false;
		}
		
		let quote = this.data.quotes[num - 1];
		let quoteText = this.makeQuoteText(data.params.slice(1).join(" "));
		
		if (quoteText === "") {
			this.tellError(data.user, "Please enter a valid quote with actual contents to set.");
			return false;
		}
		
		quote.text = quoteText;
		this.saveData();
		
		this.tell(data.user, `Quote #${num} edited.`);
	}
	
	editCategory(data) {
		let num = this.validateHasNumAndContentsAndGetNum(data);
		if (num === BAD_QUOTE_SET_PARAMS) {
			return false;
		}
		
		let quote = this.data.quotes[num - 1];
		quote.category = data.params.slice(1).join(" ");
		this.tell(data.user, `Set quote #${num} category to: ${category}`);
		
		this.saveData();
	}
	
	formatQuote(quote, num) {
		let result = this.config.format;
		
		result = Utils.stringReplaceAll(result, PLACEHOLDERS.NUM, num);
		result = Utils.stringReplaceAll(result, PLACEHOLDERS.QUOTER, quote.quoter);
		result = Utils.stringReplaceAll(result, PLACEHOLDERS.TIME, quote.time);
		result = Utils.stringReplaceAll(result, PLACEHOLDERS.CATEGORY, quote.category || this.config.noCategory);
		
		// Better put this last, in case the quote contains one of the other placeholders
		result = Utils.stringReplaceAll(result, PLACEHOLDERS.TEXT, quote.text);
		
		return result;
	}
	
	getQuote(data) {
		if (this.quoteCount === 0) {
			this.tellError(data.user, "Oops, we don't have any quotes yet! Try again later?");
			return false;
		}
		
		let num;
		if (data.params.length > 0 && Utils.isNaturalNumberString(data.params[0])) {
			num = Number(data.params[0]);
			if (!Utils.inRange(1, num, this.quoteCount)) {
				this.tellError(data.user, `Could not find quote #${num}. Our quotes only go up to ${this.quoteCount}.`);
				return false;
			}
		} else {
			num = Utils.randomInt(1, this.quoteCount + 1);
		}
		
		let quote = this.data.quotes[num - 1];
		let formattedQuote = this.formatQuote(quote, num);
		
		this.tell(data.user, formattedQuote);
	}
	
	functions = {
		setCategory: {
			name: 'Set Channel Category',
			description: 'Set the current channel category for quote data purposes',
			filters: [
				this.filter.isMod(),
			],
			triggers: [
				this.trigger.command({
					cmdname: 'setcat',
				}),
			],
			action: data => this.setChannelCategory(data),
		},
		
		addQuote: {
			name: 'Add Quote',
			description: 'Add a new quote',
			filters: [
				this.filter.isMod(),
				this.filter.isVIP(),
				this.filter.isSub(),
			],
			triggers: [
				this.trigger.command({
					cmdname: 'yespeak',
				}),
			],
			action: data => this.addQuote(data),
		},
		
		editQuote: {
			name: 'Edit Quote',
			description: 'Edit an existing quote',
			filters: [
				this.filter.isMod(),
				this.filter.isVIP(),
				this.filter.isSub(),
			],
			triggers: [
				this.trigger.command({
					cmdname: 'yedit',
				}),
			],
			action: data => this.editQuote(data),
		},
		
		editCategory: {
			name: 'Edit Quote Category',
			description: 'Edit the category of an existing quote',
			filters: [
				this.filter.isMod(),
			],
			triggers: [
				this.trigger.command({
					cmdname: 'yeditcat',
				}),
			],
			action: data => this.editCategory(data),
		},
		
		getQuote: {
			name: 'Get Quote',
			description: 'Shows a quote (for the given number or a random one if none is given)',
			triggers: [
				this.trigger.command({
					cmdname: 'yespoke',
					aliases: ['quote'],
				}),
			],
			action: data => this.getQuote(data),
		},
	}
}

module.exports = new Quotes();
