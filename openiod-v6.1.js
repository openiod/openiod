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
var openIodService					= require('./OpenIoD-Service');
var openIodXmlBuilder 				= require('./openiod-xmlbuilder');
var openIodObservationCollection 	= require('./openiod-observationcollection');
var openIodConnector_ILM			= require('OpenIoD-Connector-ILM');


//var cassandra 						= require('./openiod-cassandra');
var openIodMongoDb 					= require('./openiod-mongodb');

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

// queryKeys conversion table to convert 'semi'-standard keys into standard keys.
var queryKeys = {
	  "SERVICE" : 'SERVICE'		// key=uppercase keyname; value=standard keyname
	, "REQUEST" : 'REQUEST'
}

// read OpenIoD iod 		services configuration files
// read OpenIoD iot 		services configuration files
// read OpenIoD persistent 	services configuration files
// read OpenIoD process 	services configuration files
// read OpenIoD publication services configuration files

var configLocalPathServices 			= _systemFolderParent +'/config/openiod-services/';
var configLocalPathServicesIod 			= configLocalPathServices + 'iod'; 
var configLocalPathServicesIot 			= configLocalPathServices + 'iot'; 
var configLocalPathServicesPersistent 	= configLocalPathServices + 'persistent'; 
var configLocalPathServicesProcess 		= configLocalPathServices + 'process'; 
var configLocalPathServicesPublication 	= configLocalPathServices + 'publication'; 

console.log (configLocalPathServicesIot);


//cassandra.init();
//openIodMongoDb.init();
openIodMongoDb.init('openiod', null);

openIodConnector_ILM.loadAllModels(_systemFolder+'/node_modules/'+'OpenIoD-Connector-ILM');


var ignoreList = {".DS_Store":true}; 
var localServicesTypeCount = 5;
var localServicesConfigs={};
localServicesConfigs.iod			= [];
localServicesConfigs.iot			= [];
localServicesConfigs.persistent		= [];
localServicesConfigs.process		= [];
localServicesConfigs.publication	= [];

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

getLocalServices('iod');
getLocalServices('iot');
getLocalServices('persistent');
getLocalServices('process');
getLocalServices('publication');



app.all('/favicon.ico', function(req, res) {});

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
	var tmpQueryKey, newKeyName;
	console.log("app.all/: " + req.url + " ; systemCode: " + _systemCode );
	req.standardQuery = {};
	for (var key in req.query) {
		tmpQueryKey = key.toUpperCase();
		if (queryKeys[tmpQueryKey] != undefined ) {
			newKeyName = queryKeys[tmpQueryKey];
			req.standardQuery[newKeyName] = req.query[key];
		} else {
			req.standardQuery[key] = req.query[key];
		}
	}
	//console.log(req.query);
	//console.log(req.standardQuery);
	next();
});



/*
** SOS 2.0 Web Server

** SOS Core
** GetCapabilities	provides access to metadata and detailed information about the operations available by an SOS server.
** DescribeSensor	enables querying of metadata about the sensors and sensor systems available by an SOS server.
** GetObservation	provides access to observations by allowing spatial, temporal and thematic filtering.
*/

/*
** GetCapabilities parameters:
** service							= sos					mandatory
** request							= GetCapabilities		mandatory
** acceptVersions/AcceptVersions	= x.y.z					[0:1]
** sections/Sections				= list					[0:1]
** updateSequence/updateSequence	= charstring			[0:1]
** acceptFormats/AcceptFormats		= list of MIME types	[0:1]
*/

/*

** An example of a GetCapabilities request message encoded using KVP is:
  http: //hostname:port/path?SERVICE=WCS&REQUEST=GetCapabilities&ACCEPTVERSIONS=1.0.0,0.8.3&SECTIONS=Contents&UPDATESEQUENCE=XYZ123&ACCEPTFORMATS=text/xml
** This example includes all six possible parameters, but only the “service” and “request” parameters are required.



** An example of a GetCapabilities request message encoded in XML is:

<?xml version="1.0" encoding="UTF-8"?>
<GetCapabilities xmlns="http://www.opengis.net/ows/1.1"
xmlns:ows="http://www.opengis.net/ows/1.1"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.opengis.net/ows/1.1
fragmentGetCapabilitiesRequest.xsd" service="WCS"
updateSequence="XYZ123">
   <!-- Maximum example for WCS. Primary editor: Arliss Whiteside -->
   <AcceptVersions>
      <Version>1.0.0</Version>
      <Version>0.8.3</Version>
   </AcceptVersions>
   <Sections>
      <Section>Contents</Section>
   </Sections>
   <AcceptFormats>
      <OutputFormat>text/xml</OutputFormat>
   </AcceptFormats>
</GetCapabilities>

** This example includes all of the possible XML attributes and elements, 
** but only the “service” attribute is required, within the required GetCapabilities root element.

*/

