
/**
 *
 * @module openiod-mongodb
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

// var async 			= require('async');

var MongoClient = require('mongodb').MongoClient
    //, mongojs = require('mongojs')
    , format = require('util').format;

var client;
var database;
var self;

module.exports = {

	init: function (name, param, callback) {
		console.log('mongoDB init:' + name);
		//Connect to the cluster
//		MongoClient.connect('mongodb://192.168.0.92:27017/openiod', function(err, db) {
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
	},  // end of connectDb

	closeDb: function () {
		database.close();
	},  // end of closeMongoClient

	removeCollectionRecord: function(param, callback) {
		this.connectDb('openiod', {collectionName: param.collectionName, location:param.location }, this.executeRemoveCollectionRecord);
	},

	executeRemoveCollectionRecord: function(db, option) {

		var _collectionNameImport 	= option.collectionName+'_import';
		var collection = database.collection(_collectionNameImport);
		collection.remove({}, function(err, removed) {
			if (err) {
				console.log('mongodb remove err: ' + err);
			}
		});
	},

	saveCollectionRecord: function(collectionName, recordObject, callback) {
		var collection = database.collection(collectionName);
		collection.insert(recordObject, function(err, docs) {
			if (err) {
				console.log('mongodb insert err: ' + err);
			}
			callback(err, docs);
		});
	},

	dropCollection: function(collectionName, option, callback) {
		var collection = database.collection(collectionName);
		collection.drop(callback);
	},

	datex2Import2Model: function (param, callback) {
		self = this;
		console.log('Connect to database for import %s %s', param.collectionName, param.location);
		if (param.collectionName == 'NDW_siteTable' ) {
			this.connectDb('openiod', {collectionName: param.collectionName, location:param.location }, this.datex2ImportSiteTable2ModelProcessing);
		} else {
			this.connectDb('openiod', {collectionName: param.collectionName, location:param.location }, this.datex2Import2ModelProcessing);
		}
	},

	datex2ImportSiteTable2ModelProcessing: function (db, option) {
		var _collectionNameImport 	= option.collectionName+'_import';
		var _collectionName 		= option.collectionName;

		var lat,lng;

		var collectionIn 		= db.collection(_collectionNameImport);
		//var collectionOut 	= db.collection(_collectionName);
		console.log('%s %s', _collectionName, 'x' );

		db.createCollection(_collectionName, function(err, collectionOut) {

			console.log('Start removing current data');
			collectionOut.remove({"_id.location":option.location}, function(err, nrRecords) {
				if (err) { console.log(err); return};
				console.log('End removing current data');
				console.log('Start creating bulk insert for new data');
				var bulk = collectionOut.initializeUnorderedBulkOp();

				var recordCountIn 	= 0;
				var recordCountOut 	= 0;

				var stream = collectionIn.find().stream();

				// Execute find on all the documents
				stream.on('end', function() {
					console.log('End Total items processed: %s (%s)', recordCountIn, recordCountOut);
					console.log('Start bulk execute');
					bulk.execute(function(err, bulkResult){
						console.log('End bulk execute %s', err);
						console.log(bulkResult.isOk() );
						db.close();
					});
					console.log('Bulk execute activated');

				});

				stream.on('data', function(data) {
					//assert.ok(data != null);
					lat = 0;
					lng = 0;


					var newRecord = {};
					newRecord._id = { location: "NL", id:data._id.recordId };

					newRecord = self.datex2Import2Model_NDW_siteTable(newRecord, data);
					if (newRecord.lat >= 51.388 && newRecord.lat <= 51.53 &&
						newRecord.lng >= 5.300 && newRecord.lng <= 5.61 ) {
						// Eindhoven
						var newRecordEHV = Object.create(newRecord);
						newRecordEHV._id.location = 'EHV';
						bulk.insert( newRecordEHV );
						recordCountOut++;
					}

//					if (newRecord.lat >= 52.9325151469765 && newRecord.lat <= 53.0619202709735 &&
//						newRecord.lng >= 6.48394723197304 && newRecord.lng <= 6.63264599587745 ) {
					if (newRecord.lat >= 52.92 && newRecord.lat <= 53.10 &&
						newRecord.lng >= 6.45 && newRecord.lng <= 6.65 ) {
						// Assen: "POLYGON((6.48394723197304 52.9325151469765,6.48394723197304 53.0619202709735,6.63264599587745 53.0619202709735,6.63264599587745 52.9325151469765,6.48394723197304 52.9325151469765))"
						var newRecordASS = Object.create(newRecord);
						newRecordASS._id.location = 'ASS';
						bulk.insert( newRecordASS );
						recordCountOut++;
					}

					if (newRecord.lat >= 51.95 && newRecord.lat <= 52.05 &&
						newRecord.lng >= 4.28 && newRecord.lng <= 4.45 ) {
						// Delft: "POLYGON((4.32021774343079 51.9663162404985,4.32021774343079 52.0325992360215,4.4079112385328 52.0325992360215,4.4079112385328 51.9663162404985,4.32021774343079 51.9663162404985))"
						var newRecordDLF = Object.create(newRecord);
						newRecordDLF._id.location = 'DLF';
						bulk.insert( newRecordDLF );
						recordCountOut++;
					}

//					if (newRecord.lat >= 50.0 && newRecord.lat <= 52.2 && newRecord.lng >= 5.0 && newRecord.lng <= 6.0 ) {
//						newRecord._id.location = '';
//						if (newRecord._id.location == option.location ) {
//							bulk.insert( newRecord );
//							recordCountOut++;
//						}
//					}
//					if (newRecord._id.location == option.location ) {

//					newRecord._id.location = 'NL';
//					bulk.insert( newRecord );
//					recordCountOut++;


					recordCountIn++;
					if (recordCountIn%1000==0) {
						console.log('       items processed: %s (%s)', recordCountIn, recordCountOut);
					}

				});

			});

		});

	},


	datex2Import2ModelProcessing: function (db, option) {
		var _collectionNameImport = option.collectionName+'_import';
		var _collectionName = option.collectionName;

		var NDW_siteTable = db.collection('NDW_siteTable');

		var lat,lng;

		var _retrievedDate = new Date();

		var collectionIn 		= db.collection(_collectionNameImport);
		var collectionOut 		= db.collection(_collectionName);
//		console.log('%s %s', _collectionName, 'x' );

		db.createCollection(_collectionName, function(err, collectionOut) {
			if (err) { console.log(err); return};
			//var cursor = collectionIn.find();

			//var bulk = db.inventory.initializeUnorderedBulkOp();
			//var bulk = collectionOut.initializeUnorderedBulkOp();

			var recordCountIn 	= 0;
			var recordCountOut	= 0;

//			var stream = NDW_siteTable.find({'_id.location':'EHV'}).stream();
//			var stream = NDW_siteTable.find({'_id.location':'ASS'}).stream();
			var stream = NDW_siteTable.find().stream();

			// Execute find on all the documents
			stream.on('end', function() {
				console.log('End Total items processed: %s', recordCountIn);
//				collectionIn.remove({}, function(){} );
//				console.log('import cleaned/removed');
				//console.log('Start bulk execute');
//				bulk.execute(function(err, bulkResult){
					//console.log('End bulk execute %s', err);
					//console.log(bulkResult.isOk() );
					//db.close();
//				});
				//console.log('Bulk execute activated');

			});

			stream.on('data', function(data) {
				//console.log('%s %s', data._id.id, 'siteTable' )
				//assert.ok(data != null);
				lat = 0;
				lng = 0;
				var newRecord = {};
//				newRecord._id = { location: "NL", id:data._id.recordId };
				newRecord = data;
				var newId = {};
				newId.retrievedDate = _retrievedDate; //new Date(newRecord.measurementTimeDefault);
				newId.location 		= newRecord._id.location;
				newId.id 			= newRecord._id.id;
				newRecord._id 		= newId;

				//console.log(newRecord._id);

				//newRecord._id.retrievedDate = _retrievedDate;

				var cursor = collectionIn.find({'_id.recordId': data._id.id });

				switch(_collectionName) {
//					case 'NDW_siteTable':
//						newRecord = self.datex2Import2Model_NDW_siteTable(newRecord, data);
//						break;
					case 'NDW_trafficSpeed':
						self.datex2Import2Model_NDW_trafficSpeed(collectionOut, newRecord, cursor);
						break;
					case 'NDW_travelTime':
						self.datex2Import2Model_NDW_travelTime(collectionOut, newRecord, cursor);
						break;
					default:
						console.log('UNKNOWN DATEXII Collection name !!');
				}



			//	bulk.insert( newRecord ); //{ _id:item._id.recordId, lat:lat, lng:lng,  });
			//	collectionOut.save( newRecord ); //{ _id:item._id.recordId, lat:lat, lng:lng,  });

				recordCountIn++;
				if (recordCountIn%100==0) {
//					var bulkResult = bulk.execute();
					console.log('       items processed: %s', recordCountIn);
//					console.log(bulkResult);
//					var bulk = collectionOut.initializeUnorderedBulkOp()
				}


//				console.log('%s %s', item._id.recordId, item.elements[0].name );
//			});

			});

			//cursor.nextObject(function(err, item) {
			//cursor.forEach.limit(10).toArray(function(err, item) {
//				collectionOut.write(item._id.recordId, item.elements[0].name );



		});
//		console.log('%s %s', _collectionName, 'x2' );

/*
      cursor.nextObject(function(err, item) {
        assert.equal(0, item.a)
        // Rewind the cursor, resetting it to point to the start of the query
        cursor.rewind();

        // Grab the first object again
        cursor.nextObject(function(err, item) {
          assert.equal(0, item.a)

          db.close();
        })
      })
*/


	},


	datex2Import2Model_NDW_siteTable: function(newRecord, data) {

		newRecord.measurementSpecificCharacteristics = [];

				for (var i=0; i<data.elements.length;i++) {
					var element = data.elements[i];

					if ( element.name == 'computationMethod' ) {
						newRecord.computationMethod = element.text;
					}

					if ( element.name == 'measurementEquipmentTypeUsed' ) {
						//newRecord.measurementEquipmentTypeUsed = 'todo???';
						//if (element.elements && element.elements[0]) {
							newRecord.measurementEquipmentTypeUsed = element.elements[0].elements[0].text
						//}
						//newRecord.measurementEquipmentTypeUsed = element.elements[0].elements[0].text;
					}

					if ( element.name == 'measurementSiteName' ) {
						newRecord.measurementSiteName = element.elements[0].elements[0].text;
					}

					if ( element.name == 'measurementSiteNumberOfLanes' ) {
						newRecord.measurementSiteNumberOfLanes = parseFloat(element.text);
					}

					if ( element.name == 'measurementSpecificCharacteristics' ) {
						var _characteristicsKey, _characteristicsValue;
						var _measurementSpecificCharacteristics = {};
						_measurementSpecificCharacteristics.index = element.attributes.index;

						var _characteristics = element.elements[0].elements;

						for (var j=0;j<_characteristics.length;j++) {
							_characteristicsKey 	= _characteristics[j].name;
							if (_characteristics[j].text) {
								_characteristicsValue 	= _characteristics[j].text;
							} else {
								var _characteristicsElements	= _characteristics[j].elements;
								var _sub = [];
								for (var k=0;k<_characteristicsElements.length;k++) {
									var _characteristicsElement = _characteristicsElements[k];
									if (_characteristicsElement.text) {
										var _anyVehicle = {};
										_anyVehicle[_characteristicsElement.name] = _characteristicsElement.text;
										_sub.push(_anyVehicle);
									} else {
										//	console.log(_characteristicsElement.name);
										if (_characteristicsElement.name == 'lengthCharacteristic' ) {
											var _sub2Elements = _characteristicsElement.elements;
											var vehicleCharacteristics = {};
											for (var l=0;l<_sub2Elements.length;l++) {
												if (_sub2Elements[l].name == 'comparisonOperator')
													vehicleCharacteristics.comparisonOperator 	= _sub2Elements[l].text;
												if (_sub2Elements[l].name == 'vehicleLength')
													vehicleCharacteristics.vehicleLength 		= _sub2Elements[l].text;
											}
											_sub.push(vehicleCharacteristics);
										}
									}

								}
								_characteristicsValue	= _sub;
							}
							_measurementSpecificCharacteristics[_characteristicsKey] = _characteristicsValue;
						}

						newRecord.measurementSpecificCharacteristics.push(_measurementSpecificCharacteristics);
					}



					if ( element.name == 'measurementSiteLocation' && element.attributes && element.attributes['xsi:type'] && element.attributes['xsi:type'] == 'Point' ) {

						//console.log(element);

						if (element.elements[0] && element.elements[0].name == 'locationForDisplay' ) {
							var _locationForDisplayElement = element.elements[0];

							if (_locationForDisplayElement.elements[0].name == 'latitude' && _locationForDisplayElement.elements[1].name == 'longitude') {
								newRecord.lat = parseFloat(_locationForDisplayElement.elements[0].text);
								newRecord.lng = parseFloat(_locationForDisplayElement.elements[1].text);
							}

							//console.log('lat:%s lng:%s', lat, lng);
						}
						//lat = parseFloat(latElement.text);
						//lng = parseFloat(lngElement.text);
					}

				}

		return newRecord;

	},

	datex2Import2Model_NDW_trafficSpeed: function(newCollection, newRecord, cursor) {

		//var _retrievedDate = new Date();


		newRecord.measuredValues = [];

		cursor.nextObject(function(err, data) {
   			if (err) { console.log(err); return; };
			if (data == null) {
				// no trafficSpeed record for this location from siteTable
				console.log('Record not found in NDW_trafficSpeed collection %s', newRecord._id.id);
				return;
			};

			//console.log('New record for: %s %s', newRecord._id.id, data.elements.length);

			for (var i=0; i<data.elements.length;i++) {
				var element = data.elements[i];

				if ( element.name == 'measurementTimeDefault' ) {
					newRecord.measurementTimeDefault = element.text;
				}

				if ( element.name == 'measuredValue' ) {
					//var _characteristicsKey, _characteristicsValue;


					var _measuredValues = {};
					_measuredValues.index = element.attributes.index;

					var _measuredValuesElements = element.elements[0].elements[0].elements;

					for (var j=0;j<_measuredValuesElements.length;j++) {
						var _measuredValuesElement = _measuredValuesElements[j];

						if (_measuredValuesElement.name == 'measurementOrCalculationTime') {
							_measuredValues.time = _measuredValuesElement.text;
							continue;
						}

						if (_measuredValuesElement.name == 'vehicleFlow') {
							if (_measuredValuesElement.elements[0].name == 'dataError' ) { //&& _measuredValuesElement.elements[0].text != "true") {
								//_measuredValues.vehicleFlowRate = _measuredValuesElement.elements[1].text;
							} else {
								_measuredValues.vehicleFlowRate = _measuredValuesElement.elements[0].text;
							}
						}

						if (_measuredValuesElement.name == 'averageVehicleSpeed') {
							if (_measuredValuesElement.elements[0].name == 'dataError' ) { //&& _measuredValuesElement.elements[0].text != "true") {
								//_measuredValues.speed = _measuredValuesElement.elements[1].text;
							} else {
								_measuredValues.speed = _measuredValuesElement.elements[0].text;
							}
						}

					}

					newRecord.measuredValues.push(_measuredValues);
				}

			}

			//	var newId = {};
			//	newId.retrievedDate = _retrievedDate; //new Date(newRecord.measurementTimeDefault);
			//	newId.location 		= newRecord._id.location;
			//	newId.id 			= newRecord._id.id;
			//	newRecord._id = newId;

			//var _query = JSON.stringify(newRecord);
			//console.log(_query);

			var recordId = data._id.recordId;


//			for measurementSpecificCharacteristics


/*			if (projectEindhovenAirport[recordId]) {
				console.log('Project Eindhoven Airport: '+ recordId);
				var postgresRecordNew = {};
				postgresRecordNew.featureofinterest = recordId;
				postgresRecordNew.tick_date 		= recordObjects.newRecordObject._id.retrievedDate;
				postgresRecordNew.measuredate 		= recordObjects.newRecordObject._id.retrievedDate;
				postgresRecordNew.lat 				= recordObjects.newRecordObject.lat;
				postgresRecordNew.lng 				= recordObjects.newRecordObject.lng;

					var trafficFlow = {};
					trafficFlow.total = 0;
					trafficInd = false;
					for (var j=0;j<_site.measurementSpecificCharacteristics.length;j++) {
						var _tmpMSC = _site.measurementSpecificCharacteristics[j];
						if (_tmpMSC.specificMeasurementValueType == "trafficFlow" && _tmpMSC.specificVehicleCharacteristics) {
							if (_tmpMSC.specificVehicleCharacteristics && _tmpMSC.specificVehicleCharacteristics[0].vehicleType == "anyVehicle") {
								if (_site.measuredValues[j] == undefined) {
									console.log('ERROR: %s value: %s', _site._id.id, _site.measuredValues[j]);
								} else {
									if ( _site.measuredValues[j].vehicleFlowRate != -1 && _site.measuredValues[j].vehicleFlowRate != undefined ) {
										//console.log('trafficFlow per measurement: %s %s', trafficFlow.total, _site.measuredValues[j].vehicleFlowRate);
										trafficFlow.total += parseFloat(_site.measuredValues[j].vehicleFlowRate);
										trafficInd = true;
									}
								}
							}
						}
					}
					if (trafficInd == true) {
						//console.log('trafficFlow total: %s', trafficFlow.total);
						_trafficSpeedSite.properties.trafficFlow = trafficFlow;
					}
					// todo insert into PostgreSQL

			}
*/

			newCollection.save(newRecord);
  	    })

	},

	datex2Import2Model_NDW_travelTime: function(newCollection, newRecord, cursor) {

		newRecord.measuredValues = [];

		cursor.nextObject(function(err, data) {

   			if (err) { console.log(err); return; };
			if (data == null) {
				// no travelTime record for this location from siteTable
				// console.log('Record not found in NDW_travelTime collection %s', newRecord._id.id);
				return;
			};

			console.log('New record for: %s %s', newRecord._id.id, data);

			for (var i=0; i<data.elements.length;i++) {
				var element = data.elements[i];

				if ( element.name == 'measurementTimeDefault' ) {
					newRecord.measurementTimeDefault = element.text;
				}

				if ( element.name == 'measuredValue' ) {
					//var _characteristicsKey, _characteristicsValue;

					var _measuredValues = {};
					_measuredValues.index = element.attributes.index;

					var _measuredValuesElements = element.elements[0].elements[0].elements;

					for (var j=0;j<_measuredValuesElements.length;j++) {
						var _measuredValuesElement = _measuredValuesElements[j];

						if (_measuredValuesElement.name == 'measurementOrCalculationTime') {
							_measuredValues.time = _measuredValuesElement.text;
						}

						if (_measuredValuesElement.name == 'travelTimeType') {
							_measuredValues.travelTimeType = _measuredValuesElement.text;
						}

						if (_measuredValuesElement.name == 'travelTime') {
							_measuredValues.duration = _measuredValuesElement.elements[0].text;
						}

					}

					newRecord.measuredValues.push(_measuredValues);
				}

			}
			newCollection.save(newRecord);
		})
	},


	// http://localhost:4000/SCAPE604/openiod?SERVICE=SOS&REQUEST=GetTrafficSpeed&location=EHV&format=json

	getTrafficSpeed: function(option, callback) {
		option.context = this;
		this.connectDb('openiod', {location:option.location, maxRetrievedDate: option.maxRetrievedDate, valueType: option.valueType, callback: callback, context:this }, this.getTrafficSpeedMaxDate );

	},


	getTrafficSpeedMaxDate: function(db, option) {


		var NDW_trafficSpeed 	= db.collection('NDW_trafficSpeed');

		if (option.maxRetrievedDate == undefined) {
			option.maxRetrievedDate = new Date(); //.toISOString();
			console.log('option maxRetrievedDate set to new Date object: ' + option.maxRetrievedDate);
		} else {
			option.maxRetrievedDate = new Date(option.maxRetrievedDate);
			console.log('option maxRetrievedDate set to: ' + option.maxRetrievedDate);
		}

//		var _highestRetrievedDate = NDW_trafficSpeed.find({},{'_id':'_id'}).sort({_id:-1}).limit(1).pretty();
		var _hrd_cursor = NDW_trafficSpeed.find({"_id.location":option.location, "_id.retrievedDate": {"$lte": option.maxRetrievedDate } },{'_id':'_id'}, {"sort":[['_id','desc']], "limit": 1}).toArray(function(err, results){
    		console.log(results); // output all records
			if (results[0]) {
				option.maxRetrievedDate = results[0]._id.retrievedDate;
			} else {
				console.log('NO MAXRETRIEVEDDATE FOUND!!');
			}
//			console.log('Latest date: ' + _highestRetrievedDate);
//			console.log('Latest date: ' + _highestRetrievedDate._id);

/*
			var maxRetrievedDate = option.maxRetrievedDate?new Date(option.maxRetrievedDate):new Date();

			var minRetrievedDateTime = new Date(maxRetrievedDate).getTime() - 60000; // -1 minute  //  - 540000; // -9 minutes
			var minRetrievedDate = new Date(minRetrievedDateTime); //.toISOString();
			console.log('min date:' + minRetrievedDate);
			console.log('max date:' + option.maxRetrievedDate);
*/

			option.context.getTrafficSpeedData(db, option);

		});;


	},


	getTrafficSpeedData: function(db, option) {

		var trafficFlowInd, trafficSpeedInd;
		var NDW_trafficSpeed 	= db.collection('NDW_trafficSpeed');
		var trafficSpeedGeoJson = [];

		if (option.maxRetrievedDate == undefined) {
			option.maxRetrievedDate = new Date(); //.toISOString();
		}

/*
//		var _highestRetrievedDate = NDW_trafficSpeed.find({},{'_id':'_id'}).sort({_id:-1}).limit(1).pretty();
		var _hrd_cursor = NDW_trafficSpeed.find({"_id.location":option.location, "_id.retrievedDate": {"$lte": option.maxRetrievedDate } },{'_id':'_id'}, {"sort":[['_id','desc']], "limit": 1}).toArray(function(err, results){
    		console.log(results); // output all records
			option.maxRetrievedDate = results[0]._id.retrievedDate;

		});;

//		console.log('Latest date: ' + _highestRetrievedDate);
//		console.log('Latest date: ' + _highestRetrievedDate._id);
*/
		var maxRetrievedDate = option.maxRetrievedDate?new Date(option.maxRetrievedDate):new Date();

		var minRetrievedDateTime = new Date(maxRetrievedDate).getTime() - 120000; // -2 minute  //  - 540000; // -9 minutes
		var minRetrievedDate = new Date(minRetrievedDateTime); //.toISOString();
		console.log('min date:' + minRetrievedDate);
		console.log('max date:' + option.maxRetrievedDate);

		NDW_trafficSpeed.find({"_id.location":option.location, "_id.retrievedDate": {"$lte": maxRetrievedDate, "$gte": minRetrievedDate } }).toArray(function(err, results){

			for (var i=0;i<results.length;i++) {

				var _site = results[i];

//			    console.log(i); // output all records
				var _trafficSpeedSite = {};
            	_trafficSpeedSite.type="Feature";
            	_trafficSpeedSite.geometry={};
            	_trafficSpeedSite.geometry.type = "Point";
            	_trafficSpeedSite.geometry.coordinates = [];
            	_trafficSpeedSite.geometry.coordinates[0] = _site.lng;
            	_trafficSpeedSite.geometry.coordinates[1] = _site.lat;
            	_trafficSpeedSite.properties = {};
            	//_trafficSpeedSite.properties.site = _site;
				_trafficSpeedSite.properties.site = {};
				_trafficSpeedSite.properties.site.id = _site._id.id;
				_trafficSpeedSite.properties.site.retrievedDate = _site._id.retrievedDate;
				//_trafficSpeedSite.properties.site.measurementSpecificCharacteristics = _site.measurementSpecificCharacteristics;
				_trafficSpeedSite.properties.site.measurementTimeDefault = _site.measurementTimeDefault;

				//console.log('Option: %s', option);
				//console.log(option);
				if (option.valueType && (option.valueType == "traffic" || option.valueType == "trafficFlow") ) {
					var trafficFlow = {};
					trafficFlow.total = 0;
					trafficFlowInd = false;
					for (var j=0;j<_site.measurementSpecificCharacteristics.length;j++) {
						var _tmpMSC = _site.measurementSpecificCharacteristics[j];
						if (_tmpMSC.specificMeasurementValueType == "trafficFlow" && _tmpMSC.specificVehicleCharacteristics) {
							if (_tmpMSC.specificVehicleCharacteristics && _tmpMSC.specificVehicleCharacteristics[0].vehicleType == "anyVehicle") {
								if (_site.measuredValues[j] == undefined) {
									console.log('ERROR: %s value: %s', _site._id.id, _site.measuredValues[j]);
								} else {
									if ( _site.measuredValues[j].vehicleFlowRate != -1 && _site.measuredValues[j].vehicleFlowRate != undefined ) {
										//console.log('trafficFlow per measurement: %s %s', trafficFlow.total, _site.measuredValues[j].vehicleFlowRate);
										trafficFlow.total += parseFloat(_site.measuredValues[j].vehicleFlowRate);
										trafficFlowInd = true;
									}
								}
							}
						}
					}
					if (trafficFlowInd == true) {
						//console.log('trafficFlow total: %s', trafficFlow.total);
						_trafficSpeedSite.properties.trafficFlow = trafficFlow;
					}

				}

				if (option.valueType && (option.valueType == "traffic" || option.valueType == "trafficSpeed") ) {
					var trafficSpeed 	= {};
					trafficSpeed.low 	= 999;
					trafficSpeed.high 	= 0;
					var speedHigh, speedLow, speedTmp;
					trafficSpeedInd = false;
					for (var j=0;j<_site.measurementSpecificCharacteristics.length;j++) {
						var _tmpMSC = _site.measurementSpecificCharacteristics[j];
						if (_tmpMSC.specificMeasurementValueType == "trafficSpeed" && _tmpMSC.specificVehicleCharacteristics) {
							if (_tmpMSC.specificVehicleCharacteristics && _tmpMSC.specificVehicleCharacteristics[0].vehicleType == "anyVehicle") {
								if (_site.measuredValues[j] == undefined) {
									console.log('ERROR: %s value: %s', _site._id.id, _site.measuredValues[j]);
								} else {
									if ( _site.measuredValues[j].speed != -1  && _site.measuredValues[j].speed != undefined ) {
										//console.log('trafficSpeed per measurement: %s-%s %s', trafficSpeed.low, trafficSpeed.high, _site.measuredValues[j].speed);
										speedTmp = parseFloat(_site.measuredValues[j].speed);
										if (speedTmp > trafficSpeed.high) {
											trafficSpeed.high = speedTmp;
										}
										if (speedTmp < trafficSpeed.low) {
											trafficSpeed.low = speedTmp;
										}
										trafficSpeedInd = true;
									}
								}
							}
						}
					}
					if (trafficSpeedInd == true) {
						//console.log('trafficSpeed low: %s high: %s', trafficSpeed.low, trafficSpeed.high);
						_trafficSpeedSite.properties.trafficSpeed = trafficSpeed;
					}

				}

/*

//				var recordCursor = NDW_trafficSpeed.find({"_id.id": _site._id.id }).limit(1);
				NDW_trafficSpeed.find().limit(1).toArray(function(err, resultsSub){
					console.log('toarray: ', _site._id.id );
//					console.log(results);
					for (var j=0;j<resultsSub.length;j++) {
						_trafficSpeedSite.properties.measuredValues = resultsSub[j].measuredValues;
					}
            	//_trafficSpeedSite.properties.measuredValues = measuredValues.measuredValues;
					console.log('push: ', _trafficSpeedSite.properties.site._id.id );
    	        	trafficSpeedGeoJson.push(_trafficSpeedSite);

				});
*/

//				var record = recordCursor; //.next();
			//, measuredValues) {
			//	if (err) console.log('Error: %s', err );
		//		console.log( "site: %s %s", _site._id.id, record );
//				console.log(record);

		//		for (var key in record) {
		//			console.log( key, record[key]);
		//		}


	//			console.log( measuredValues );

		//		var _measuredValues = measuredValues.measuredValues;


			//});

   	        	if (trafficFlowInd == true || trafficSpeedInd == true ) {
					trafficSpeedGeoJson.push(_trafficSpeedSite);
				}
			}

			//console.log( "Returning result dddd1" );

			//var cursor2 = NDW_siteTable.find({"_id.location":"EHV"});
			//console.log(cursor2);

			console.log( "Returning result dddd " , i );
	//		if (i==results.length-1) {
				console.log( "Returning result dddd hehehehehe " , i );
				option.callback(trafficSpeedGeoJson);
	//		}


		});


		console.log( "Returning result" );
		//option.callback(trafficSpeedGeoJson);

	},


	datex2ImportReducerMapReduce: function (db, option) {

		var _collectionNameImport = option.collectionName+'_import';
		var _collectionName = option.collectionName;

		var collection 		= db.collection(_collectionNameImport);
		var collectionOut 	= db.collection(_collectionName);

		var mapper = function () {
			var i;
			var y=0;
			var lat=0, lng=0;
			var x = this.elements; // .name; //recordId: 'a' //this._id.recordId
			for (i=0; i<x.length;i++ ){ //x.length;i++) {
			//	y=i;
			}

			//y=x.name[0];

			//var data = BSON.serialize(this.elements, false, true, false);
			//y=data;

/*			for (i=0; i<this.elements.length;i++) {
				var element = this.elements[i];

				if ( element.name = 'measurementSiteLocation' ) {
					var latElement = elements[0].elements[0];
					var lngElement = elements[0].elements[1];

					lat = parseFloat(latElement.text);
					lng = parseFloat(lngElement.text);
				}

			}
*/

			//console.log('x');
			emit(this._id.recordId, {
				y: y,
				x: x,
				lat: lat,
				lng: lng
			});
		};

		var reducer = function (key, values) {
			var res = values[0];
			//console.log(res);
			/*
			for (var i = 1; i < values.length; i++) {
				if (values[i].min.age < res.min.age)
					res.min = {
						name: values[i].min.name,
						age: values[i].min.age
					};
				if (values[i].max.age > res.max.age)
					res.max = {
						name: values[i].max.name,
						age: values[i].max.age
                	};
			};
			*/
			return res;
		};

		console.log('MapReduce: ' + _collectionName );

//		for (var key in db) {
//			console.log(db[key]);
//		}

//		db[option.collectionName+'_import2'].insert({test:'test'}, function (err, docs) {
//		db.NDW_siteTable_import.insert({test:'test'}, function (err, docs) {
//			console.log("DB Insert Completed");
//		});


//		collection.mapReduce(
		db.NDW_siteTable_import.mapReduce(
		//[_collectionNameImport].mapReduce(
			mapper,
			reducer, {
				out: 'testcollection' //collectionOut
			},
			function(err, docs) {

				console.log('mapreduce callback');

				//db.testcollection.find(function (err, docs) {
//					if (err) console.log(err);
//					console.log("\n", docs);
				//});

			}
		);



		console.log('MapReduce ready: ' + _collectionName );

	},


	getModel: function (model, param, callback) {

		client.execute("SELECT user_id, fname, lname FROM users", function (err, result) {
           if (!err){
               if ( result.rows.length > 0 ) {
                   var user = result.rows[0];
                   console.log("name = %s", user.fname + ' ' + user.lname);
				   //return result.rows;
               } else {
                   console.log("No results");
				   //return "No results" ;
               }
           }
 			//console.log('dit is een test '+ err);
           // Run next function in series
           callback(err, result);
       });

	},

	executeCql: function (cqlFile, param, callback) {

		client.execute(cqlFile, function (err, result) {
           if (!err){
               if ( result.rows != undefined && result.rows.length > 0 ) {
                   //var user = result.rows[0];
                   //console.log("name = %s", user.fname + ' ' + user.lname);
				   //return result.rows;
				   //console.log("Results");
               } else {
                   //console.log("No results");
				   //return "No results" ;
               }
           } else {
		   		console.log("Cql ERROR: " + err );
		   }

		   //console.log("End of: executeCql");
 			//console.log('dit is een test '+ err);
           // Run next function in series
           callback(err, result);
       });

	}
} // end of module.exports
