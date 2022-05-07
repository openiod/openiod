
/**
 * This module is the api for managing the apri-sensor sensors. start actions like reboot, restart service, managing user accounts etc.
 * @module apri-sensor-manager
 */

/* API

getClients: https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=apri-sensor-manager&action=getClients
reboot unit: https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=apri-sensor-manager&action=reboot&unitId=000000004659c5bc---
get wifi info unit: https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=apri-sensor-manager&action=getClientUsbInfo&unitId=000000004659c5bc---
getClientCmd info unit: https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=apri-sensor-manager&action=getClientCmd&unitId=000000004659c5bc---&command=ls


*/

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

console.log('Module ' + 'apri-sensor-manager.js' + ' executed');

//var testje = require.resolve('OpenIoD-Connector-ILM');
//console.log('require ILM module location:');
//console.log(testje);
//var openIodConnector_ILM			= require('OpenIoD-Connector-Pestinfo');

var pg		= require('pg');
var http	= require('http');
var io	 	= require('socket.io-client');

var socketUrl, socketPath;


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

var clients			= {};
var socket;

var sqlConnString;
var self = this;

/*
var getPestInfo	= function(req, res, param, geoJson) {


	// e.g. http://api.openh2o.nl/stof/ihw/stofwaterschapjaar/?aquocode=imdcpd&year=2015&format=json&limit=100000


	http.get('http://api.openh2o.nl/stof/ihw/stofwaterschapjaar/?aquocode=imdcpd&year=2015&format=json&limit=9999999', (resPi) => {
		var statusCode = resPi.statusCode;
		var contentType = resPi.headers['content-type'];

		let error;
		if (statusCode !== 200) {
			error = new Error(`Request Failed.\n` +
				`Status Code: ${statusCode}`);
		} else if (!/^application\/json/.test(contentType)) {
			error = new Error(`Invalid content-type.\n` +
						`Expected application/json but received ${contentType}`);
		}
		if (error) {
			console.log(error.message);
			// consume response data to free up memory
			resPi.resume();
			return;
		}

		resPi.setEncoding('utf8');
		let rawData = '';
		resPi.on('data', (chunk) => rawData += chunk);
		resPi.on('end', () => {
			try {
				let parsedData = JSON.parse(rawData);
				for (var i=0;i<parsedData.results.length;i++) {
					var apiRec = parsedData.results[i];
					if (apiRec.beheerdercode.length==1) apiRec.beheerdercode = '0' + apiRec.beheerdercode;
					for (var j=0;j<geoJson.length;j++) {
						if (geoJson[j].properties.nationalCode == apiRec.beheerdercode) {
							geoJson[j].properties.aquoCode		= apiRec.aquocode;
							geoJson[j].properties.year 			= apiRec.year;
							geoJson[j].properties.JGMKNavg 		= apiRec.JGMKNavg;
							geoJson[j].properties.JGMKNnorm 	= apiRec.JGMKNnorm;
							geoJson[j].properties.JGMKNnof 		= apiRec.JGMKNnof;
							geoJson[j].properties.JGMKNcmlnof 	= apiRec.JGMKNcmlnof;
							// JGMKNnof (methode krw) of JGMKNcmlnof (methode cml).
							// nof=normoverschrijdingsfactor, dus >1 is normoverschrijdend,
							// leeg/null is toetsing niet mogelijk, <=1 voldoet aan norm.
							break;
						}
//						console.log(geoJson[j]);
//						j=999999;
					}

					//i=99999;
				}

				res.contentType('application/json');
				res.send(geoJson);
			} catch (e) {
				console.log(e.message);
			}

		});
	}).on('error', (e) => {
		console.log(`Got error: ${e.message}`);
	});

};
*/



