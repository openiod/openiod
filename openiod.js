/*
** Module: openiod.js
**   OpenIod server
**
**
**
*/

"use strict";

var main_module 		= 'openiod';
console.log("Path: " + main_module);
var modulePath = require('path').resolve(__dirname, 'node_modules/openiod/../..');
console.log("Modulepath: " + modulePath);
var openIoDConfig 		= require(modulePath + '/openiod-config');
openIoDConfig.init(main_module);

var self = this;

// **********************************************************************************

// add module specific requires
var express 			= require('express');
var bodyParser 			= require('body-parser');
var fs 					= require('fs');

var _systemCode 		= openIoDConfig.getSystemCode();
var _systemFolderParent	= openIoDConfig.getSystemFolderParent();
var _systemFolder		= openIoDConfig.getSystemFolder();
var _systemListenPort	= openIoDConfig.getSystemListenPort();
var _systemParameter	= openIoDConfig.getConfigParameter();

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// **********************************************************************************

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

var processOfferingsModuleCache = {};

var configLocalPathWpsCapabilities		= _systemFolderParent +'/wps-capabilities.json';
var configLocalPathServices 			= _systemFolderParent +'/config/openiod-services/';
var configLocalPathServicesIod 			= configLocalPathServices + 'iod';
var configLocalPathServicesIot 			= configLocalPathServices + 'iot';
var configLocalPathServicesPersistent 	= configLocalPathServices + 'persistent';
var configLocalPathServicesProcess 		= configLocalPathServices + 'process';
var configLocalPathServicesPublication 	= configLocalPathServices + 'publication';

console.log (configLocalPathServicesIot);

var ignoreList = {".DS_Store":true};
var localServicesTypeCount = 1;
var localServicesConfigs={};
localServicesConfigs.iod			= [];
localServicesConfigs.iot			= [];
localServicesConfigs.persistent		= [];
localServicesConfigs.process		= [];
localServicesConfigs.publication	= [];
localServicesConfigs.wps			= [];

var getLocalServices = function(localServiceType) {
	var configLocalPathServicesType = configLocalPathServices + localServiceType;
	var localServices;
	fs.readdir(configLocalPathServicesType, function (err, files) {
		if (err) { console.log("Local services folder not found: " + configLocalPathServicesType);
		} else {
			localServices=files;
  			console.log("Local "+localServiceType+" services: " + localServices.toString());
			for (var i=0;i<localServices.length;i++) {
				var _fileName = localServices[i];
				if ( ignoreList[_fileName] != null ) continue;

				console.log(" - Read service config file: "+ localServices[i]);
				var configFile = fs.readFileSync(configLocalPathServicesType+'/'+localServices[i]);
				var _configFile = {};
				//console.log(configFile);
			    try {
      				_configFile = JSON.parse(configFile);
    			}
    			catch(err) {
      				console.log("Error - json parse error: ");
					console.log(configFile);
      				return;
    			}
				console.log("     Name:    " + _configFile.name);
				console.log("     Version: " + _configFile.version.l1 + '.' + _configFile.version.l2 + '.' + _configFile.version.l3);

				var localServicesArray = localServicesConfigs[localServiceType];
				localServicesArray.push(_configFile);
			}
		}
		if (localServicesTypeCount>0) {
			localServicesTypeCount--;
		}
		if (localServicesTypeCount==0) startListen();
	});
};

getLocalServices('wps');

app.all('/favicon.ico', function(req, res) {
	var faviconFile = fs.readFileSync('./favicon.ico');
	res.send(faviconFile);
});

app.all('/*', function(req, res, next) {
	console.log("app.all/: " + req.url + " ; systemCode: " + _systemCode );
	next();
});

app.get('/'+_systemCode+'/openiod', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	executeProcess(req, res);
});

app.post('/'+_systemCode+'/openiod', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	executeProcess(req, res);
});

app.get('/'+_systemCode+'/openiod', function(req, res) {
	var _query = req.standardQuery;
	console.log("OpenIoD request: " + req.url );
});

app.get('/*', function(req, res) {
	console.log("OpenIoD request url error: " + req.url );
	var _message = errorMessages.URLERROR
	_message.message += " Try like this: /" + _systemCode + "/openiod?SERVICE=SOS&REQUEST=GetCapabilities";
	errorResult(res, _message);
	return;
});

var errorResult = function(res, message) {
	res.returncode = message.returnCode;
	res.contentType('text/plain');
	res.status(message.returnCode).send(message.message);
	console.log('Error: %s - %s', message.returnCode, message.message );
};

var executeProcess = function(req, res) {
	var _processIdentifier = req.query.identifier;
	var param = {};
	param.systemParameter 	= _systemParameter;
	param.systemCode 		= _systemCode;
	param.systemFolderParent= _systemFolderParent;

	if ( _processIdentifier && localServicesConfigs.wps[0].processOfferings[_processIdentifier] ) {
		var _processOffering = localServicesConfigs.wps[0].processOfferings[_processIdentifier]
		console.log(_processIdentifier);

//		// Execute function when exists in this context
//		if (internalProcessFunctions[_processIdentifier] && internalProcessFunctions[_processIdentifier].constructor === Function) {
//			internalProcessFunctions[_processIdentifier](req, res, query);
//		} else {
			// execute init methode when module already loaded
			if (processOfferingsModuleCache[_processIdentifier] != null ) {
				processOfferingsModuleCache[_processIdentifier].init(req, res, req.query, param, openIoDConfig);
				return;
			} else {
				// try to load processoffering as module and execute init method.
				try {
		//			console.log();
					processOfferingsModuleCache[_processIdentifier] = require('./processoffering/' +_processIdentifier);
				}
				catch(e) {
					processOfferingsModuleCache[_processIdentifier] = require('./processoffering/' + _processIdentifier + '/' + _processIdentifier);
		//			console.log('Process not Found !! ' + _processIdentifier);
		//			res.send(_processIdentifier);
		//			return;
				}
				processOfferingsModuleCache[_processIdentifier].init(req, res, req.query, param, openIoDConfig);
				return;
			}
//		}

		//res.contentType('text/xml');
 		res.send(_processIdentifier);

		return;
	};

	if (req.query) {
		console.log('Error: identifier:' + req.query.identifier);
	} else {
		console.log('Error: query:' + req.query);
	}

	errorResult(res, errorMessages.UNKNOWNIDENTIFIER );
};

var internalProcessFunctions = {};

var startListen = function() {
	app.listen(_systemListenPort);
	console.log('listening to http://proxyintern: ' + _systemListenPort );
}
