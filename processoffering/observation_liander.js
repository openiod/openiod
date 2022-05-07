 
/**
 * This module .... 
 * @module observation_liander
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

console.log('Module ' + 'observation_liander.js' + ' executed');

var openIodConnector_Liander		= require('OpenIoD-Connector-Liander');

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
	, NOPRODUCT			: { "message": 'PRODUCT parameter missing or not "GAS"/"ELK"'		, "returnCode": 501 }
}

var errorResult = function(res, message) {
	res.returncode = message.returnCode;
	res.contentType('text/plain');
	res.status(message.returnCode).send(message.message);
};

module.exports = {

init: function(req, res, query, param) {
	console.log('Module ' + 'observation_liander.js' + ' init() executed');
	this.getData(req, res, query, param);
},

getData: function(req, res, query, param) {

	var _param = param;
	console.log('observation_liander.js param.systemParentFolder: ' + _param.systemParentFolder);

	//var period = query.period?query.period:'year';
	
	var resultOutput;

	if (query.featureofinterest == null) {
		//console.log(query);
		errorResult(res, errorMessages.NOFOI);
		return;
	};
	if (query.product == null || (query.product != 'ELK' & query.product != 'GAS') ) {
		//console.log(query);
		errorResult(res, errorMessages.NOPRODUCT);
		return;
	};
	
	param.product = query.product;


	if (query.year == null) {
		query.year = new Date().getFullYear(); 
	};
	
	_param.year = query.year;
	
	console.log('param: ' + param);

	

	
	_param.query = query;

	var testFoiData = openIodConnector_Liander.getData(query.featureofinterest, _param, function(result, err) {
		console.log('End of getObservationLiander');
		
		console.log(err);
		
//		for (var key in data) {
//			console.log('Aggregation result, key: '+ key + ' value: ' + data[key] );
//		}

//		if (query.format != 'json' && query.format != 'json') {
//			query.format = 'json'; //default=xml
//		}
		
//		if (query.format == 'json') {
			res.contentType('application/json');
	 		res.send(result);
//		}
		
		
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
	console.log('Get feature of interest observation Liander is started.');
	//for (var key in testFoi) {
	//	console.log('Feature of interest key: '+ key + ' value: ' + testFoi[key] );
	//}
}

} // end of module.exports
