/*
** Module: openiod-wps
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
var request 			= require('request');
var express 			= require('express');
//var cookieParser 		= require('cookie-parser');
//var session 			= require('express-session');
//var uid 				= require('uid-safe');
////var bodyParser 		= require('connect-busboy');
var fs 					= require('fs');
var xml2js 				= require('xml2js');

var _systemCode 		= openIoDConfig.getSystemCode();
var _systemFolderParent	= openIoDConfig.getSystemFolderParent();
var _systemFolder		= openIoDConfig.getSystemFolder();
var _systemListenPort	= openIoDConfig.getSystemListenPort();

/*
var openIoDAireasGetPg 	= require('./openiod-get-pg');
openIoDAireasGetPg.init({
		systemFolderParent: openIoDConfig.getSystemFolderParent(),
		configParameter: 	openIoDConfig.getConfigParameter(),
		systemCode: 		openIoDConfig.getSystemCode()
	});
*/

//var iotOM 				= require('./iot-om2.0');
//var openIodService					= require('./OpenIoD-Service');
//var openIodXmlBuilder 				= require('./openiod-xmlbuilder');
//var openIodObservationCollection 	= require('./openiod-observationcollection');
//var openIodConnector_ILM			= require('OpenIoD-Connector-ILM');

//var openIodMongoDb 					= require('./openiod-mongodb');

var app = express();

/*
var sess = {
  	  secret: 'keyboscapelard cat'
  	, resave:true
	, saveUninitialized:true
  	, cookie: {
	// maxAge: 60000 
	}
//	, genid: function(req) {
//			var _openIoDUuid = openIoDGuid('');
//			console.log("New session: " + _openIoDUuid);
//			var string = uid.sync(24);
//			console.log("New session: " + string);
//    		return string;  //return genuuid(); // use UUIDs for session IDs
//  		}
}

if (app.get('env') === 'production') {
  	app.set('trust proxy', 1) // trust first proxy (app.enable('trust proxy');)
  	sess.cookie.secure = true // serve secure cookies
}

app.use(cookieParser());
app.use(session(sess));

//var random = utils.uid(24);
//var sessionID = cookie['express.sid'].split('.')[0];


app.use(function(req, res, next) {
	//	console.log('Check for session info');
	if (req.session) {
  		var _sessionInfo = req.session;
		console.log('Session info found '+'req.cookies: ' + req.cookies['connect.sid'] + ' session.views ' + _sessionInfo.views);

  		if (_sessionInfo.views) {
			_sessionInfo.views++;
  		} else {
			_sessionInfo.views = 1;
			if(typeof req.cookies['connect.sid'] !== 'undefined'){
        		console.log('req.cookies: ' + req.cookies['connect.sid']);
    		}
			console.log('Session info init '+'req.session: ' + JSON.stringify(req.session) );
			console.log('Session info init '+'req.cookies: ' + JSON.stringify(req.cookies) +' ' + req.cookies['connect.sid'] + ' session.views ' + _sessionInfo.views);
  		}
		res.cookie('reqcount', _sessionInfo.views, { expires: new Date(Date.now() + 900000), httpOnly: true });
  	}
	next();
});
*/

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

// standardQueryKeys, conversion table to convert 'semi'-standard keys into standard keys.
var standardQueryKeys = {
	  "SERVICE" : 'SERVICE'		// key=uppercase keyname; value=standard keyname
	, "REQUEST" : 'REQUEST'
}

var processOfferingsModuleCache = {};



// read OpenIoD iod 		services configuration files
// read OpenIoD iot 		services configuration files
// read OpenIoD persistent 	services configuration files
// read OpenIoD process 	services configuration files
// read OpenIoD publication services configuration files

var configLocalPathWpsCapabilities		= _systemFolderParent +'/wps-capabilities.json';

var configLocalPathServices 			= _systemFolderParent +'/config/openiod-services/';
var configLocalPathServicesIod 			= configLocalPathServices + 'iod'; 
var configLocalPathServicesIot 			= configLocalPathServices + 'iot'; 
var configLocalPathServicesPersistent 	= configLocalPathServices + 'persistent'; 
var configLocalPathServicesProcess 		= configLocalPathServices + 'process'; 
var configLocalPathServicesPublication 	= configLocalPathServices + 'publication'; 

console.log (configLocalPathServicesIot);

//openIodMongoDb.init('openiod', null);
//openIodConnector_ILM.loadAllModels(_systemFolder+'/node_modules/'+'OpenIoD-Connector-ILM');


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

//getLocalServices('iod');
//getLocalServices('iot');
//getLocalServices('persistent');
//getLocalServices('process');
//getLocalServices('publication');
getLocalServices('wps');


app.all('/favicon.ico', function(req, res) {
	var faviconFile = fs.readFileSync('./favicon.ico');
	res.send(faviconFile);
});

