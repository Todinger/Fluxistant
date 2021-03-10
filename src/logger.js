const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
const cli = require('./cliManager');
const Globals = require('./globals');
const Utils = require('./utils');

const LOGS_DIR = path.join(Globals.userDir, 'Logs');
Utils.ensureDirExists(LOGS_DIR);

const MESSAGE_FORMAT = winston.format.printf(({ level, message, timestamp }) => {
	return `<${timestamp}> ${level}: ${message}`;
});

class Logger {
	constructor() {
		cli.on(['l', 'log', 'clog'], (level) => this.setConsoleLevel(level));
		cli.on(['flog', 'fl'], (level) => this.setFileLevel(level));
		
		['info', 'warn', 'error', 'debug'].forEach(
			level => cli.on([level], () => this.setConsoleLevel(level)));
		
		Globals.Logger = this;
	}
	
	init() {
		this.transports = {
			console: new winston.transports.Console({
				level: 'warn',
				format: winston.format.combine(
					winston.format.colorize(),
					winston.format.timestamp({ format: 'HH:mm:ss' }),
					MESSAGE_FORMAT,
				),
			}),
			file: new winston.transports.DailyRotateFile({
				level: 'info',
				format: winston.format.combine(
					winston.format.timestamp({ format: 'YYYY.MM.DD-HH:mm:ss' }),
					MESSAGE_FORMAT,
				),
				
				filename: `${LOGS_DIR}/%DATE%.log`,
				datePattern: 'YYYY.MM.DD',
				maxSize: '20m',
				maxFiles: '7d',
			}),
		};
		
		this.logger = winston.createLogger({
			level: 'info',
			transports: Object.values(this.transports),
		});
	}
	
	info(...params) {
		this.logger.info(...params);
	}
	
	warn(...params) {
		this.logger.warn(...params);
	}
	
	error(...params) {
		this.logger.error(...params);
	}
	
	debug(...params) {
		this.logger.debug(...params);
	}
	
	setFileLevel(level) {
		this.transports.file.level = level;
	}
	
	setConsoleLevel(level) {
		this.transports.console.level = level;
	}
}

module.exports = new Logger();