//console.log('test');

app.get('/'+_systemCode+'/openiod', function(req, res, next) {
	console.log("OpenIoD request: " + req.url );
	var _query = req.standardQuery;
	
	// todo: transform query keys to UPPER (ReQuEsT-> REQUEST)
  
	if (_query == null) {
  		errorResult(res, errorMessages.NOQUERY);
		return;
	}
	if (_query.SERVICE == null || ( _query.SERVICE != 'SOS' && _query.SERVICE != 'WPS' ) ) {
  		errorResult(res, errorMessages.NOSERVICE);
		return;
	}
	
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
	
	if ( _query.SERVICE == 'WPS' ) {
		switch(_query.REQUEST) {
			case null:
  				errorResult(res, errorMessages.NOREQUEST);
				return;
				break;
			case 'GetCapabilities':
				getCapabilities(req, res, _query);
				break;
			case 'Execute':
				switch(_query.identifier) {
					case 'observation_average_day':
						executeObservationAverage('day', req, res, _query);
						break;
					case 'observation_average_month':
						executeObservationAverage('month', req, res, _query);
						break;
					case 'observation_average_year':
						executeObservationAverage('year', req, res, _query);
						console.log('Execute request observation_average_year ready.');
						break;
					case 'NDW_siteTable_import':
						executeNDW_siteTable_import( req, res, _query);
						break;
					case 'NDW_siteTable_update':
						executeNDW_siteTable_update( req, res, _query);
						break;
					case 'NDW_trafficSpeed_import':
						executeNDW_trafficSpeed_import( req, res, _query);
						break;
					case 'NDW_trafficSpeed_update':
						executeNDW_trafficSpeed_update( req, res, _query);
						break;
					case 'NDW_travelTime_import':
						executeNDW_travelTime_import( req, res, _query);
						break;
					case 'NDW_travelTime_update':
						executeNDW_travelTime_update( req, res, _query);
						break;
					default:
						errorResult(res, errorMessages.UNKNOWNIDENTIFIER );
						return;	
				}
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
	console.log("OpenIoD request: " + req.url );
	var _query = req.standardQuery;
	
});


/*
app.get('/'+_systemCode+'/openiod/:getFunction/:airbox', function(req, res) {
	console.log("data request: " + req.url );
	if (	req.params.getFunction == 'getAllMeasures' 		|| 
  		req.params.getFunction == 'getLastWeekMeasures') {
		openIoDAireasGetPg.getMeasures({airbox: req.params.airbox, getFunction: req.params.getFunction }, function(err, result) {
			res.contentType('application/json');
 			res.send(result.rows);
		});
		return;
	}
});
*/

app.get('/*', function(req, res) {
	console.log("OpenIoD request url error: " + req.url );
	var _message = errorMessages.URLERROR
	_message.message += " Try like this: /" + _systemCode + "/openiod?SERVICE=SOS&REQUEST=GetCapabilities"; 
	errorResult(res, _message);
	return;
});



var transformObservation = function(req, res, query) {
	/*
	** Transforming observation data from IoT specific into O&M or alike, json or xml
    */
	
	var resultOutput;
	
	var param = {};
	param.srsName 		= 'urn:ogc:def:crs:EPSG::4326';
	param.boundingBox	= {lowerCorner: {lat:123,lng:456}, upperCorner: {lat:125,lng:458} };
	param.object  = {
  "members": [
    {
      "observation": {
        "omSamplingTime": {
			"gmlTimePeriod": {
				"attributes": {
					"xsiType": "gml:TimePeriodType"
				},
				"gmlBeginPosition": "2015-02-06T00:01:00.000+01:00",
				"gmlEndPosition": "2015-02-06T00:01:00.000+01:00"
			}
		},	  
        "omProcedure": {
			"attributes": {
				"xlinkHref": "Air Quality Measurements ILM"
			}
		},	  
        "omObservedProperty": {
			"sweCompositePhenomenon": {
				"attributes": {
					"gmlId": "cpid0",
					"dimension": "2"
				},
				"gmlName": "Result Components",
				"sweComponents": [
					{ "sweComponent": {
						"attributes": {
							"xlinkHref": "http://www.opengis.net/def/property/OGC/0/SamplingTime"
						}
					}},
					{"sweComponent": {
						"attributes": {
							"xlinkHref": "Air Quality"
						}
					}}
				]
			}
		},	  
        "omFeatureOfInterest": {
			"gmlFeatureCollection": [
				{ "gmlFeatureMember": {
					 "saSamplingPoint": {
							"attributes": {
								"gmlId": "30.cal",
								"xsiSchemLocation": "http://www.opengis.net/sampling/1.0 http://schemas.opengis.net/sampling/1.0.0/sampling.xsd"
							},
							"gmlDescription": "NOT_SET",
							"gmlName": "1.cal",
							"saSampledFeature": {
								"attributes": {
									"xlinkRole": "urn:x-ogc:def:property:river",
									"xlinkHref": "http://sensorweb.demo.52north.org:80/PegelOnlineSOSv2.1/sos?REQUEST=getFeatureOfInterest&amp;service=SOS&amp;version=1.0.0&amp;featureOfInterestID=OSTE"
								}
							},
							"saPosition": {
								"gmlPoint": {
									"gmlPos": {
										"attributes": {
											"srsName": "urn:ogc:def:crs:EPSG::4326"
										},
										"gmlPointCoordinate": {
											"lat": 53.83357371129295,
											"lng": 9.034589157098823
										} 
									}
								}
							}
						}
					}	
				}	
			]
		},		  	  
        "result": {
          "sweDataRecord": {
            "samplingTime": {
				"sweTime": {
              		"attributes": {
						"definition": "http://www.opengis.net/def/property/OGC/0/SamplingTime"
	              	},
					"sweUom": {
              			"attributes": {
							"xlinkHref": "http://www.opengis.net/def/uom/ISO-8601/0/Gregorian"
	              		}
					}
              	}
            },
            "objectId": {
				"sweText": {
              	}
            },
            "PM1": {
				"sweFloat": {
					"sweUom": {
              			"attributes": {
							"code": "μg/m3"
	              		}
					}
              	}
            },
            "PM25": {
				"sweFloat": {
					"sweUom": {
              			"attributes": {
							"code": "μg/m3"
	              		}
					}
              	}
            },
            "PM10": {
				"sweFloat": {
					"sweUom": {
              			"attributes": {
							"code": "μg/m3"
	              		}
					}
              	}
            },
            "UFP": {
				"sweFloat": {
					"sweUom": {
              			"attributes": {
							"code": "counts/m3"
	              		}
					}
              	}
            },
            "OZON": {
				"sweFloat": {
					"sweUom": {
              			"attributes": {
							"code": "μg/m3"
	              		}
					}
              	}
            },
            "HUM": {
				"sweFloat": {
					"sweUom": {
              			"attributes": {
							"code": "perc"
	              		}
					}
              	}
            },
            "temperature": {
				"sweFloat": {
					"sweUom": {
              			"attributes": {
							"code": "C"
	              		}
					}
              	}
            },
            "north": {
				"sweFloat": {
              	}
            },
            "east": {
				"sweFloat": {
              	}
			}
          },
          "sweEncoding": {
            "sweTextBlock": {
              "attributes": {
                "decimalSeparator": ".",
                "tokenSeparator": ",",
                "blockSeparator": ";"
              }
            }
          },
          "values": [
            [
              "2015-02-06T00:10:00.000+01:00",
              "1.cal",
              1.0,
              2.5,
              10.0,
              20000.0,
              20.0,
              80.0,
              12.0,
              5126.868548,
              527.983934
            ],
            [
              "2015-02-06T00:20:00.000+01:00",
              "1.cal",
              1.0,
              2.5,
              10.0,
              20000.0,
              20.0,
              80.0,
              12.0,
              5126.868548,
              527.983934
            ]
          ]
        }
      }
    }
  ]
};
	
	var omObservationCollection = openIodObservationCollection.init("omObservationCollection", param);
	
	if (query.format == 'json') {
		res.contentType('application/json');
		resultOutput = JSON.stringify(omObservationCollection);		
	} else {
		res.contentType('text/xml');
		resultOutput = openIodXmlBuilder.buildXml(omObservationCollection, param);				
	}
	
 	res.send(resultOutput);
};

var getObservationHistory = function(req, res, query) {

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
	
	var testFoi = openIodConnector_ILM.getFeatureOfInterest(query.featureofinterest, param, function() {});
	console.log('test feature of interest: '+ testFoi);
	
	var options;
	var testFoiHistory = openIodConnector_ILM.getObservationHistory(query.featureofinterest, param, function() {
		console.log('Einde reqCsvHistory');
 		res.send('Einde reqCsvHistory');
	});
	console.log('Get feature of interest history is started: ' + testFoiHistory);
	for (var key in testFoi) {
		console.log('Feature of interest key: '+ key + ' value: ' + testFoi[key] );
	}

};


var getObservationAverage = function(period, req, res, query) {

	var resultOutput;
	if (query.featureofinterest == null) {
		errorResult(res, errorMessages.NOFOI);
		return;
	};
	if (query.featureofinterest == null) {
		errorResult(res, errorMessages.NOFOI);
		return;
	};
	
	
	var param = {};
	param.query = query;
	param.collection = 'observation_' + period;
	
	param.aggregation = [ 
		{ $match : { "_id.foiId": query.featureofinterest } }
	];

	if (period == 'day') {
		param.aggregation.push(	{ $sort : { "_id.foiId" : -1, "_id.year" : -1, "_id.month" : -1, "_id.dayOfMonth" : -1, "_id.status": 1 } } );
	}; 	
	if (period == 'month') {
		param.aggregation.push(	{ $sort : { "_id.foiId" : -1, "_id.year" : -1, "_id.month" : -1,  "_id.status": 1 } } );
	};		
	if (period == 'year') {
		param.aggregation.push(	{ $sort : { "_id.foiId" : -1, "_id.year" : -1, "_id.status": 1 } } );
	};	

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
//	param.aggregation = '[ {$group: {_id: { foiId: "$_id.foiId", year: { $year:"$_id.phenomenonDate" }, month: { $month:"$_id.phenomenonDate" }, dayOfMonth: { $dayOfMonth:"$_id.phenomenonDate" }, status: "$status"}, count: { $sum: 1}, avgUFP: { $avg: "$UFPFloat"}, avgPM1: { $avg: "$PM1Float"}, avgPM25: { $avg: "$PM25Float"}, avgPM10: { $avg: "$PM10Float"}}},{ $sort : { "_id.year" : -1, "_id.month" : -1, "_id.dayOfMonth" : -1, "_id.status": 1 } }]';		
	
	var testFoi = openIodConnector_ILM.getFeatureOfInterest(query.featureofinterest, param, function() {});
	console.log('test feature of interest: '+ testFoi);
	
	var options;
	var testFoiData = openIodConnector_ILM.getMongoData(query.featureofinterest, param, function(result) {
		console.log('End of getObservationAverage');
		
//		for (var key in data) {
//			console.log('Aggregation result, key: '+ key + ' value: ' + data[key] );
//		}
		var dataJson = JSON.stringify(result);
		//console.log(dataJson);
		
		res.contentType('application/json');
 		res.send(dataJson);
 		//res.send('testje okay');
	});
	console.log('Get feature of interest observation averages is started.');
	for (var key in testFoi) {
		console.log('Feature of interest key: '+ key + ' value: ' + testFoi[key] );
	}

};


var executeObservationAverage = function(period, req, res, query) {

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
						, avgPM1: { $avg: "$PM1Float"} 
						, avgPM25: { $avg: "$PM25Float"} 
						, avgPM10: { $avg: "$PM10Float"} 
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
						, avgPM1: { $avg: "$avgPM1"} 
						, avgPM25: { $avg: "$avgPM25"} 
						, avgPM10: { $avg: "$avgPM10"} 
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
						, avgPM1: { $avg: "$avgPM1"} 
						, avgPM25: { $avg: "$avgPM25"} 
						, avgPM10: { $avg: "$avgPM10"} 
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
	
	var testFoi = openIodConnector_ILM.getFeatureOfInterest(query.featureofinterest, param, function() {});
	console.log('test feature of interest: '+ testFoi);
	
	var options;
	var testFoiData = openIodConnector_ILM.merge(query.featureofinterest, param, function(result) {
		console.log('End of getObservationAverage, temporary collection: ' + param.collectionTmp);
		
		
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
	console.log('Get feature of interest observation averages is started.');
	//for (var key in testFoi) {
	//	console.log('Feature of interest key: '+ key + ' value: ' + testFoi[key] );
	//}

};



var getTrafficSpeed = function( req, res, query) {
	console.log('getTrafficSpeed');
	openIodMongoDb.getTrafficSpeed({ "location": "EHV" }, function(result) {
		res.contentType('text/html');
		res.header('Access-Control-Allow-Origin', '*');
		var htmlFile = JSON.stringify(result);
 		res.send(htmlFile);	
	} );
};

/*

db.observation.aggregate([ {$group: { \
					_id: { foiId: "$_id.foiId" \
						, year: { $year:"$_id.phenomenonDate" } \
					    , month: { $month:"$_id.phenomenonDate" } \
						, dayOfMonth: { $dayOfMonth:"$_id.phenomenonDate" } \
						, status: "$status" \
						  } \
					, count: { $sum: 1} \
					, avgUFP: { $avg: "$UFPFloat"} \
					, avgPM1: { $avg: "$PM1Float"} \
					, avgPM25: { $avg: "$PM25Float"} \
					, avgPM10: { $avg: "$PM10Float"} \
				}}, \
				{ $sort : { "_id.year" : -1, "_id.month" : -1, "_id.dayOfMonth" : -1, "_id.status": 1 } } \
				])

*/

// =================================================   
var executeNDW_siteTable_import = function( req, res, query) {

	// todo voor een ftp download sessie een apart service aanroepen of spawn?
	var _url = "ftp://83.247.110.3/measurement.gz";
	openIodService.service( 
		  {  url:_url, options:{ unzip: true } 
			, actions : [
		  	 	{ name: 'dropCollection'
				  ,	action: function(recordObject) {
						openIodMongoDb.dropCollection('NDW_siteTable_import', {}, function() {} );
					}
				}
		  ]}
		, {  xml: { 
				keyElement: { 
					'measurementSiteTable': { 
						onOpenTag: {
						  action: function(element) { 
								console.log('SiteTable: ' + element.attributes.id + ' onOpenTag' ); 
								return {initialRecordObject: { _id: { siteTableId : element.attributes.id + '_' + element.attributes.version} }};
							}
						},
						onCloseTag: {
						  action: function(elementName, record, stack) { 
								//console.log('Dit is siteTable' + elementName + ' onCloseTag' ); 
								return {};
							}
						}
					},
					'measurementSiteRecord': {
						onOpenTag: {
						  action: function(element) { 
								//console.log('SiteRecord: ' + element.attributes.id + ' onOpenTag' ); 
								return {recordObject: {},
										recordObjectId: { _id: { recordId: element.attributes.id } }  };
							}
						},
						onCloseTag: {
						  action: function(elementName, record, stack) { 
								//console.log('Dit is siteRecord' + elementName + ' onCloseTag' ); 
								var result = {saveRecordObject: { } };  //trigger for saveCollection
								return result;
							}
						}
					}
				},
				subElement: { 
				
				}
			}
			, database: {
				saveFunction: function(recordObject) {  //per record
					openIodMongoDb.saveCollectionRecord('NDW_siteTable_import', recordObject, function() {} );
				}
			  }
		  }
		, function(err, result) {
			console.log('execute NDW_siteTable_import service ready');
			console.log('execute NDW_siteTable_import service result: ' + result);
		  }
	);

	res.contentType('text/html');
	console.log('execute NDW_siteTable_import executed');
	var html = 'execute NDW_siteTable_import executed';
 	res.send(html);
};

// =================================================   
var executeNDW_siteTable_update = function( req, res, query) {

	openIodMongoDb.datex2Import2Model({collectionName: 'NDW_siteTable', location: 'EHV' }, function() {} );
	res.contentType('text/html');
	var htmlFile = 'execute NDW_siteTable update executed';
 	res.send(htmlFile);	

};


var executeNDW_trafficSpeed_import = function( req, res, query) {

	// todo voor een ftp download sessie een apart service aanroepen of spawn?
	var _url = "ftp://83.247.110.3/trafficspeed.gz";
	openIodService.service( 
		  {  url:_url, options:{ unzip: true } 
			, actions : [
		  	 	{ name: 'dropCollection'
				  ,	action: function(recordObject) {
						openIodMongoDb.dropCollection('NDW_trafficSpeed_import', {}, function() {} );
					}
				}
		  ]}
		, {   xml: { 
				keyElement: { 
					'measurementSiteTableReference': { 
						onOpenTag: {
						  action: function(element) { 
								console.log('Traffic speed: ' + element.attributes.id + ' onOpenTag' ); 
								return {initialRecordObject: { _id: { siteTableId : element.attributes.id + '_' + element.attributes.version} }};
							}
						},
						onCloseTag: {
						  action: function(elementName, record, stack) { 
								//console.log('Dit is trafficSpeed' + elementName + ' onCloseTag' ); 
								return {};
							}
						}
					},
					'siteMeasurements': {
						onOpenTag: {
						  action: function(element) { 
								//console.log('SiteRecord: ' + element.attributes.id + ' onOpenTag' ); 
								return {recordObject: {}};
							}
						},
						onCloseTag: {
						  action: function(elementName, record, stack) { 
								var result = {saveRecordObject: { } };
								return result;
							}
						}
					},
					'measurementSiteReference': {
						onOpenTag: {
						  action: function(element) { 
								return {recordObjectId: { _id: { recordId: element.attributes.id } } };
							}
						}
					}
				},
				subElement: { 
				
				}
			}
			, database: {
				saveFunction: function(recordObject) {
					openIodMongoDb.saveCollectionRecord('NDW_trafficSpeed_import', recordObject, function() {} );
				}
			  }
		  }
		, function(err, result) {
			console.log('execute NDW_trafficSpeed_import service ready');
			console.log('execute NDW_trafficSpeed_import service result: ' + result);
		  }
	);

	res.contentType('text/html');
	console.log('execute NDW_trafficSpeed_import executed');
	var html = 'execute NDW_trafficSpeed_import executed';
 	res.send(html);

};


// =================================================   
var executeNDW_trafficSpeed_update = function( req, res, query) {

	openIodMongoDb.datex2Import2Model({collectionName: 'NDW_trafficSpeed', location: 'EHV' }, function() {} );
	res.contentType('text/html');
	var htmlFile = 'NDW_trafficSpeed update executed';
 	res.send(htmlFile);	

};



var executeNDW_travelTime_import = function( req, res, query) {

	// todo voor een ftp download sessie een apart service aanroepen of spawn?
	var _url = "ftp://83.247.110.3/traveltime.gz";
	openIodService.service( 
		  
		  {  url:_url, options:{ unzip: true } 
			, actions : [
		  	 	{ name: 'dropCollection'
				  ,	action: function(recordObject) {
						openIodMongoDb.dropCollection('NDW_travelTime_import', {}, function() {} );
					}
				}
		  	]}
		, { xml: { 
				keyElement: { 
					'measurementSiteTableReference': { 
						onOpenTag: {
						  action: function(element) { 
								//console.log('Traveltime: ' + element.attributes.id + ' onOpenTag' ); 
								return {initialRecordObject: { _id: { siteTableId : element.attributes.id + '_' + element.attributes.version} }};
							}
						},
						onCloseTag: {
						  action: function(elementName, record, stack) { 
								return {};
							}
						}
					},
					'siteMeasurements': {
						onOpenTag: {
						  action: function(element) { 
								return {recordObject: {}};
							}
						},
						onCloseTag: {
						  action: function(elementName, record, stack) { 
								var result = {saveRecordObject: { } };
								return result;
							}
						}
					},
					'measurementSiteReference': {
						onOpenTag: {
						  action: function(element) { 
								//console.log('SiteRecord: ' + element.attributes.id + ' onOpenTag' ); 
								return {recordObjectId: { _id: { recordId: element.attributes.id } } };
							}
						}
					}
				}
			}
			, database: {
				saveFunction: function(recordObject) {
					openIodMongoDb.saveCollectionRecord('NDW_travelTime_import', recordObject, function() {} );
				}
			  }
		  }
		, function(err, result) {
			console.log('execute NDW_travelTime_import service ready');
			console.log('execute NDW_travelTime_import service result: ' + result);
		  }
	);

	res.contentType('text/html');
	console.log('execute NDW_travelTime_import executed');
	var html = 'execute NDW_travelTime_import executed';
 	res.send(html);

};


// =================================================   
var executeNDW_travelTime_update = function( req, res, query) {

	openIodMongoDb.datex2Import2Model({collectionName: 'NDW_travelTime', location: 'EHV' }, function() {} );
	res.contentType('text/html');
	var htmlFile = 'NDW_travelTime update executed';
 	res.send(htmlFile);	

};



var getModel = function(req, res, query) {

	var resultOutput;
	if (query.model == null) {
		errorResult(res, errorMessages.NOMODEL);
		return;
	};
	
	var testmodel = openIodConnector_ILM.getModel('P1-25-10-UOHT');
	console.log('testmodel: '+ testmodel);
	var testmodels = openIodConnector_ILM.getModels();
	console.log('testmodels: '+ testmodels);
	for (var key in testmodel) {
		console.log('testmodel: '+ key + ' value: ' + testmodel[key] );
	}

	
//	cassandra.getModel(query.model, null, function(err, rows) {
//		resultOutput = rows;
// 		res.send(resultOutput);
//	});
	
	var options;
	openIodConnector_ILM_CsvHistory.reqCsvHistory(options, function() {
		console.log('Einde reqCsvHistory');
		//resultOutput = rows;
 		//res.send(resultOutput);
		//console.log(resultOutput);
		//console.log(err);

 		res.send('Einde reqCsvHistory');
	} );
	
};

var saveFeatureOfInterest = function(req, res, query) {
	
	
	//	featureOfInterest: featureOfInterestId, objectId, map(startDateTime, {status, description, name, srsName, lat, lng}, list ( name, type, uom, value );
	//	dataRecord: featureOfInterestId, dataRecord, list ( name, type, uom, value );
	
	
	


/*
	var resultOutput;
	if (query.model == null) {
		errorResult(res, errorMessages.NOMODEL);
		return;
	};
	
	cassandra.getModel(query.model, null, function(err, rows) {
		resultOutput = rows;
 		res.send(resultOutput);
	});
*/
	
};



var getDataRecord = function(req, res, query) {
	var resultOutput;
	if (query.model == null) {
		errorResult(res, errorMessages.NOMODEL);
		return;
	};
	resultOutput = "This REQUEST is still work in progress. ";
 	res.send(resultOutput);
};


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

	res.contentType('text/xml');
 	res.send("<GETCAPABILITIES> \
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
					<ServiceProvider></ServiceProvider> \
					<OperationsMetadata> \
							<GetCapabilities></GetCapabilities> \
							<DescribeSensor></DescribeSensor> \
							<GetObservation></GetObservation> \
							<GetObservationHistory></GetObservationHistory> \
							<GetObservationAverage></GetObservationAverage> \
							<TransformObservation></TransformObservation> \
							<GetModel></GetModel> \
							<GetDataRecord></GetDataRecord> \
					</OperationsMetadata> \
					<extension></extension> \
					<Contents></Contents> \
					<filterCapabilities></filterCapabilities> \
		</sections> \
		</GETCAPABILITIES>");	
}

var errorResult = function(res, message) {
	res.returncode = message.returnCode;
	res.contentType('text/plain');
// 	res.send(message.returnCode, message.message);
	res.status(message.returnCode).send(message.message);
};


var startListen = function() {
	app.listen(_systemListenPort);
	console.log('listening to http://proxyintern: ' + _systemListenPort );
}
 

