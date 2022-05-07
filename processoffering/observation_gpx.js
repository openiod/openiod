 
/**
 * This module .... 
 * @module observation_aireas_average
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

console.log('Module ' + 'observation_gpx.js' + ' executed');

var openIodConnector_GPX		= require('OpenIoD-Connector-GPX');

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
	console.log('Module ' + 'observation_gpx.js' + ' init() executed');
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

	
	_param.query = query;

	var testFoiData = openIodConnector_GPX.getData(query.featureofinterest, _param, function(result, err) {
		console.log('End of getObservationGPX');
		
//		for (var key in data) {
//			console.log('Aggregation result, key: '+ key + ' value: ' + data[key] );
//		}

		if (query.format != 'xml' && query.format != 'csv') {
			query.format = 'xml'; //default=xml
		}
		
		if (query.format == 'xml') {
			res.contentType('application/xml');
	 		res.send(result);
		}
		
		
/*
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
			res.contentType('text/xml');
	 		res.send(dataCsv);
 			//res.send('testje okay');
		}
*/		
		
	});
	console.log('Get feature of interest observation GPX is started.');
	//for (var key in testFoi) {
	//	console.log('Feature of interest key: '+ key + ' value: ' + testFoi[key] );
	//}
}

} // end of module.exports