app.get('/'+_systemCode+'/openiod/test.html', function(req, res) {
	console.log("OpenIoD test.html: " + req.url );
	var htmlFile = fs.readFileSync('./test.html');
	res.contentType('text/html');
//	htmlFile = 'testje';
 	res.send(htmlFile);
});	
app.get('/'+_systemCode+'/openiod/testlocalhost.html', function(req, res) {
	console.log("OpenIoD test.html: " + req.url );
	var htmlFile = fs.readFileSync('./testlocalhost.html');
	res.contentType('text/html');
//	htmlFile = 'testje';
 	res.send(htmlFile);
});
	
app.get('/'+_systemCode+'/openiod/testservice', function(req, res ) {
	console.log("OpenIoD testservice: " + req.url );
	
	res.contentType('text/html');
	var htmlFile = 'testrun started';
 	res.send(htmlFile);	
	
});	
	


app.all('/*', function(req, res, next) {
	console.log("app.all/: " + req.url + " ; systemCode: " + _systemCode );
	next();
});

app.get('/'+_systemCode+'/openiod', function(req, res, next) {
	var _query;

	// transform parameters into standard keys. Rename if exists in standardQueryKeys
	_query = transformStandardParametersKeys(req);

	if (_query != null && _query.SERVICE == 'WPS' ) {
		console.log("OpenIoD request WPS: " + req.url );
		switch(_query.REQUEST) {
			case null:
  				errorResult(res, errorMessages.NOREQUEST);
				return;
				break;
			case 'GetCapabilities':
				getCapabilities(req, res, _query);
				break;
			case 'Execute':
			
				executeProcess(req, res, _query);
	
				break;
			default:
  				errorResult(res, errorMessages.UNKNOWNREQ );
				return;
		}
		return;
	}
	
	next();

});

app.get('/'+_systemCode+'/openiod', function(req, res) {
	var _query = req.standardQuery;

	if (_query == null) {
  		errorResult(res, errorMessages.NOQUERY);
		return;
	}

	if (_query.SERVICE == null || ( _query.SERVICE != 'SOS' && _query.SERVICE != 'WPS' ) ) {
		errorResult(res, errorMessages.NOSERVICE);
		return;
	}	

	console.log("OpenIoD request SOS: " + req.url );
	console.log('Service: %s', _query.SERVICE);
	
	if ( _query.SERVICE == 'SOS' ) {
		switch(_query.REQUEST) {
			case null:
  				errorResult(res, errorMessages.NOREQUEST);
				return;
				break;
			case 'GetCapabilities':
				getCapabilities(req, res, _query);
				break;
			case 'GetObservationHistory':
				getObservationHistory(req, res, _query);
				break;
			case 'GetObservationAverage':
				switch(_query.period) {
					case 'day':
						getObservationAverage('day', req, res, _query);
						break;
					case 'month':
						getObservationAverage('month', req, res, _query);
						break;
					case 'year':
						getObservationAverage('year', req, res, _query);
						break;
					default:
						errorResult(res, errorMessages.UNKNOWNIDENTIFIER );
						return;	
				}
				break;
			case 'GetTrafficSpeed':
				getTrafficSpeed(req, res, _query);
				break;
			case 'TransformObservation':
				transformObservation(req, res, _query);
				break;
			case 'GetModel':
				getModel(req, res, _query);
				break;
			case 'GetDataRecord':
				getDataRecord(req, res, _query);
				break;
			default:
  				errorResult(res, errorMessages.UNKNOWNREQ );
				return;
		}
	}
	

	
});


app.get('/*', function(req, res) {
	console.log("OpenIoD request url error: " + req.url );
	var _message = errorMessages.URLERROR
	_message.message += " Try like this: /" + _systemCode + "/openiod?SERVICE=SOS&REQUEST=GetCapabilities"; 
	errorResult(res, _message);
	return;
});



