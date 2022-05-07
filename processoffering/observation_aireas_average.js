 
/**
 * This module .... 
 * @module observation_aireas_average
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

console.log('Module ' + 'observation_aireas_average.js' + ' executed');

//var testje = require.resolve('OpenIoD-Connector-ILM');
//console.log('require ILM module location:');
//console.log(testje);
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

init: function(req, res, query, param) {
	console.log('Module ' + 'observation_aireas_average.js' + ' init() executed');
	this.getData(req, res, query, param);
},

getData: function(req, res, query, param) {

	var _param = param;
	//console.log(_param);

	var period = query.period?query.period:'year';
	
	var resultOutput;
	if (query.featureofinterest == null) {
		errorResult(res, errorMessages.NOFOI);
		return;
	};
//	if (query.featureofinterest == null) {
//		errorResult(res, errorMessages.NOFOI);
//		return;
//	};
	
	
	_param.query = query;

	if (query.source == 'mongdb') {
		if (query.featureofinterest == 'all') {
			_param.aggregation = [ 
				{ $match : {} }
			];
		} else {
			_param.aggregation = [ 
				{ $match : { "_id.foiId": query.featureofinterest } }
			];
		}
		_param.collection = 'observation_' + period;
		if (period == 'day') {
			_param.aggregation.push(	{ $sort : { "_id.foiId" : -1, "_id.year" : -1, "_id.month" : -1, "_id.dayOfMonth" : -1, "_id.status": 1 } } );
		}; 	
		if (period == 'month') {
			_param.aggregation.push(	{ $sort : { "_id.foiId" : -1, "_id.year" : -1, "_id.month" : -1,  "_id.status": 1 } } );
		};		
		if (period == 'year') {
			_param.aggregation.push(	{ $sort : { "_id.foiId" : -1, "_id.year" : -1, "_id.status": 1 } } );
		};	
	} else {
		// PostgreSql database
		
		
		if (period == 'day') {
		}; 	
		if (period == 'month') {
		};		
		if (period == 'year') {
		};	
	}

// , { $sort : { "_id.foiId" : -1, "_id.year" : -1, "_id.month" : -1, "_id.dayOfMonth" : -1, "_id.status": 1 } }

/*
		{ $group : { 
					_id: { foiId: "$foiId" 
						, year: { $year:"$_id.phenomenonDate" } 
					    , month: { $month:"$_id.phenomenonDate" } 
						, dayOfMonth: { $dayOfMonth:"$_id.phenomenonDate" } 
						, status: "$status" 
						  } 
					, count: { $sum: 1} 
					, avgUFP: { $avg: "$UFPFloat"} 
					, avgPM1: { $avg: "$PM1Float"} 
					, avgPM25: { $avg: "$PM25Float"} 
					, avgPM10: { $avg: "$PM10Float"} 
				}}, 
*/				
//	_param.aggregation = '[ {$group: {_id: { foiId: "$_id.foiId", year: { $year:"$_id.phenomenonDate" }, month: { $month:"$_id.phenomenonDate" }, dayOfMonth: { $dayOfMonth:"$_id.phenomenonDate" }, status: "$status"}, count: { $sum: 1}, avgUFP: { $avg: "$UFPFloat"}, avgPM1: { $avg: "$PM1Float"}, avgPM25: { $avg: "$PM25Float"}, avgPM10: { $avg: "$PM10Float"}}},{ $sort : { "_id.year" : -1, "_id.month" : -1, "_id.dayOfMonth" : -1, "_id.status": 1 } }]';		
	
	//var testFoi = openIodConnector_ILM.getFeatureOfInterest(query.featureofinterest, _param, function() {});
	//console.log('test feature of interest: '+ testFoi);
	
	var options;
	
	if (query.type == 'Q') {
		var testFoiData = openIodConnector_ILM.getAireasHistQ(_param, function(result, err) {
			console.log('End of getAireasHistQ');
		
//			for (var key in data) {
//				console.log('Aggregation result, key: '+ key + ' value: ' + data[key] );
//			}

			if (query.format != 'json' && query.format != 'csv') {
				query.format = 'json'; //default=json
			}
		
			for (var i=0;i<result.length;i++) {
				if (result[i].hist_count) {
					result[i].hist_count = parseFloat(result[i].hist_count);
				}
				if (result[i].avg_avg) {
					result[i].avg_avg = parseFloat(result[i].avg_avg);
				}
			}
		

			if (query.format == 'json') {
				var dataJson = JSON.stringify(result);
				//console.log(dataJson);
				res.contentType('application/json');
		 		res.send(dataJson);
 				//res.send('testje okay');
			}
			if (query.format == 'csv') {
				var dataCsv = ''; //JSON.stringify(result);
				var headers = '';
				var headersFirstKey= true;
				for (var key in result[0]) {
					if (headersFirstKey==true) {
						headers += key;
						headersFirstKey = false;
					} else {
						headers += ';' + key ;
					}
				}
				dataCsv += headers +'\n';
				
				for (var i=0; i<result.length;i++) {
					var record='';
					var recordFirstKey= true;
					for (var key in result[i]) {
						if (recordFirstKey==true) {
							record += result[i][key];
							recordFirstKey = false;
						} else {
							record += ';' + result[i][key] ;
						}
					}
					dataCsv += record  +'\n';
				}
			
				//console.log(dataJson);
				res.contentType('text/plain');
		 		res.send(dataCsv);
 				//res.send('testje okay');
			}
		
		});
	
	} else {
	
	var testFoiData = openIodConnector_ILM.getData(query.featureofinterest, _param, function(result, err) {
		console.log('End of getObservationAverage');
		
//		for (var key in data) {
//			console.log('Aggregation result, key: '+ key + ' value: ' + data[key] );
//		}

		if (query.format != 'json' && query.format != 'csv') {
			query.format = 'json'; //default=json
		}
		
		for (var i=0;i<result.length;i++) {
			if (result[i].hist_count) {
				result[i].hist_count = parseFloat(result[i].hist_count);
			}
			if (result[i].avg_avg) {
				result[i].avg_avg = parseFloat(result[i].avg_avg);
			}
		}
		

		if (query.format == 'json') {
			var dataJson = JSON.stringify(result);
			//console.log(dataJson);
			res.contentType('application/json');
	 		res.send(dataJson);
 			//res.send('testje okay');
		}
		if (query.format == 'csv') {
			var dataCsv = ''; //JSON.stringify(result);
			var headers = '';
			var headersFirstKey= true;
			for (var key in result[0]) {
				if (headersFirstKey==true) {
					headers += key;
					headersFirstKey = false;
				} else {
					headers += ';' + key ;
				}
			}
			dataCsv += headers +'\n';
			
			for (var i=0; i<result.length;i++) {
				var record='';
				var recordFirstKey= true;
				for (var key in result[i]) {
					if (recordFirstKey==true) {
						record += result[i][key];
						recordFirstKey = false;
					} else {
						record += ';' + result[i][key] ;
					}
				}
				dataCsv += record  +'\n';
			}
			
			//console.log(dataJson);
			res.contentType('text/plain');
	 		res.send(dataCsv);
 			//res.send('testje okay');
		}
		
		
	});
	
	}
	
	console.log('Get feature of interest observation averages is started.');
	//for (var key in testFoi) {
	//	console.log('Feature of interest key: '+ key + ' value: ' + testFoi[key] );
	//}
}

} // end of module.exports
