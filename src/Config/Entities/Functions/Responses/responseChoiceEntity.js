const ChoiceEntity = require('../../choiceEntity');

class ResponseChoiceEntity extends ChoiceEntity {
	static get TYPE()		{ return 'ResponseChoice'; 					}
	static get GUITYPE()	{ return 'ExpandableChoice'; 				}
	static get BUILDER()	{ return () => new ResponseChoiceEntity(); 	}
	
	constructor() {
		super();
		this._addOptions({
			["console"]:	    'Response_Console',
			["chat"]:		    'Response_Chat',
			["chatRandom"]:		'Response_RandomChat',
			["streamerChat"]:	'Response_StreamerChat',
			["se"]:			    'Response_SE',
		});
	}
}

module.exports = ResponseChoiceEntity;
