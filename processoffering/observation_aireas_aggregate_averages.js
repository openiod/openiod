 
/**
 * This module .... 
 * @module observation_aireas_aggregate_averages
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

console.log('Module ' + 'observation_aireas_aggregate_averages.js' + ' executed');

var openIodConnector_ILM			= require('OpenIoD-Connector-ILM');

// todo: see messages in OGC 06-121r3 Table 8
var errorMessages = {
	  NOQUERY 			: { "message": 'Query parameters missing'		, "returnCode": 501 }
	, NOSERVICE 		: { "message": 'SERVICE parameter missing'		, "returnCode": 501 }
	, NOREQUEST 		: { "message": 'REQUEST parameter missing'		, "returnCode": 501 }
	, UNKNOWNREQ 		: { "message": 'REQUEST parameter unknown'		, "returnCode": 501 }
	, UNKNOWNIDENTIFIER : { "message": 'IDENTIFIER parameter unknown'	, "returnCode": 501 }
	, URLERROR 			: { "message": 'URL incorrect'					, "returnCode": 501 }
	, NOFOI 			: { "message": 'Feature of Interest missing'	, "returnCode": 501 }
	, NOMODEL 			: { "message": 'MODEL parameter missing'		, "returnCode": 501 }
}

var errorResult = function(res, message) {
	res.returncode = message.returnCode;
	res.contentType('text/plain');
	res.status(message.returnCode).send(message.message);
};

module.exports = {

init: function(req, res, query) {
	console.log('Module ' + 'observation_aireas_average.js' + ' init() executed');
	this.aggregateObservationAverages(req, res, query);
},


aggregateObservationAverages: function(req, res, query) {

	var period = query.period;

	var resultOutput;
	if (query.featureofinterest == null) {
		errorResult(res, errorMessages.NOFOI);
		return;
	};
	
	if (period != 'day' && period != 'month' && period != 'year') {
		errorResult(res, errorMessages.UNKNOWNIDENTIFIER);
		return;
	};
	
	var param = {};
	param.query = query;
	
	param.aggregation = [];
	
	var _foiId = query.featureofinterest;  // can be 'all' for all sensors

	if (period == 'day') {
		param.collection = 'observation';
		if (_foiId != 'all') {
			param.aggregation.push(	{ $match : { foiId: query.featureofinterest } } );
		}	
		param.aggregation.push(
			{ $group : { 
						_id: { foiId: _foiId 
							, year: { $year:"$_id.phenomenonDate" } 
						    , month: { $month:"$_id.phenomenonDate" } 
							, dayOfMonth: { $dayOfMonth:"$_id.phenomenonDate" } 
							, status: "$status" 
							  } 
						, count: { $sum: 1} 
						, avgUFP: { $avg: "$UFPFloat"} 
						, avgOZON: { $avg: "$OZONFloat"} 
						, avgPM1: { $avg: "$PM1Float"} 
						, avgPM25: { $avg: "$PM25Float"} 
						, avgPM10: { $avg: "$PM10Float"}
						, avgHUM: { $avg: "$HUMFloat"} 
						, avgCELC: { $avg: "$CELCFloat"} 						 
					}}
		);
	}	
	if (period == 'month') {
		param.collection = 'observation_day';
		param.aggregation.push(	{ $match : { "_id.foiId": query.featureofinterest } } );
		param.aggregation.push(
			{ $group : { 
						_id: { foiId: _foiId 
							, year: "$_id.year"  
						    , month: "$_id.month"  
							, status: "$status" 
							  } 
						, count: { $sum: 1} 
						, avgUFP: { $avg: "$avgUFP"} 
						, avgOZON: { $avg: "$avgOZON"} 
						, avgPM1: { $avg: "$avgPM1"} 
						, avgPM25: { $avg: "$avgPM25"} 
						, avgPM10: { $avg: "$avgPM10"} 
						, avgHUM: { $avg: "$avgHUM"} 
						, avgCELC: { $avg: "$avgCELC"} 						 
					}}
		);
	}	
	if (period == 'year') {
		param.collection = 'observation_month';
		param.aggregation.push(	{ $match : { "_id.foiId": query.featureofinterest } } );
		param.aggregation.push(
			{ $group : { 
						_id: { foiId: _foiId 
							, year: "$_id.year"  
							, status: "$status" 
							  } 
						, count: { $sum: 1} 
						, avgUFP: { $avg: "$avgUFP"} 
						, avgOZON: { $avg: "$avgOZON"} 
						, avgPM1: { $avg: "$avgPM1"} 
						, avgPM25: { $avg: "$avgPM25"} 
						, avgPM10: { $avg: "$avgPM10"} 
						, avgHUM: { $avg: "$avgHUM"} 
						, avgCELC: { $avg: "$avgCELC"} 						 
					}}
		);
	}	

	console.log('param: ' + param.toString());
		
	param.collectionTmp 	= 'observation_' + period + '_' + new Date().getTime();
	param.collectionMerge 	= 'observation_' + period;

	param.aggregation.push( { $out: param.collectionTmp } );


	var _aggregation = JSON.stringify(param.aggregation);
	console.log(_aggregation);
				
//	param.aggregation = '[ {$group: {_id: { foiId: "$_id.foiId", year: { $year:"$_id.phenomenonDate" }, month: { $month:"$_id.phenomenonDate" }, dayOfMonth: { $dayOfMonth:"$_id.phenomenonDate" }, status: "$status"}, count: { $sum: 1}, avgUFP: { $avg: "$UFPFloat"}, avgPM1: { $avg: "$PM1Float"}, avgPM25: { $avg: "$PM25Float"}, avgPM10: { $avg: "$PM10Float"}}},{ $sort : { "_id.year" : -1, "_id.month" : -1, "_id.dayOfMonth" : -1, "_id.status": 1 } }]';		
	
	var foi = openIodConnector_ILM.getFeatureOfInterest(query.featureofinterest, param, function() {});
	console.log('Aggregate feature of interest: '+ foi);
	
	var options;
	var foiData = openIodConnector_ILM.merge(query.featureofinterest, param, function(result) {
		console.log('End of aggregateObservationAverages, temporary collection: ' + param.collectionTmp);
		
		
		// save temporary collection into (merge) collection.
	//	openIodConnector_ILM.getMongoData(query.featureofinterest, param, function(result) {
	//		param.aggregation = [];
	//	}

//		for (var key in data) {
//			console.log('Aggregation result, key: '+ key + ' value: ' + data[key] );
//		}
		//var dataJson = JSON.stringify(result);
		//console.log(dataJson);
		
		var message = 'Process completed';
		
		//res.contentType('application/json');
 		//res.send(dataJson);
 		res.send(message);
	});
	console.log('Aggregating feature of interest observation averages is started.');
	//for (var key in foi) {
	//	console.log('Feature of interest key: '+ key + ' value: ' + foi[key] );
	//}

}



} // end of module.exports