module.exports = {

init: function(req, res, query, param) {
	console.log('Module ' + 'apri-sensor-manager.js' + ' init() executed');

	//console.dir(param);

//	console.log('Socket:');
//	console.log(socket);

	// only once
	if (socket == undefined) {
		socketUrl 	= 'https://openiod.org'; socketPath	= '/'+param.systemCode + '/socket.io';

		socket = io(socketUrl, {path:socketPath});
		socket.on('connect', function (socket) {
			var currTime = new Date();
			console.log(currTime +': connected with socketio server');
			//startConnection();
		});
		socket.on('connected', function (data) {
			var currTime = new Date();
			console.log(currTime +': connected with socketio server: ' + data.message);
		});

		socket.on('disconnect', function() {
			var currTime = new Date();
			console.log(currTime +': Disconnected from web-socket ');
		});

		socket.on('apriAgentActionResponse', function(data) {
			console.log('Apri Agent Manager action response received: ' + data.action);
//			console.dir(socket);
			console.log('socket id: %s',socket.id);
			if (data.action == 'getClients') {
//				console.dir (data);
				socket.res.contentType('application/json');
				socket.res.status('200').send(data);

			};
			if (data.action == 'getClientWifiInfo') {
//				console.dir (data);
				socket.res.contentType('application/json');
				socket.res.status('200').send(data);
			};
			if (data.action == 'getClientUsbInfo') {
//				console.dir (data);
				socket.res.contentType('application/json');
				socket.res.status('200').send(data);
			};
      if (data.action == 'getClientLsUsbInfo') {
//				console.dir (data);
				socket.res.contentType('application/json');
				socket.res.status('200').send(data);
			};
      if (data.action == 'getClientLsUsbvInfo') {
//				console.dir (data);
				socket.res.contentType('application/json');
				socket.res.status('200').send(data);
			};
			if (data.action == 'getClientCmd') {
				socket.res.contentType('application/json');
				socket.res.status('200').send(data);
			};
			if (data.action == 'reboot') {
//				console.dir (data);
				socket.res.contentType('application/json');
				socket.res.status('200').send(data);
			};
		});

	}

	this.getData(req, res, query, param);


},

initDbConnection: function (options) {
		if (options.source != 'mongodb') {
			// PostgreSql
			//console.log(options);
			sqlConnString = options.param.systemParameter.databaseType + '://' +
				options.param.systemParameter.databaseAccount + ':' +
				options.param.systemParameter.databasePassword + '@' +
				options.param.systemParameter.databaseServer + '/' +
				options.param.systemCode + '_' + options.param.systemParameter.databaseName;
		}
	},


getData: function(req, res, query, param) {

	var _param = param;
	//console.log(_param);


	function executeSql (req, res, param, query, callback) {
		console.log('sql start: ');
		var client = new pg.Client(sqlConnString);
		client.connect(function(err,result) {
  			if(err) {
   	 		console.error('could not connect to postgres', err);
				callback(req, res, param, result, err);
				return;
  			}
  			client.query(query, function(err, result) {
   	 		if(err) {
   	   			console.error('error running query', err);
					callback(req, res, param, result, err);
					return;
   	 		}
   	 		//console.log('sql result: ' + result);
				callback(req, res, param, result.rows, err);
   		 		client.end();
  			});
		});
	};



	_param.unitId		= query.unitId?query.unitId:'unknown';  // unitId is the id of the sensor agent (eg. Raspberry pi id)
	_param.action		= query.action?query.action:'unknown';
  _param.command	= query.command?query.command:'unknown';  // only valid for action = getClientLsUsbInfo and getClientCmd
	_param.areaCode	= query.areaCode?query.areaCode:'json';
	_param.format		= query.format?query.format:'json';
	_param.limit		= query.limit?query.limit:9999999;

	var resultOutput;

	_param.query = query;

	if (socket == undefined) {
		console.log('socket not connected for action: ' + _param.action);
	}

	if (_param.action == 'getClients') {
		socket.res 	= res;
		socket.emit('apriAgentAction', {action: _param.action} );
		return;
	}
	if (_param.action == 'getClientWifiInfo' && _param.unitId != 'unknown') {
		socket.res 	= res;
		socket.emit('apriAgentAction', {action: _param.action, unitId:_param.unitId } );
		return;
	}
	if (_param.action == 'getClientUsbInfo' && _param.unitId != 'unknown') {
		socket.res 	= res;
		socket.emit('apriAgentAction', {action: _param.action, unitId:_param.unitId } );
		return;
	}
  if (_param.action == 'getClientLsUsbInfo' && _param.unitId != 'unknown') {
		socket.res 	= res;
		socket.emit('apriAgentAction', {action: _param.action, command: _param.command, unitId:_param.unitId } );
		return;
	}
  if (_param.action == 'getClientLsUsbvInfo' && _param.unitId != 'unknown') {
		socket.res 	= res;
		socket.emit('apriAgentAction', {action: _param.action, unitId:_param.unitId } );
		return;
	}
	if (_param.action == 'getClientCmd' && _param.unitId != 'unknown') {
		socket.res 	= res;
		socket.emit('apriAgentAction', {action: _param.action, command: _param.command, unitId:_param.unitId } );
		return;
	}
	if (_param.action == 'reboot' && _param.unitId != 'unknown') {
		socket.res 	= res;
		socket.emit('apriAgentAction', {action: _param.action, unitId:_param.unitId } );
		return;
	}

	res.contentType('text/html');
	var body = 'No valid action in for params: ' + JSON.stringify(query);
	res.status('404').send(body);

	return;

/*
	var options;

	if (sqlConnString == null) {
		this.initDbConnection({source:'postgresql', param: param });
	}

	var query	= "select inspire_id, national_code, name, located_city, ST_AsGeoJSON(ST_Transform(located_geom,4326)) located_geom, ST_AsGeoJSON(ST_Simplify(ST_Transform(geom,4326),0.001)) geojson from hh_waterschap; ";

	console.log('Postgres sql start execute: ' + query);
	executeSql(req, res, param, query, this.procesSqlResultWaterschap);


	console.log('Get PestInfo data is started.');
	//for (var key in testFoi) {
	//	console.log('Feature of interest key: '+ key + ' value: ' + testFoi[key] );
	//}
*/

},

procesSqlResult: function(req, res, param, result, err) {
	//console.log(result);
	var geoJson 	= [];
	for (var i=0;i<result.length;i++) {
		var resultRec = result[i];
		var geoJsonRec = {};
		geoJsonRec.geometry 				= JSON.parse(resultRec.geojson);
		geoJsonRec.type						= 'Feature';
		geoJsonRec.properties 				= {};
		geoJsonRec.properties.inspireId 	= resultRec.inspire_id;
		geoJsonRec.properties.nationalCode	= resultRec.national_code;
		geoJsonRec.properties.name			= resultRec.name;
		geoJsonRec.properties.locatedCity	= resultRec.located_city;
		geoJson.push(geoJsonRec);
	}

/*
	getPestInfo(req, res, param, geoJson);
*/
}




} // end of module.exports
