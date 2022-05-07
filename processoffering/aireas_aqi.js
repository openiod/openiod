 
/**
 * This module .... 
 * @module aireas_aqi
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

console.log('Module ' + 'aireas_aqi.js' + ' executed');

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
	console.log('Module ' + 'aireas_aqi.js' + ' init() executed');
	this.getData(req, res, query, param);
},



getData: function(req, res, query, param) {

	var _param = param;
	//console.log(_param);

	_param.gridCode = query.gridcode?query.gridcode:'EHV20141104:1';
	_param.featureofinterest = query.featureofinterest?query.featureofinterest:'overall';
	_param.sensortype = query.sensortype?query.sensortype:'overall';
	_param.aqitype = query.aqitype?query.aqitype:'AiREAS_NL';
	
	var resultOutput;

	
	_param.query = query;
	

	var options;
	
	var aqiData = openIodConnector_ILM.getAireasAqi(_param, function(result, err) {
		console.log('End of getAireasAqi ', _param.gridCode, _param.featureofinterest, _param.sensortype, _param.aqitype );
		
//		for (var key in data) {
//			console.log('Aggregation result, key: '+ key + ' value: ' + data[key] );
//		}

		if (query.format != 'json' && query.format != 'csv') {
			query.format = 'json'; //default=json
		}
		
/*
		for (var i=0;i<result.length;i++) {
			if (result[i].hist_count) {
				result[i].hist_count = parseFloat(result[i].hist_count);
			}
			if (result[i].avg_avg) {
				result[i].avg_avg = parseFloat(result[i].avg_avg);
			}
		}
*/		

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
	
	
	console.log('Get aireas AQI data is started.');
	//for (var key in testFoi) {
	//	console.log('Feature of interest key: '+ key + ' value: ' + testFoi[key] );
	//}
}

} // end of module.exports
