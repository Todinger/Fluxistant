const TextSegment = require('./textSegment');

function replaceVariables(variables, message, context) {
	let replacedMessage = message;
	if (variables) {
		let continueProcessing = true;
		while (continueProcessing) {
			continueProcessing = false;
			
			let processedMessage = new TextSegment(replacedMessage);
			variables.forEach(variable => {
				let { result, reprocess } = processedMessage.process(variable, context);
				processedMessage = result;
				continueProcessing = continueProcessing || reprocess;
			});
			
			replacedMessage = processedMessage.toString();
		}
	}
	
	return replacedMessage;
}

module.exports = replaceVariables;
