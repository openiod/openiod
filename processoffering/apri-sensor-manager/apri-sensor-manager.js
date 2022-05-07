
/**
 * This module is the api for managing the apri-sensor sensors. start actions like reboot, restart service, managing user accounts etc.
 * @module apri-sensor-manager
 */

/* API
getClients: https://openiod.org/SCAPE604/openiod?identifier=apri-sensor-manager&action=getClients
reboot unit: https://openiod.org/SCAPE604/openiod?identifier=apri-sensor-manager&action=reboot&unitId=000000004659c5bc---
get wifi info unit: https://openiod.org/SCAPE604/openiod?identifier=apri-sensor-manager&action=getClientUsbInfo&unitId=000000004659c5bc---
getClientCmd info unit: https://openiod.org/SCAPE604/openiod?identifier=apri-sensor-manager&action=getClientCmd&unitId=000000004659c5bc---&command=ls
*/

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

console.log('Module ' + 'apri-sensor-manager.js' + ' executed');

//var http	= require('http');
var io	 	= require('socket.io-client');

var socketUrl, socketPath;

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

module.exports = {

init: function(req, res, query, param) {
	console.log('Module ' + 'apri-sensor-manager.js' + ' init() executed');

	// only once
	if (socket == undefined) {
		socketUrl 	= 'https://openiod.org'; socketPath	= '/'+param.systemCode + '/socket.io';

		socket = io(socketUrl, {path:socketPath});
		socket.on('connect', function (socket) {
			var currTime = new Date();
			console.log(currTime +': connected with socketio server');
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
			console.log('socket id: %s',socket.id);
			if (data.action == 'getClients') {
				socket.res.contentType('application/json');
				socket.res.status('200').send(data);
			};
			if (data.action == 'getClientWifiInfo') {
				socket.res.contentType('application/json');
				socket.res.status('200').send(data);
			};
			if (data.action == 'getClientUsbInfo') {
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
		sqlConnString = options.param.systemParameter.databaseType + '://' +
			options.param.systemParameter.databaseAccount + ':' +
			options.param.systemParameter.databasePassword + '@' +
			options.param.systemParameter.databaseServer + '/' +
			options.param.systemCode + '_' + options.param.systemParameter.databaseName;
	}
},

getData: function(req, res, query, param) {
	var _param = param;

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

},

procesSqlResult: function(req, res, param, result, err) {
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
}

} // end of module.exports
