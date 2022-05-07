 
/**
 * This module .... 
 * @module observation_aireas_history_import
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

var openIodConnector_ILM			= require('OpenIoD-Connector-ILM');

console.log('Module ' + 'observation_aireas_history_import.js' + ' executed');

//var openIodConnector_ILM			= require('OpenIoD-Connector-ILM');

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
	console.log('Module ' + 'observation_aireas_history_import.js' + ' init() executed');
	this.getObservationHistory(req, res, query);
},


getObservationHistory: function(req, res, query) {

	var resultOutput;
	if (query.featureofinterest == null) {
		errorResult(res, errorMessages.NOFOI);
		return;
	};
	if (query.file == null) {  // default url else observation data from file
		//errorResult(res, errorMessages.NOFOI);
		//return;
	};
	
	var param = {};
	param.query = query;
	
	var foi = openIodConnector_ILM.getFeatureOfInterest(query.featureofinterest, param, function() {});
	console.log('test feature of interest: '+ foi);
	
	console.log('Get feature of interest history is started: ' + foiHistory);
	var options;
	var foiHistory = openIodConnector_ILM.getObservationHistory(query.featureofinterest, param, function() {
		console.log('Einde reqCsvHistory');
 		res.send('Einde reqCsvHistory');
	});

//	for (var key in foi) {
//		console.log('Feature of interest key: '+ key + ' value: ' + foi[key] );
//	}

}


} // end of module.exports
