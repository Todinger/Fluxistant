const Variable = require('./Variables/functionVariable');

const GlobalVars = [
	new Variable({
		name: 'Username ($user)',
		description: 'The name of the user who used the command.',
		example: 'If !hi gives the text "Hello, $user!" then when a user called Arya types !hi in the chat, the bot will say: "Hello, Arya!"',
		
		expr: '$user',
		replacement: data => data.context.user.displayName,
	}),
	
	new Variable({
		name: 'Command Argument ($1, $2, $3, ...)',
		description: 'Returns one of the arguments used to invoke the command. Accepts any number as the index.',
		example: 'For !somecommand defined to say "$1 is better than $4", writing "!somecommand Hello, how are you?" will produce: "Hello, is better than you?"',
		
		expr: /\$(\d+)/,
		replacement: data => {
			let args = data.context.params.in;
			let num = Number(data.matchData[1]);
			if (1 <= num && num <= args.length && args[num - 1] !== undefined) {
				return args[num - 1];
			} else {
				return data.matchString; // Return the expression unchanged
			}
		},
	}),
	
	new Variable({
		name: 'All Command Arguments ($all)',
		description: 'Returns everything following the command name in the command invocation.',
		example: 'For !somecommand defined to say "You said \'$all"\', writing "!somecommand Hello, how are you?" will produce: "You said \'Hello, is better than you?\'"',
		
		expr: '$all',
		replacement: data => {
			if (data.context.params.in.length > 0 && data.context.params.in[0] !== undefined) {
				return data.context.params.in.join(' ');
			} else {
				return data.matchString; // Return the expression unchanged
			}
		},
	}),
];

module.exports = GlobalVars;
