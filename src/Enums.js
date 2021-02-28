const Enums = {};   

// Keyboard keycodes, used to register key shortcuts and events in
// KeyboardManager
Enums.KEYCODES = {
	VC_ESCAPE: { value: 0x0001, name: 'Escape', htmlCode: 'Escape' },
	
	// Begin Function Keys
	VC_F1: { value: 0x003B, name: 'F1', htmlCode: 'F1' },
	VC_F2: { value: 0x003C, name: 'F2', htmlCode: 'F2' },
	VC_F3: { value: 0x003D, name: 'F3', htmlCode: 'F3' },
	VC_F4: { value: 0x003E, name: 'F4', htmlCode: 'F4' },
	VC_F5: { value: 0x003F, name: 'F5', htmlCode: 'F5' },
	VC_F6: { value: 0x0040, name: 'F6', htmlCode: 'F6' },
	VC_F7: { value: 0x0041, name: 'F7', htmlCode: 'F7' },
	VC_F8: { value: 0x0042, name: 'F8', htmlCode: 'F8' },
	VC_F9: { value: 0x0043, name: 'F9', htmlCode: 'F9' },
	VC_F10: { value: 0x0044, name: 'F10', htmlCode: 'F10' },
	VC_F11: { value: 0x0057, name: 'F11', htmlCode: 'F11' },
	VC_F12: { value: 0x0058, name: 'F12', htmlCode: 'F12' },
	
	VC_F13: { value: 0x005B, name: 'F13', htmlCode: 'F13' },
	VC_F14: { value: 0x005C, name: 'F14', htmlCode: 'F14' },
	VC_F15: { value: 0x005D, name: 'F15', htmlCode: 'F15' },
	VC_F16: { value: 0x0063, name: 'F16', htmlCode: 'F16' },
	VC_F17: { value: 0x0064, name: 'F17', htmlCode: 'F17' },
	VC_F18: { value: 0x0065, name: 'F18', htmlCode: 'F18' },
	VC_F19: { value: 0x0066, name: 'F19', htmlCode: 'F19' },
	VC_F20: { value: 0x0067, name: 'F20', htmlCode: 'F20' },
	VC_F21: { value: 0x0068, name: 'F21', htmlCode: 'F21' },
	VC_F22: { value: 0x0069, name: 'F22', htmlCode: 'F22' },
	VC_F23: { value: 0x006A, name: 'F23', htmlCode: 'F23' },
	VC_F24: { value: 0x006B, name: 'F24', htmlCode: 'F24' },
	// End Function Keys
	
	
	// Begin Alphanumeric Zone
	VC_BACKQUOTE: { value: 0x0029, name: 'Backquote', htmlCode: 'Backquote' },
	
	VC_1: { value: 0x0002, name: '1', htmlCode: 'Digit1' },
	VC_2: { value: 0x0003, name: '2', htmlCode: 'Digit2' },
	VC_3: { value: 0x0004, name: '3', htmlCode: 'Digit3' },
	VC_4: { value: 0x0005, name: '4', htmlCode: 'Digit4' },
	VC_5: { value: 0x0006, name: '5', htmlCode: 'Digit5' },
	VC_6: { value: 0x0007, name: '6', htmlCode: 'Digit6' },
	VC_7: { value: 0x0008, name: '7', htmlCode: 'Digit7' },
	VC_8: { value: 0x0009, name: '8', htmlCode: 'Digit8' },
	VC_9: { value: 0x000A, name: '9', htmlCode: 'Digit9' },
	VC_0: { value: 0x000B, name: '0', htmlCode: 'Digit0' },
	
	VC_MINUS: { value: 0x000C, name: 'Minus', htmlCode: 'Minus' },	// '-'
	VC_EQUALS: { value: 0x000D, name: 'Equals', htmlCode: 'Equal' },	// '='
	VC_BACKSPACE: { value: 0x000E, name: 'Backspace', htmlCode: 'Backspace' },
	
	VC_TAB: { value: 0x000F, name: 'Tab', htmlCode: 'Tab' },
	VC_CAPS_LOCK: { value: 0x003A, name: 'Caps Lock', htmlCode: 'CapsLock' },
	
	VC_A: { value: 0x001E, name: 'A', htmlCode: 'KeyA' },
	VC_B: { value: 0x0030, name: 'B', htmlCode: 'KeyB' },
	VC_C: { value: 0x002E, name: 'C', htmlCode: 'KeyC' },
	VC_D: { value: 0x0020, name: 'D', htmlCode: 'KeyD' },
	VC_E: { value: 0x0012, name: 'E', htmlCode: 'KeyE' },
	VC_F: { value: 0x0021, name: 'F', htmlCode: 'KeyF' },
	VC_G: { value: 0x0022, name: 'G', htmlCode: 'KeyG' },
	VC_H: { value: 0x0023, name: 'H', htmlCode: 'KeyH' },
	VC_I: { value: 0x0017, name: 'I', htmlCode: 'KeyI' },
	VC_J: { value: 0x0024, name: 'J', htmlCode: 'KeyJ' },
	VC_K: { value: 0x0025, name: 'K', htmlCode: 'KeyK' },
	VC_L: { value: 0x0026, name: 'L', htmlCode: 'KeyL' },
	VC_M: { value: 0x0032, name: 'M', htmlCode: 'KeyM' },
	VC_N: { value: 0x0031, name: 'N', htmlCode: 'KeyN' },
	VC_O: { value: 0x0018, name: 'O', htmlCode: 'KeyO' },
	VC_P: { value: 0x0019, name: 'P', htmlCode: 'KeyP' },
	VC_Q: { value: 0x0010, name: 'Q', htmlCode: 'KeyQ' },
	VC_R: { value: 0x0013, name: 'R', htmlCode: 'KeyR' },
	VC_S: { value: 0x001F, name: 'S', htmlCode: 'KeyS' },
	VC_T: { value: 0x0014, name: 'T', htmlCode: 'KeyT' },
	VC_U: { value: 0x0016, name: 'U', htmlCode: 'KeyU' },
	VC_V: { value: 0x002F, name: 'V', htmlCode: 'KeyV' },
	VC_W: { value: 0x0011, name: 'W', htmlCode: 'KeyW' },
	VC_X: { value: 0x002D, name: 'X', htmlCode: 'KeyX' },
	VC_Y: { value: 0x0015, name: 'Y', htmlCode: 'KeyY' },
	VC_Z: { value: 0x002C, name: 'Z', htmlCode: 'KeyZ' },
	
	VC_OPEN_BRACKET: { value: 0x001A, name: 'Open Bracket', htmlCode: 'BracketLeft' },	// '['
	VC_CLOSE_BRACKET: { value: 0x001B, name: 'Close Bracket', htmlCode: 'BracketRight' },	// ']'
	VC_BACK_SLASH: { value: 0x002B, name: 'Back Slash', htmlCode: 'Backslash' },	// '\'
	
	VC_SEMICOLON: { value: 0x0027, name: 'Semicolon', htmlCode: 'Semicolon' },	// ';'
	VC_QUOTE: { value: 0x0028, name: 'Quote', htmlCode: 'Quote' },
	VC_ENTER: { value: 0x001C, name: 'Enter', htmlCode: 'Enter' },
	
	VC_COMMA: { value: 0x0033, name: 'Comma', htmlCode: 'Comma' },	// ','
	VC_PERIOD: { value: 0x0034, name: 'Period', htmlCode: 'Period' },	// '.'
	VC_SLASH: { value: 0x0035, name: 'Slash', htmlCode: 'Slash' },	// '/'
	
	VC_SPACE: { value: 0x0039, name: 'Space', htmlCode: 'Space' },
	// End Alphanumeric Zone
	
	
	VC_PRINTSCREEN: { value: 0x0E37, name: 'Print Screen', htmlCode: 'PrintScreen' },
	VC_SCROLL_LOCK: { value: 0x0046, name: 'Scroll Lock', htmlCode: 'ScrollLock' },
	VC_PAUSE: { value: 0x0E45, name: 'Pause', htmlCode: 'Pause' },
	
	
	// Begin Edit Key Zone
	VC_INSERT: { value: 0xEE52, name: 'Insert', htmlCode: 'Insert' },
	VC_DELETE: { value: 0xEE53, name: 'Delete', htmlCode: 'Delete' },
	VC_HOME: { value: 0xEE47, name: 'Home', htmlCode: 'Home' },
	VC_END: { value: 0xEE4F, name: 'End', htmlCode: 'End' },
	VC_PAGE_UP: { value: 0xEE49, name: 'Page Up', htmlCode: 'PageUp' },
	VC_PAGE_DOWN: { value: 0xEE51, name: 'Page Down', htmlCode: 'PageDown' },
	// End Edit Key Zone
	
	
	// Begin Cursor Key Zone
	VC_UP: { value: 0xEE48, name: 'Up', htmlCode: 'ArrowUp' },
	VC_LEFT: { value: 0xEE4B, name: 'Left', htmlCode: 'ArrowLeft' },
	VC_CLEAR: { value: 0xEE4C, name: 'Clear', htmlCode: '' },
	VC_RIGHT: { value: 0xEE4D, name: 'Right', htmlCode: 'ArrowRight' },
	VC_DOWN: { value: 0xEE50, name: 'Down', htmlCode: 'ArrowDown' },
	// End Cursor Key Zone
	
	
	// Begin Numeric Zone
	VC_NUM_LOCK: { value: 0x0045, name: 'Num Lock', htmlCode: 'NumLock' },
	VC_KP_DIVIDE: { value: 0x0E35, name: 'Numpad /', htmlCode: 'NumpadDivide' },
	VC_KP_MULTIPLY: { value: 0x0037, name: 'Numpad *', htmlCode: 'NumpadMultiply' },
	VC_KP_SUBTRACT: { value: 0x004A, name: 'Numpad -', htmlCode: 'NumpadSubtract' },
	VC_KP_EQUALS: { value: 0x0E0D, name: 'Numpad =', htmlCode: 'NumpadEqual' },
	VC_KP_ADD: { value: 0x004E, name: 'Numpad +', htmlCode: 'NumpadAdd' },
	VC_KP_ENTER: { value: 0x0E1C, name: 'Numpad Enter', htmlCode: 'NumpadEnter' },
	VC_KP_SEPARATOR: { value: 0x0053, name: 'Numpad Period', htmlCode: 'NumpadDecimal:On' },
	
	VC_KP_1: { value: 0x004F, name: 'Numpad 1', htmlCode: 'Numpad1:On' },
	VC_KP_2: { value: 0x0050, name: 'Numpad 2', htmlCode: 'Numpad2:On' },
	VC_KP_3: { value: 0x0051, name: 'Numpad 3', htmlCode: 'Numpad3:On' },
	VC_KP_4: { value: 0x004B, name: 'Numpad 4', htmlCode: 'Numpad4:On' },
	VC_KP_5: { value: 0x004C, name: 'Numpad 5', htmlCode: 'Numpad5:On' },
	VC_KP_6: { value: 0x004D, name: 'Numpad 6', htmlCode: 'Numpad6:On' },
	VC_KP_7: { value: 0x0047, name: 'Numpad 7', htmlCode: 'Numpad7:On' },
	VC_KP_8: { value: 0x0048, name: 'Numpad 8', htmlCode: 'Numpad8:On' },
	VC_KP_9: { value: 0x0049, name: 'Numpad 9', htmlCode: 'Numpad9:On' },
	VC_KP_0: { value: 0x0052, name: 'Numpad 0', htmlCode: 'Numpad0:On' },
	
	VC_KP_END: { value: 0x0E00 | 0x004F, name: 'Numpad End', htmlCode: 'Numpad1' },
	VC_KP_DOWN: { value: 0xE000 | 0x0050, name: 'Numpad Down', htmlCode: 'Numpad2' },
	VC_KP_PAGE_DOWN: { value: 0x0E00 | 0x0051, name: 'Numpad Page Down', htmlCode: 'Numpad3' },
	VC_KP_LEFT: { value: 0xE000 | 0x004B, name: 'Numpad Left', htmlCode: 'Numpad4' },
	VC_KP_CLEAR: { value: 0x0E00 | 0x004C, name: 'Numpad Clear', htmlCode: 'Numpad5' },
	VC_KP_RIGHT: { value: 0xE000 | 0x004D, name: 'Numpad Right', htmlCode: 'Numpad6' },
	VC_KP_HOME: { value: 0x0E00 | 0x0047, name: 'Numpad Home', htmlCode: 'Numpad7' },
	VC_KP_UP: { value: 0xE000 | 0x0048, name: 'Numpad Up', htmlCode: 'Numpad8' },
	VC_KP_PAGE_UP: { value: 0x0E00 | 0x0049, name: 'Numpad Page Up', htmlCode: 'Numpad9' },
	VC_KP_INSERT: { value: 0x0E00 | 0x0052, name: 'Numpad Insert', htmlCode: 'Numpad0' },
	VC_KP_DELETE: { value: 0x0E00 | 0x0053, name: 'Numpad Delete', htmlCode: 'NumpadDecimal' },
	// End Numeric Zone
	
	
	// Begin Modifier and Control Keys
	VC_SHIFT_L: { value: 0x002A, name: 'Left Shift', htmlCode: 'ShiftLeft' },
	VC_SHIFT_R: { value: 0x0036, name: 'Right Shift', htmlCode: 'ShiftRight' },
	VC_CONTROL_L: { value: 0x001D, name: 'Left Control', htmlCode: 'ControlLeft' },
	VC_CONTROL_R: { value: 0x0E1D, name: 'Right Control', htmlCode: 'ControlRight' },
	VC_ALT_L: { value: 0x0038, name: 'Left Alt', htmlCode: 'AltLeft' },	// Option or Alt Key
	VC_ALT_R: { value: 0x0E38, name: 'Left Alt', htmlCode: 'AltRight' },	// Option or Alt Key
	VC_META_L: { value: 0x0E5B, name: 'Left Meta / WinKey', htmlCode: 'MetaLeft' },	// Windows or Command Key
	VC_META_R: { value: 0x0E5C, name: 'Right Meta / WinKey', htmlCode: 'MetaRight' },	// Windows or Command Key
	VC_CONTEXT_MENU: { value: 0x0E5D, name: 'Context Menu', htmlCode: 'ContextMenu' },
	// End Modifier and Control Keys
	
	
	// Begin Media Control Keys
	VC_POWER: { value: 0xE05E, name: 'Power', htmlCode: 'Power' },
	VC_SLEEP: { value: 0xE05F, name: 'Sleep', htmlCode: 'Sleep' },
	VC_WAKE: { value: 0xE063, name: 'Wake', htmlCode: 'WakeUp' },
	
	VC_MEDIA_PLAY: { value: 0xE022, name: 'Media Play', htmlCode: 'MediaPlayPause' },
	VC_MEDIA_STOP: { value: 0xE024, name: 'Media Stop', htmlCode: 'MediaStop' },
	VC_MEDIA_PREVIOUS: { value: 0xE010, name: 'Media Previous', htmlCode: 'MediaTrackPrevious' },
	VC_MEDIA_NEXT: { value: 0xE019, name: 'Media Next', htmlCode: 'MediaTrackNext' },
	VC_MEDIA_SELECT: { value: 0xE06D, name: 'Media Select', htmlCode: 'MediaSelect' },
	VC_MEDIA_EJECT: { value: 0xE02C, name: 'Media Eject', htmlCode: 'Eject' },
	
	VC_VOLUME_MUTE: { value: 0xE020, name: 'Volume Mute', htmlCode: 'AudioVolumeMute' },
	VC_VOLUME_UP: { value: 0xE030, name: 'Volume Up', htmlCode: 'AudioVolumeUp' },
	VC_VOLUME_DOWN: { value: 0xE02E, name: 'Volume Down', htmlCode: 'AudioVolumeDown' },
	
	VC_APP_MAIL: { value: 0xE06C, name: 'App Mail', htmlCode: 'LaunchMail' },
	VC_APP_CALCULATOR: { value: 0xE021, name: 'App Calculator', htmlCode: 'LaunchApp2' },
	VC_APP_MUSIC: { value: 0xE03C, name: 'App Music', htmlCode: '' },
	VC_APP_PICTURES: { value: 0xE064, name: 'App Pictures', htmlCode: '' },
	
	VC_BROWSER_SEARCH: { value: 0xE065, name: 'Browser Search', htmlCode: 'BrowserSearch' },
	VC_BROWSER_HOME: { value: 0xE032, name: 'Browser Home', htmlCode: 'BrowserHome' },
	VC_BROWSER_BACK: { value: 0xE06A, name: 'Browser Back', htmlCode: 'BrowserBack' },
	VC_BROWSER_FORWARD: { value: 0xE069, name: 'Browser Forward', htmlCode: 'BrowserForward' },
	VC_BROWSER_STOP: { value: 0xE068, name: 'Browser Stop', htmlCode: 'BrowserStop' },
	VC_BROWSER_REFRESH: { value: 0xE067, name: 'Browser Refresh', htmlCode: 'BrowserRefresh' },
	VC_BROWSER_FAVORITES: { value: 0xE066, name: 'Browser Favorites', htmlCode: 'BrowserFavorites' },
	// End Media Control Keys
	
	// Begin Japanese Language Keys
	VC_KATAKANA: { value: 0x0070, name: 'Katakana', htmlCode: 'Katakana' },
	VC_UNDERSCORE: { value: 0x0073, name: 'Underscore', htmlCode: '' },
	VC_FURIGANA: { value: 0x0077, name: 'Furigana', htmlCode: '' },
	VC_KANJI: { value: 0x0079, name: 'Kanji', htmlCode: '' },
	VC_HIRAGANA: { value: 0x007B, name: 'Hiragana', htmlCode: 'Hiragana' },
	VC_YEN: { value: 0x007D, name: 'Yen', htmlCode: 'IntlYen' },
	VC_KP_COMMA: { value: 0x007E, name: 'Kp_comma', htmlCode: 'NumpadComma' },
	// End Japanese Language Keys
	
	// Begin Sun keyboards
	VC_SUN_HELP: { value: 0xFF75, name: 'Sun Help', htmlCode: 'Help' },
	
	VC_SUN_STOP: { value: 0xFF78, name: 'Sun Stop', htmlCode: '' },
	VC_SUN_PROPS: { value: 0xFF76, name: 'Sun Props', htmlCode: 'Props' },
	VC_SUN_FRONT: { value: 0xFF77, name: 'Sun Front', htmlCode: '' },
	VC_SUN_OPEN: { value: 0xFF74, name: 'Sun Open', htmlCode: 'Open' },
	VC_SUN_FIND: { value: 0xFF7E, name: 'Sun Find', htmlCode: 'Find' },
	VC_SUN_AGAIN: { value: 0xFF79, name: 'Sun Again', htmlCode: 'Again' },
	VC_SUN_UNDO: { value: 0xFF7A, name: 'Sun Undo', htmlCode: 'Undo' },
	VC_SUN_COPY: { value: 0xFF7C, name: 'Sun Copy', htmlCode: 'Copy' },
	VC_SUN_INSERT: { value: 0xFF7D, name: 'Sun Insert', htmlCode: 'Select' },
	VC_SUN_CUT: { value: 0xFF7B, name: 'Sun Cut', htmlCode: 'Cut' },
	// End Sun keyboards
	
	VC_UNDEFINED: { value: 0x0000, name: 'Undefined', htmlCode: '' },	// KeyCode Unknown
	
	CHAR_UNDEFINED: { value: 0xFFFF, name: 'Undefined', htmlCode: 'Unknown Key' },	// KeyCode Unknown
	// CHAR_UNDEFINED: 0xFFFF,	// CharCode Unknown
};

