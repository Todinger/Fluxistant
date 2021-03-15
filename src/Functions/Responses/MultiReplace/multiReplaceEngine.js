const TextSegment = require('./textSegment');

function replaceVariables(variables, message, context) {
	if (variables) {
		let processedMessage = new TextSegment(message);
		variables.forEach(variable => {
			processedMessage = processedMessage.process(variable, context);
		});
		
		return processedMessage.toString();
	} else {
		return message;
	}
}

module.exports = replaceVariables;