var getCapabilities = function(req, res, query) {
	/*
	** respond with Service metadata document OGC 06-121r3 7.4.2
	
	** version			specification version for GetCapabilities response					char	mandatory
	** updateSequence	Service metadata document version. Increase when something changes.	char	[0:1]
	
	** sections:
	** ServiceIdentification	Metadata about this specific server.
	** ServiceProvider			Metadata about the organization operating this server.
	** OperationsMetadata		Metadata about the operations specified by this service and implemented by this server, 
								including the URLs for operation requests
	** Contents					Metadata about the data served by this server.
	** All						Return complete service metadata document, containing all elements
	
	*/
	var output;

//	output = '<?xml version="1.0" encoding="UTF-8"?><wfsb:WFS_Simple_Capabilities version="1.0.0" updateSequence="0" xmlns="http://www.opengis.net/ows" 
	output = '<?xml version="1.0" encoding="UTF-8"?> \
<wps:Capabilities service="WPS" version="1.0.0" xml:lang="en-US" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 ../wpsGetCapabilities_response.xsd" updateSequence="1"> \
		<version></version> \
		<updateSequence></updateSequence> \
		<sections> \
					<ServiceIdentification> \
						<ServiceType></ServiceType> \
						<ServiceTypeVersion></ServiceTypeVersion> \
						<profile></profile> \
						<title></title> \
						<abstract></abstract> \
						<keywords></keywords> \
						<fees></fees> \
						<accessConstraints></accessConstraints> \
					</ServiceIdentification> \
					<ServiceProvider></ServiceProvider> ';
					
	output += "<ows:OperationsMetadata>"	

	for (var operation in localServicesConfigs.wps[0].operations) {
		output += "<" + operation + ">" + "</" + operation + ">";	
	}				
	output += "</ows:OperationsMetadata>"				

	output += "<wps:ProcessOfferings>"	

	for (var processOffering in localServicesConfigs.wps[0].processOfferings) {
		output += "<" + processOffering + ">" + "</" + processOffering + ">";	
	}				
	output += "</wps:ProcessOfferings>";		

					
	output += '<extension></extension>' ;
	output += '<Contents></Contents>';
	output += '<filterCapabilities></filterCapabilities>';
	output += '</sections>';
		
	if (localServicesConfigs.wps[0].wpsLanguages) {
		output += '	<wps:Languages> ';
		output += '	<wps:Default> ';
		output += '	<ows:Language>' + localServicesConfigs.wps[0].wpsLanguages.wpsDefault.owsLanguage + '</ows:Language> ';
		output += '	</wps:Default> ';
		output += '	<wps:Supported> ';
		for (var i=0;i<localServicesConfigs.wps[0].wpsLanguages.wpsSupported.length;i++) {
			output += '	<ows:Language>' + localServicesConfigs.wps[0].wpsLanguages.wpsSupported[i].owsLanguage + '</ows:Language> ';
			
		}		
		output += '	</wps:Supported> ';		
		output += '	</wps:Languages> ';
	}
	output += '<wps:WSDL xlink:href="http://foo.bar/wps?WSDL"/> \
	</wps:Capabilities>';		
	
	res.contentType('text/xml');
 	res.send(output);
}


var errorResult = function(res, message) {
	res.returncode = message.returnCode;
	res.contentType('text/plain');
	res.status(message.returnCode).send(message.message);
};

// transform parameters into standard keys if exists in standardQueryKeys
var transformStandardParametersKeys = function(req) {
	var tmpQueryKey, newKeyName;
	var _standardQuery = {};
	for (var key in req.query) {
		tmpQueryKey = key.toUpperCase();
		if (standardQueryKeys[tmpQueryKey] != undefined ) {
			newKeyName = standardQueryKeys[tmpQueryKey];
			_standardQuery[newKeyName] = req.query[key];
		} else {
			_standardQuery[key] = req.query[key];
		}
	}
	req.standardQuery = _standardQuery;
	return _standardQuery;
};

var executeProcess = function(req, res, query) {
	var _processIdentifier = query.identifier;
	if ( _processIdentifier && localServicesConfigs.wps[0].processOfferings[_processIdentifier] ) {
		var _processOffering = localServicesConfigs.wps[0].processOfferings[_processIdentifier]
		console.log(_processIdentifier);

		// Execute function when exists in this context
		if (internalProcessFunctions[_processIdentifier] && internalProcessFunctions[_processIdentifier].constructor === Function) {
			internalProcessFunctions[_processIdentifier](req, res, query);
		} else {
			// execute init methode when module already loaded
			if (processOfferingsModuleCache[_processIdentifier] != null ) {
				processOfferingsModuleCache[_processIdentifier].init(req, res, query);
				return;
			} else {
				// try to load processoffering as module and execute init method. 
		//		try {
		//			console.log();
					processOfferingsModuleCache[_processIdentifier] = require('./processoffering/' +_processIdentifier);
		//		}
		//		catch(e) {
		//			console.log('Process not Found !! ' + _processIdentifier);
		//			res.send(_processIdentifier);
		//			return;
		//		}	
				processOfferingsModuleCache[_processIdentifier].init(req, res, query);
				return;
			}
		}
				
		//res.contentType('text/xml');
 		res.send(_processIdentifier);

		return;
	};

	console.log('Error: identifier:' + query.identifier);
	
	errorResult(res, errorMessages.UNKNOWNIDENTIFIER );
	return;	

};

var internalProcessFunctions = {};

internalProcessFunctions.NDW_trafficSpeed_update = function() {
	console.log('Internal function executed');
}

var startListen = function() {
	app.listen(_systemListenPort);
	console.log('listening to http://proxyintern: ' + _systemListenPort );
}
 
