 
/**
 *
 * @module openiod-mongodb
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

// var async 			= require('async');

var MongoClient = require('mongodb').MongoClient
   // , mongojs = require('mongojs')
    , format = require('util').format;
	
var sqlConnString;

var	initPgDbConnection = function (options) {
	// PostgreSql
	//console.log(options);
	sqlConnString = options.param.systemParameter.databaseType + '://' + 
		options.param.systemParameter.databaseAccount + ':' + 
		options.param.systemParameter.databasePassword + '@' + 
		options.param.systemParameter.databaseServer + '/' +
		options.param.systemCode + '_' + options.param.systemParameter.databaseName;

};
	
function executeSql (query, callback) {
	console.log('sql start: ');
	var client = new pg.Client(sqlConnString);
	client.connect(function(err) {
  		if(err) {
    		console.error('could not connect to postgres', err);
			callback(result, err);
			return;
  		}
  		client.query(query, function(err, result) {
    		if(err) {
      			console.error('error running query', err);
				callback(result, err);
				return;
    		}
    		//console.log('sql result: ' + result);
			callback(result.rows, err);
    		client.end();
  		});
	});
};

var client;

var database;

var self;



module.exports = {

	init: function (name, param, callback) {
		console.log('mongoDB init:' + name);	
		MongoClient.connect('mongodb://149.210.201.210:27017/openiod', function(err, db) {
			console.log('mongoDB connect:' + err);
 	  	 	if(err) throw err;

			database = db;
			
			console.log('mongoDB database:' + database);

			if(callback != undefined) callback();

  		});
		

	},  // end of init
	
	connectDb: function (name, option, callback) {
			
		MongoClient.connect('mongodb://149.210.201.210:27017/'+name, function(err, db) {
 	  	 	if(err) throw err;
			callback(db, option);
  		});
		

	},  // end of init
	

	removeCollectionRecord: function(param, callback) {
		this.connectDb('openiod', {collectionName: param.collectionName, location:param.location }, this.executeRemoveCollectionRecord);
	},

	executeRemoveCollectionRecord: function(db, option) {

		var _collectionNameImport 	= option.collectionName+'_import';	
		var collection = database.collection(_collectionNameImport);
		//collection.remove({}, function(err, removed) {
		//	console.log('Deleted from import collection: %s', removed);
		//console.log('Insert into collection: %s', collectionName);
		collection.remove({}, function(err, removed) {
			if (err) {
				console.log('mongodb remove err: ' + err);
			}
			//console.log('Inserted into collection: %s', collectionName);
			//option.callback(err, removed);		
		});
		//});
		
	},


	saveCollectionRecord: function(collectionName, recordObject, callback) {
	
		var collection = database.collection(collectionName);
		//collection.remove({}, function(err, removed) {
		//	console.log('Deleted from import collection: %s', removed);
		//console.log('Insert into collection: %s', collectionName);
		collection.insert(recordObject, function(err, docs) {
			if (err) {
				console.log('mongodb insert err: ' + err);
			}
			//console.log('Inserted into collection: %s', collectionName);
			callback(err, docs);		
			
				//	counter--;
				//	if (counter <= 0) {
				//		console.log('Counter is ' + counter + ' closing the database.');
				//		db.close();
				//		callback();
				//	}

				//	if (counter <= 10) {
				//		console.log('Counter is ' + counter );
				//	}
					
					
      			//	collection.count(function(err, count) {
        		//		console.log(format("count = %s", count));
		});
		//});
		
	},

	dropCollection: function(collectionName, option, callback) {
	
		var collection = database.collection(collectionName);
		collection.drop(callback);
		
	},


	insertHumanSensorTransActionQueue: function(option, callback) {
	
		// "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=executeinsertom&objectid=humansensor&format=xml&region=EHV&neighborhoodcode=undefined&citycode=undefined&observation=airquality:01,noicestress:02,trafficstress:02,odorstress:03"
		option.context = this;
		this.connectDb('openiod', {project_code:option.query.project_code, region_code:option.query.region_code, neighborhood_code: option.query.neighborhood_code, city_code: option.query.city_code, observation: option.query.observation, callback: callback, context:this }, this.insertHumanSensorTransactionQueueMd );
	
	},

	insertHumanSensorTransactionQueueMd: function(db, param) {
		var _collectionName	= "human_sensor_transaction_queue";
		var collectionTransactionQueue 	= db.collection(_collectionName);
		
		var newRecord = {};
		//newRecord._id = { location: "NL", id:data._id.recordId };
		newRecord.project_code			= param.project_code;
		newRecord.region_code			= param.region_code;
		newRecord.city_code				= param.city_code; 
		newRecord.neighborhood_code		= param.neighborhood_code;
		newRecord.observation			= {};
	    newRecord.creation_datetime		= new Date();

		var _observations				= param.observation.split(',');
		for (var i=0;i<_observations.length;i++) {
			var _observationArray	= _observations[i].split(':');
			var _observationKey		= _observationArray[0];
			var _observationValue	= _observationArray[1];
			newRecord.observation[_observationKey]	= _observationValue;
		}
		collectionTransactionQueue.insert(newRecord);
	},
	
	getHumanSensorResult24h: function(option, callback) {
//		console.log(option);
//		console.log(callback);
		option.context = this;
		this.connectDb('openiod', { callback: callback, context:this }, this.getHumanSensorResult24hMd );
	},			
	getHumanSensorResult24hMd: function(db, param) {
		//console.log(param);
		var _collectionName	= "humansensor24h";
		var collection 	= db.collection(_collectionName);
		
		var result = collection.find({},{limit:1,sort:[["_id",'desc']]}).toArray(function(err, docs){
			//console.log("retrieved records:");
    		//console.log(docs);
			param.callback(docs[0]);
		});


 ; //.sort({_id:-1}).limit(1,param.callback);
		//console.log(result);
		//param.callback(result);
	}
	
} // end of module.exports
