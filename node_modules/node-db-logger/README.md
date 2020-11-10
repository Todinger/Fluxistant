# node-db-logger

### Node Database Logger

![GitHub package.json version](https://img.shields.io/github/package-json/v/lachezargrigorov/node-db-logger)
![GitHub](https://img.shields.io/github/license/lachezargrigorov/node-db-logger)
![GitHub All Releases](https://img.shields.io/github/downloads/lachezargrigorov/node-db-logger/total)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/lachezargrigorov/node-db-logger)

A simple database logger. 

- supported databases: MongoDB

All logs are saved into single collection having following structure. 

| property 	        | description    |
|------------------	|--------------- |
| time     	        | log timestamp  |
| identifier     	| identifier 	 |
| type     	        | log type       |
| data              | log data       |

## Installation

`npm install node-db-logger --save`

## How to use

Create logger
- config: configuration object, or string to get reusable logger
- identifier: string, not required - will create a reusable logger if set and will point every record in the collection to this identifier 

```javascript
const logger = require('node-db-logger').createLogger({
  // config 
  mongo: {
    url     : 'mongodb://localhost:27017',
    options : {
      useUnifiedTopology: true
    },
    database: 'demo',
    collection: 'demoLogs'
  }
})

// create reusable logger
require('node-db-logger').createLogger({
  // config 
  mongo: {
    url     : 'mongodb://localhost:27017',
    options : {
      useUnifiedTopology: true
    },
    database: 'demo',
    collection: 'demoLogs'
  }
},'identifier') 

// use it everywhere
const reusableLogger = require('node-db-logger').createLogger('identifier')
```
 
### record(type, ...data)

Create a log record

- type: the value of this parameter will go into the type field of the document
- data: data to be records   

```javascript
const test = 'test'
logger.record('info', 'some ', test, ' string')
logger.record('error', 1)
logger.record('warn', true)
logger.record('debug', {test: 'test'})
logger.record('trace', [1, 2, 3])
logger.record('ClassName::lineNumber or something else', [1, 2, 3], [4, 5, 6], [7, 8, 9])  
```  

### delete(...types)

Delete the log records.   
In use with unidentified logger will delete only unidentified records (identifier = NULL).  
In use with identified reusable logger will delete only the identified records for current identifier.

- types: types to be deleted, will delete all not set

```javascript
// Delete all unidentified records or identified records of current identifier 
logger.delete() 

// Delete all unidentified records or identified records of current identifier of "some type" and "error" 
const type = "some type" 
logger.delete(type, 'error')
```   

### forceDelete(...types)

Same as delete but ignoring the identifier rules.     

### instance.identifier

To get the identifier of this logger.       

## Config

| config           	| required 	| default 	| description     	|
|------------------	|----------	|---------	|-----------------	|
| mongo.url        	| true     	|         	| Connection url  	|
| mongo.options    	| false    	| {}      	| [Mongo Options](https://mongodb.github.io/node-mongodb-native/3.2/api/MongoClient.html)                	|
| mongo.database   	| true     	|         	| Database name   	|
| mongo.collection 	| false    	| logs    	| Collection name 	|   
