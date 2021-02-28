const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const Utils = requireMain('./utils');
const EntityFactory = require('./Config/entityFactory');

// Specifies the location of module-specific configuration entities
const ENTITY_SUFFIX = 'Entity.js';

const REPLACEMENTS = [
	{
		find: /requireMain\s*\(\s*['"]\.\/([^'"]+)['"]\s*\)/gi,
		replace: "require('../../$1')",
	},
	{
		find: /requireConfig\s*\(\s*['"]([^'"]+)['"]\s*\)/gi,
		replace: "require('./$1')",
	},
	{
		find: /requireModConfig\s*\([^,]+,\s*['"]([^'"]+)['"]\s*\)/gi,
		replace: "require('./$1')",
	},
];

class EntityFileManager {
	constructor() {
		this.files = [];
	}
	
	createWebFile(sourceFile, destFile) {
		// fs.copyFileSync(sourceFile, destFile);
		let data = fs.readFileSync(sourceFile, 'utf8');
		REPLACEMENTS.forEach(replacement => {
			data = data.replace(replacement.find, replacement.replace);
		});
		
		fs.writeFileSync(destFile, data, 'utf8');
	}
	
	registerEntities(entitiesPath, generationDir) {
		let entityFiles = Utils.getFileNamesAndPaths(entitiesPath);
		Object.keys(entityFiles).forEach(filename => {
			if (filename.endsWith(ENTITY_SUFFIX)) {
				let filePath = entityFiles[filename];
				
				// Generate files for later use if prompted
				if (generationDir) {
					this.createWebFile(
						filePath,
						path.join(
							generationDir,
							filename));
					
					// Store the name of the file to later be included
					// in the full requirements file
					this.files.push(filename);
				}
				
				let entityClass = require(filePath);
				EntityFactory.processEntityClass(entityClass, filePath);
			}
		});
	}
	
	createRequirementsFile(outputFilePath, relativeGenerationDirPath) {
		let classes = this.files
			.map(filename => {
				let className = _.upperFirst(Utils.baseName(filename));
				return `\t${className}: require('${relativeGenerationDirPath}${filename}'),`;
			});
		
		let fileText =
`const entities = {
${classes.join('\n')}
};

const factory = require('./entityFactory');
const enums = require('../enums');

function registerAll() {
	Object.values(entities).forEach(entity => {
		factory.processEntityClass(entity, 'server');
	});
}

module.exports = {
	Entities: entities,
	Factory: factory,
	RegisterAll: registerAll,
	Enums: enums,
}`;
		
		fs.writeFileSync(outputFilePath, fileText, 'utf8');
	}
}

module.exports = new EntityFileManager();