Enums.KEYCODES_BY_VALUE = {};// = Object.values(Enums.KEYCODES).map(key => key.value);
Enums.KEYCODES_BY_HTML = {};

let KEY_PREFIX = 'VC_';
Object.keys(Enums.KEYCODES).forEach(key => {
	if (key.startsWith(KEY_PREFIX)) {
		Enums.KEYCODES[key].shortID = key.slice(KEY_PREFIX.length);
	}
	Enums.KEYCODES_BY_VALUE[Enums.KEYCODES[key].value] = key;
	let htmlCode = Enums.KEYCODES[key].htmlCode;
	if (htmlCode !== '') {
		Enums.KEYCODES_BY_HTML[htmlCode] = key;
	} else {
		Enums.KEYCODES_BY_HTML[htmlCode] = 'CHAR_UNDEFINED';
	}
});

Enums.fromShortID = (shortID) => {
	if (shortID === 'CHAR_UNDEFINED') {
		return Enums.KEYCODES[shortID];
	} else {
		return Enums.KEYCODES[KEY_PREFIX + shortID];
	}
};

Enums.htmlCodeToShortID = (htmlCode) => {
	let keyID = Enums.KEYCODES_BY_HTML[htmlCode];
	if (keyID === 'CHAR_UNDEFINED') {
		return 'CHAR_UNDEFINED';
	} else {
		return Enums.KEYCODES[keyID].shortID;
	}
};

Enums.withNumLock = (htmlCode, numpadOn) => {
	let isNumpadKey = (htmlCode + ':On') in Enums.KEYCODES_BY_HTML;
	if (isNumpadKey && numpadOn) {
		return htmlCode + ':On';
	} else {
		return htmlCode;
	}
};

module.exports = Enums;
