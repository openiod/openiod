
/**
 * The module transforms observations from format O&M to format OIOD (OpenIod) and vv
 * other transformations are possible eg. from and to raw sensor data
 * @module transform_observation
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

var request 				= require('request');
var fs						= require('fs');
var openIodConnector_ILM	= require('OpenIoD-Connector-ILM');
var openIodConnector_ApriSensor	= require('./../../connectors/OpenIoD-Connector-ApriSensor/index.js');

var pathPrefix				= './../../';

console.log('Module ' + 'transform_observation.js' + ' start');

var openIodXmlBuilder 		= require(pathPrefix+'openiod-xmlbuilder');
var openIodSosSensorMl 		= require(pathPrefix+'openiod-sossensorml');
var openIodSosOm	 		= require(pathPrefix+'openiod-sosom');
var openIodHumanSensorMd	= require(pathPrefix+'openiod-human-sensor-md');

var localObjects = [];
var openIoDConfig;

//var testje = require.resolve('OpenIoD-Connector-ILM');
//console.log('require ILM module location:');
//console.log(testje);
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
	, NOINPUTFORMAT 	: { "message": 'ACTION or INPUTFORMAT parameter missing, use inputformat=[testom,testsml,insertom,executeinsertom,insertsensor,executeinsertsensor,getresult]'	, "returnCode": 501 }
	, NOOBJECTID	 	: { "message": 'OBJECTID parameter missing, use objectid=sensorPm1Id or objectid=airboxId or objectid=humansensor'	, "returnCode": 501 }
	, NOOFFERING	 	: { "message": 'Offering or procedure unknown'	, "returnCode": 501 }
}

var errorResult = function(res, message) {
	res.returncode = message.returnCode;
	res.contentType('text/plain');
	res.status(message.returnCode).send(message.message);
};

var getUrlEnd		= function (url) {
	var _urlArray	= url.split('/');
	return _urlArray[_urlArray.length-1];
};
var getPropertyEnd	= function (property) {
	var _propertyArray	= property.split('_');
	return _propertyArray[_propertyArray.length-1];
};
var getPropertyEndFoi	= function (property) {
	var _propertyArray	= property.split('_');
	if (_propertyArray[_propertyArray.length-2].substr(0,4)=='SCRP') {
		return _propertyArray[_propertyArray.length-2]+'*'+_propertyArray[_propertyArray.length-1];
	}
	return _propertyArray[_propertyArray.length-1];
};

var sensorSystemConfigCache = {};


var initObjects = function() {

	localObjects = [];


	var localObject = {};  //airbox Id



	localObject.smlIdentification	= openIodSosSensorMl.initSmlIdentification({uniqueID:'??', longName:'??', shortName:'??'});


/* not allowed

	localObject.smlCharacteristics	=
		{
			"attributes": {
				"name": "generalProperties"
			},
			"smlCharacteristicList": [
				{ "smlCharacteristic": {
					"attributes": {
						"name": "physicalProperties"
					},
					"sweDataRecord": {
						"attributes": {
							"definition": "http://wiki.aireas.com/index.php/airbox"
						},
						"sweLabel": "Physical Properties",

						"sweField": {
						"sweDataRecord": [

						{"sweField": {
							"attributes": {
								"name": "Weight"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox"
								},
								"sweUom": {
									"attributes": {
										"name": "kg"
									}
								},
								"sweValue": 3
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "Length"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox"
								},
								"sweUom": {
									"attributes": {
										"name": "in"
									}
								},
								"sweValue": 4.5
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "Width"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox"
								},
								"sweUom": {
									"attributes": {
										"name": "in"
									}
								},
								"sweValue": 6
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "Height"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox"
								},
								"sweUom": {
									"attributes": {
										"name": "in"
									}
								},
								"sweValue": 14
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "CasingMaterial"
							},
							"sweCategory": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox"
								},
								"sweValue": "Aluminum"
							}
						}}
						]
					}

					}
					}
				},
				{ "smlCharacteristic": {
					"attributes": {
						"name": "electricalRequirements"
					},
					"sweDataRecord": {
						"attributes": {
							"definition": "http://wiki.aireas.com/index.php/airbox_power_requirement"
						},
						"sweLabel": "Electrical Requirements",

						"sweField": {
						"sweDataRecord": [

						{"sweField": {
							"attributes": {
								"name": "Voltage"
							},
							"sweQuantityRange": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_power_requirement"
								},
								"sweUom": {
									"attributes": {
										"name": "V"
									}
								},
								"sweValue": "8 12"
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "AmpRange"
							},
							"sweQuantityRange": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_power_requirement"
								},
								"sweUom": {
									"attributes": {
										"name": "mA"
									}
								},
								"sweValue": "20 40"
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "CurrentType"
							},
							"sweCategory": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox"
								},
								"sweValue": "DC"
							}
						}}
						]
					}

					}
					}
				}

			]
		};
*/

	localObject.smlCapabilitiesOfferings	= openIodSosSensorMl.initSmlCapabilitiesOfferings({name:"??", url:"??"});

	localObject.smlCapabilitiesFeaturesOfInterest	= openIodSosSensorMl.initSmlCapabilitiesFeaturesOfInterest({url:"??"});

	localObject.smlInputs	=
		{
			"smlInputList": {
				"smlInput": {
					"attributes": {
						"name": "aireasinput"
					}
					,"sweObservableProperty": {
//						"attributes": {
//							"definition": "http://wiki.aireas.com/index.php/airbox_pm1"
//						}
					}
				}
			}

		};

	localObject.smlOutputs	=
		{
			"smlOutputList": {
				"smlOutput": {
					"attributes": {
						"name": "measurement"
					},
					"sweDataRecord": [
						{"sweField": {
							"attributes": {
								"name": "GPS_lat"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_gps"
								},
							//	"sweLabel": "Ozone",
								"sweUom": {
									"attributes": {
										"code": "min/degree"
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "GPS_lng"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_gps"
								},
							//	"sweLabel": "Ozone",
								"sweUom": {
									"attributes": {
										"code": "min/degree"
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "Ozone"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_ozone"
								},
							//	"sweLabel": "Ozone",
								"sweUom": {
									"attributes": {
										"code": "µg/m3"
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "PM1"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_pm1"
								},
							//	"sweLabel": "PM1",
								"sweUom": {
									"attributes": {
										"code": "µg/m3"
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "PM25"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_pm25"
								},
							//	"sweLabel": "PM2.5",
								"sweUom": {
									"attributes": {
										"code": "µg/m3"
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "PM10"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_pm10"
								},
							//	"sweLabel": "PM10",
								"sweUom": {
									"attributes": {
										"code": "µg/m3"
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "UFP"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_ufp"
								},
							//	"sweLabel": "UFP",
								"sweUom": {
									"attributes": {
										"code": "cnts/m3"
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "NO2"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_no2"
								},
							//	"sweLabel": "NO2",
								"sweUom": {
									"attributes": {
										"code": "µg/m3"
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "RHUM"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_rhum"
								},
							//	"sweLabel": "NO2",
								"sweUom": {
									"attributes": {
										"code": "Perc"
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "RHUMEXT"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_rhumext"
								},
							//	"sweLabel": "NO2",
								"sweUom": {
									"attributes": {
										"code": "Perc"
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "TEMP"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_temp"
								},
							//	"sweLabel": "NO2",
								"sweUom": {
									"attributes": {
										"code": "C"
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "TEMPEXT"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_tempext"
								},
							//	"sweLabel": "NO2",
								"sweUom": {
									"attributes": {
										"code": "C"
									}
								}
							}
						}}
						]
				}
			}
		};

	var localProcedure = {};
	localProcedure.smlSensorMl = {};
	localProcedure.smlSensorMl.attributes = {};
	localProcedure.smlSensorMl.attributes.version = "1.0.1";
	localProcedure.smlSensorMl.smlMember = {};
	localProcedure.smlSensorMl.smlMember.smlSystem = {};
	localProcedure.smlSensorMl.smlMember.smlSystem = localObject;

/*

	var localObservableProperties = [
//	   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_gpslat"},
//	   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_gpslng"},
//	   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_ozone"},
	   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_pm1"}
//	   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_pm25"},
//	   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_pm10"},
//	   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_ufp"},
//	   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_no2"}
	];


	var localObservationTypes = [
		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" }
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" }, //OM_GeometryObservation
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CountObservation" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" }
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CountObservation" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_TextObservation" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_TruthObservation" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_SWEArrayObservation" }
	];
*/


	//http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Observation

	localObjects['airboxId'] = {};
	localObjects['airboxId'].objectType  	= 'smlPhysicalSystem';
	localObjects['airboxId'].objectId		= 'airboxId';
	localObjects['airboxId'].procedure = localProcedure;  //airbox Id
	localObjects['airboxId'].observableProperties = openIodSosSensorMl.initObservableProperties([
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_gpslat"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_gpslng"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_ozone"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_pm1"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_pm25"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_pm10"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_ufp"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_no2"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_rhum"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_rhumext"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_temp"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_tempext"}
		]);
	localObjects['airboxId'].metadata = {};
	localObjects['airboxId'].metadata.sosSosInsertionMetadata = openIodSosSensorMl.initObservationTypes([
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_GeometryObservation" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_GeometryObservation" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CountObservation" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" }
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation" },
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CountObservation" },
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_TextObservation" },
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_TruthObservation" },
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_SWEArrayObservation" }
		]);

/*
<swes:InsertSensorResponse xmlns:swes="http://www.opengis.net/swes/2.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/swes/2.0 http://schemas.opengis.net/swes/2.0/swesInsertSensor.xsd">
<swes:assignedProcedure>http://www.52north.org/test/procedure/9</swes:assignedProcedure>
<swes:assignedOffering>http://wiki.aireas.com/index.php/21.cal</swes:assignedOffering>
</swes:InsertSensorResponse>
*/





//==========================  end of airboxId




	var localObject = {};  //airbox Id 21

/*
	localObject.srsName 		= 'urn:ogc:def:crs:EPSG::4326';
//	param.boundingBox	= {lowerCorner: {lat:123,lng:456}, upperCorner: {lat:125,lng:458} };
	localObject.objectType  	= 'smlPhysicalSystem';
	localObject.objectId		= '21';

	localObject.elements  = [];

	var _element = {};
	_element.gmlDescription	= "Airbox historical data, status messages and maintenance messages.";
	localObject.elements.push(_element);


	_element = {};
	_element.gmlIdentifier	=
		{
			"attributes": {
				"codeSpace": "uid"
			},
			"elementValue": "urn:aaa:bbb:1234567890"
		};
	localObject.elements.push(_element);

	_element = {};
	_element.gmlName	= "ILM Airbox 21";
	localObject.elements.push(_element);
*/
	localObject.smlKeywords	=
		{
			"smlKeywordList": [
				{ "smlKeyword":"ILM"},
				{ "smlKeyword":"ECN"},
				{ "smlKeyword":"Airbox"},
				{ "smlKeyword":"Airbox21"},
				{ "smlKeyword":"AiREAS"}
			]
		};

	localObject.smlTypeOf	=
		{
			"attributes": {
				"xLinkTitle": "urn:airbox:21"
			},
			"xLinkHref": "http://openiod.com/SCAPE604/openiod?SERVICE=WPS&amp;REQUEST=Execute&amp;identifier=transform_observation&amp;objectId=airboxId&amp;inputformat=testsml&amp;format=xml"
		};


	localObject.smlPosition	=
		{
			"gmlPoint": {
				"attributes": {
					"codeSpace": "uid"
				},
				"gmlCoordinates": "47.8 88.56"
			}
		};



	localObjects['airboxId21'] = localObject;  //airbox Id 21
	localObjects['airboxId21'].objectType  	= 'smlPhysicalComponent';
	localObjects['airboxId21'].objectId		= 'airboxId21';


//==========================  end of airboxId






	var localObject = {};  // PM1 sensor Id

	localObject.gmlDescription	= "Sensor PM1";

	localObject.gmlIdentifier	=
		{
			"attributes": {
				"codeSpace": "uid"
			},
			"elementValue": "urn:aaa:bbb:1234567890"
		};

	localObject.gmlName	= "ILM Airbox sensor PM1";

/* not allowed here
	_element = {};
	_element.smlKeywords	=
		{
			"smlKeywordList": [
				{ "smlKeyword":"ILM"},
				{ "smlKeyword":"ECN"},
				{ "smlKeyword":"Airbox"},
				{ "smlKeyword":"PM1"},
				{ "smlKeyword":"AiREAS"}
			]
		};
	localObject.elements.push(_element);
*/
	localObject.smlCharacteristics	=
		{
			"attributes": {
				"name": "generalProperties"
			},
			"smlCharacteristicList": [
				{ "smlCharacteristic": {
					"attributes": {
						"name": "electricalRequirements"
					},
					"sweDataRecord": {
						"attributes": {
							"definition": "http://wiki.aireas.com/index.php/airbox_power_requirement"
						},
						"sweLabel": "Electrical Requirements",

						"sweField": {
						"sweDataRecord": [

						{"sweField": {
							"attributes": {
								"name": "Voltage"
							},
							"sweQuantityRange": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_power_requirement"
								},
								"sweUom": {
									"attributes": {
										"name": "V"
									}
								},
								"sweValue": "8 12"
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "AmpRange"
							},
							"sweQuantityRange": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_power_requirement"
								},
								"sweUom": {
									"attributes": {
										"name": "mA"
									}
								},
								"sweValue": "20 40"
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "CurrentType"
							},
							"sweCategory": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox"
								},
								"sweValue": "DC"
							}
						}}
						]
					}

					}
					}
				}

			]
		};

	localObject.smlCapabilities	=
		{
			"attributes": {
				"name": "specifications"
			},
			"smlCapabilityList": [
				{ "smlCapability": {
					"attributes": {
						"name": "capability..."
					},
					"sweDataRecord": {
						"attributes": {
							"definition": "http://wiki.aireas.com/index.php/pm10"
						},
						"sweLabel": "capability...",
						"sweDataRecord": [
						]
					}
				}
			}
			]
		};

	localObject.smlInputs	=
		{
			"smlInputList": {
				"smlInput": {
					"attributes": {
						"name": "pm1input"
					},
					"smlObservableProperty": {
						"attributes": {
							"definition": "http://wiki.aireas.com/index.php/pm1"
						}
					}
				}
			}

		}

	localObject.smlOutputs	=
		{
			"smlOutputList": {
				"smlOutput": {
					"attributes": {
						"name": "analog measurement value (raw data)"
					},
					"sweDataRecord": [
						{"sweField": {
							"attributes": {
								"name": "PM1"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/airbox_pm1"
								},
								"sweLabel": "PM1",
								"sweUom": {
									"attributes": {
										"name": "watt?"
									}
								}
							}
						}},
						]
				}
			}
		};


	localObjects['sensorPm1Id'] = localObject;  //PM1 sensor Id
	localObjects['sensorPm1Id'].objectType  	= 'smlPhysicalComponent';
	localObjects['sensorPm1Id'].objectId		= 'sensorPm1Id';


//==========================  end of sensorIdPm1



	var localObject = {};  // Human Sensor



	localObject.smlIdentification	= openIodSosSensorMl.initSmlIdentification({uniqueID:'??', longName:'??', shortName:'??'});

	localObject.smlCapabilitiesOfferings	= openIodSosSensorMl.initSmlCapabilitiesOfferings({name:"??", url:"??"});

	localObject.smlCapabilitiesFeaturesOfInterest	= openIodSosSensorMl.initSmlCapabilitiesFeaturesOfInterest({url:"??"});

	localObject.smlInputs	=
		{
			"smlInputList": {
				"smlInput": {
					"attributes": {
						"name": "human sensor input"
					}
					,"sweObservableProperty": {
//						"attributes": {
//							"definition": "http://wiki.aireas.com/index.php/airbox_pm1"
//						}
					}
				}
			}

		};

	localObject.smlOutputs	=
		{
			"smlOutputList": {
				"smlOutput": {
					"attributes": {
						"name": "measurement"
					},
					"sweDataRecord": [
						{"sweField": {
							"attributes": {
								"name": "lat"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/Human_Sensor_geolocation"
								},
							//	"sweLabel": "Ozone",
								"sweUom": {
									"attributes": {
										"code": "lat"
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "lng"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/Human_Sensor_geolocation"
								},
							//	"sweLabel": "Ozone",
								"sweUom": {
									"attributes": {
										"code": "lng"
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "airquality"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/Human_Sensor_airquality"
								},
							//	"sweLabel": "Ozone",
								"sweUom": {
									"attributes": {
										"code": ""
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "noicestress"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/Human_Sensor_noicestress"
								},
							//	"sweLabel": "PM1",
								"sweUom": {
									"attributes": {
										"code": ""
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "trafficstress"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/Human_Sensor_trafficstress"
								},
							//	"sweLabel": "PM2.5",
								"sweUom": {
									"attributes": {
										"code": ""
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "odorstress"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/Human_Sensor_odorstress"
								},
							//	"sweLabel": "PM10",
								"sweUom": {
									"attributes": {
										"code": ""
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "shinyei"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/Human_Sensor_shinyei"
								},
							//	"sweLabel": "PM2.5",
								"sweUom": {
									"attributes": {
										"code": ""
									}
								}
							}
						}},
						{"sweField": {
							"attributes": {
								"name": "dylos"
							},
							"sweQuantity": {
								"attributes": {
									"definition": "http://wiki.aireas.com/index.php/Human_Sensor_dylos"
								},
							//	"sweLabel": "PM10",
								"sweUom": {
									"attributes": {
										"code": ""
									}
								}
							}
						}}
						]
				}
			}
		};

	var localProcedure = {};
	localProcedure.smlSensorMl = {};
	localProcedure.smlSensorMl.attributes = {};
	localProcedure.smlSensorMl.attributes.version = "1.0.1";
	localProcedure.smlSensorMl.smlMember = {};
	localProcedure.smlSensorMl.smlMember.smlSystem = {};
	localProcedure.smlSensorMl.smlMember.smlSystem = localObject;

	var localObservableProperties = [
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_gpslat"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_gpslng"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_ozone"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_pm1"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_pm25"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_pm10"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_ufp"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_no2"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_rhum"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_rhumext"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_temp"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_tempext"}
		];

/*
	var localObservationTypes = [
		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" }
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" }, //OM_GeometryObservation
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CountObservation" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" }
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CountObservation" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_TextObservation" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_TruthObservation" },
//		{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_SWEArrayObservation" }
	];
*/

	var localObservationTypes = [
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_GeometryObservation" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_GeometryObservation" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CountObservation" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" }
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation" },
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CountObservation" },
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_TextObservation" },
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_TruthObservation" },
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_SWEArrayObservation" }
		];



	//http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Observation

	localObjects['humansensor'] = {};
	localObjects['humansensor'].objectType  	= 'smlPhysicalSystem';
	localObjects['humansensor'].objectId		= 'humansensor';
	localObjects['humansensor'].procedure = localProcedure;
	localObjects['humansensor'].observableProperties = openIodSosSensorMl.initObservableProperties(localObservableProperties);
	localObjects['humansensor'].metadata = {};
	localObjects['humansensor'].metadata.sosSosInsertionMetadata = openIodSosSensorMl.initObservationTypes(localObservationTypes);



//==========================  end of Human Sensor







};




module.exports = {

//	init: function (name, param) {
	init: function (req, res, query, param, openIoDConfig) {
		var self=this;

		self.openIoDConfig	= openIoDConfig;

		console.log('initObjects');
		initObjects();


		console.log('Module ' + 'transform_observation.js' + ' init()');
		this.getData(req, res, query, param, self);


	},  // end of init





	getData: function(req, res, query, param, self) {

		var _param = param;
		_param.query 	= query;

		// defaults
		_param.srsName 		= 'urn:ogc:def:crs:EPSG::4326';
		_param.boundingBox	= {lowerCorner: {lat:123,lng:456}, upperCorner: {lat:125,lng:458} };


		//console.log(_param);

		//var inputformat = query.inputformat?query.inputformat:'test';

		var resultOutput;
		if (query.action == null && query.inputformat == null) {
			errorResult(res, errorMessages.NOINPUTFORMAT);
			return;
		};


		if (query.inputformat == 'projectEhvAirport' && (query.objectid == 'areas' || query.objectid == 'geoLocationArea'|| query.objectid == 'nearestAirboxes'|| query.objectid == 'projectAirportData') ) {
			_param.objectId = query.objectid;
			if (query.objectid == 'geoLocationArea') {
				_param.lat = query.lat;
				_param.lng = query.lng;
			}

			if (query.objectid == 'nearestAirboxes') {
				_param.bu_code = query.bu_code;

				openIodConnector_ILM.getCbsBuurtNearestAirboxes(_param, function(result, error ) {

					var resultOutput=[];

					//console.log(result);

					for (var i=0;i<	result.length;i++) {
						var _rec = {};
						_rec.geometry = JSON.parse(result[i].geojson);
						_rec.properties = {};
						_rec.properties.airbox = result[i].airbox;
						_rec.properties.airbox_location = result[i].airbox_location;
						_rec.properties.avg_distance = result[i].avg_distance;
						resultOutput.push(_rec);
					}
					res.contentType('application/json');
					res.send(JSON.stringify(resultOutput));
					return;
				});
				return;
			}

			if (query.objectid == 'projectAirportData') {

				openIodConnector_ILM.getProjectAirportData(_param, function(result, error ) {

					var resultOutput='';
					resultOutput	= '"foi";"date_UTC_ISO";"date";"sensorvalue";"description";"remarks";"observations";"lat";"lng";"z"\n';

					for (var i=0;i<	result.length;i++) {
						var resultRec	= result[i];
						var _rec = '';
						var d	= new Date(resultRec.date);
						var _dateTimeStr	= d.toLocaleString('nl-NL',{ hour12: false });
//						var _dateTimeStr	= d.toLocaleDateString('nl-NL');
						//var _dateTimeStr = d.getFullYear() + '-' + d.getMonth()+1 + '-' + d.getDate() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
						_rec	= resultRec.foi + ';' + resultRec.date + ';' + _dateTimeStr + ';' + resultRec.sensorvalue + ';' + resultRec.event + ';' + resultRec.remarks + ';' + resultRec.observations + ';' + resultRec.lat + ';' + resultRec.lng + ';' + resultRec.z +'\n';
						resultOutput	+= _rec;
					}
					res.contentType('text/plain;charset=utf-8');
					res.setHeader('Content-disposition', 'attachment; filename=airportdata.csv');


					res.send(resultOutput);
					return;

					//console.log(result);
/*
					var resultOutput=[];

					for (var i=0;i<	result.length;i++) {
						var _rec = {};
						_rec.geometry = JSON.parse(result[i].geojson);
						_rec.properties = {};
						_rec.properties.airbox = result[i].airbox;
						_rec.properties.airbox_location = result[i].airbox_location;
						_rec.properties.avg_distance = result[i].avg_distance;
						resultOutput.push(_rec);
					}
					res.contentType('application/json');
					res.send(JSON.stringify(resultOutput));
					return;
*/
				});
				return;
			}



			if (query.neighborhood != undefined) {
				_param.neighborhood	= query.neighborhood;
			}

			if (query.objectid == 'areas' && query.neighborhood == '24h') {
				// get latest 24h observations from mongodb
				openIodHumanSensorMd.getHumanSensorResult24h(_param, function(result) {
					console.log(result);

					var _featureOfInterests = result.featureOfInterests;
					var neighborhoodData 	= {};
					var neighborhoods 		= '';
					var separator 			= '';
					for (var foi in _featureOfInterests) {
						var _featureOfInterest = _featureOfInterests[foi];
						console.log(foi);
						console.log(_featureOfInterest);
						var neighborhood	= foi.substring(foi.indexOf('_')+1);
						neighborhoods	+= separator + "'"+ neighborhood + "'" ;

						var observations	= {};
						for (var op in _featureOfInterest) {
							var _observedProperty	= op.substring(op.indexOf('_')+1);
							var _categories			= _featureOfInterest[op];
							var totalObservations	= 0;
							for (var category in _categories) {
								totalObservations	+= _categories[category];
							}
							var _newCategories	= {};
							for (var category in _categories) {
//								console.log(totalObservations + ' ' + _categories[category] )
								_newCategories[category]	= Math.round( (_categories[category] / totalObservations)*100); // calculate percentage
							}

							observations[_observedProperty]	= _newCategories;
							//observations[_observedProperty].obs	= _featureOfInterest[op]; //{}; //
						}
						neighborhoodData[neighborhood] = observations; //_featureOfInterests[foi];
						separator		= ',';
					}
					console.log(neighborhoods);
					_param.neighborhood	= neighborhoods;

					if (neighborhoods=='') {
						res.contentType('application/json');
						res.send("{}");
						return;
					}

					openIodConnector_ILM.getCbsBuurtProjectEHVAirport(_param, function(result, error ) {

						var resultOutput=[];

						//console.log(result);

						for (var i=0;i<	result.length;i++) {
							var _rec = {};
							_rec.geometry = JSON.parse(result[i].geojson);
							_rec.properties = {};
							_rec.properties.gm_code = result[i].gm_code;
							_rec.properties.bu_code = result[i].bu_code;
							_rec.properties.gm_naam = result[i].gm_naam;
							_rec.properties.bu_naam = result[i].bu_naam;
							_rec.properties.observations= neighborhoodData[_rec.properties.bu_code];
							_rec.type='Feature';
							resultOutput.push(_rec);
						}
						res.contentType('application/json');
						res.send(JSON.stringify(resultOutput));
						return;
					});
					return;


					});
				return;

			} else {

				openIodConnector_ILM.getCbsBuurtProjectEHVAirport(_param, function(result, error ) {

					var resultOutput=[];

					//console.log(result);

					for (var i=0;i<	result.length;i++) {
						var _rec = {};
						_rec.geometry = JSON.parse(result[i].geojson);
						_rec.properties = {};
						_rec.properties.gm_code = result[i].gm_code;
						_rec.properties.bu_code = result[i].bu_code;
						_rec.properties.gm_naam = result[i].gm_naam;
						_rec.properties.bu_naam = result[i].bu_naam;
						_rec.type='Feature';
						resultOutput.push(_rec);
					}
					res.contentType('application/json');
					res.send(JSON.stringify(resultOutput));
					return;
				});
				return;
			}
		};



		if (query.inputformat == 'testsml' || query.inputformat == 'insertsensor' || query.inputformat == 'executeinsertsensor' || query.inputformat == 'insertom' || query.inputformat == 'executeinsertom' ) {
			if (query.objectid) param.objectId = query.objectid;

			if (localObjects[param.objectId] || param.objectId == 'all') {
				//param.object = localObjects[param.objectId];
			} else {
				resultOutput = '';
				errorResult(res, errorMessages.NOOBJECTID);
				console.log(param.objectId);
				console.log(localObjects);
				return;
			}
		};





		_param.query = query;

/*

<?xml version="1.0" encoding="UTF-8"?>
<sos:GetObservation
	service="SOS" version="2.0.0"
    xmlns:sos="http://www.opengis.net/sos/2.0"
    xmlns:fes="http://www.opengis.net/fes/2.0"
    xmlns:gml="http://www.opengis.net/gml/3.2"
    xmlns:swe="http://www.opengis.net/swe/2.0"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    xmlns:swes="http://www.opengis.net/swes/2.0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://www.opengis.net/sos/2.0 http://schemas.opengis.net/sos/2.0/sos.xsd">
    <!-- optional -->
	<swes:extension><swe:Boolean definition="MergeObservationsIntoDataArray"><swe:value>true</swe:value></swe:Boolean></swes:extension>

    <sos:procedure>http://wiki.aireas.com/index.php/humansensor_standard_procedure</sos:procedure>
    <sos:offering>http://wiki.aireas.com/index.php/humansensor_EHV_offering_initial</sos:offering>
 <!--   <sos:observedProperty>http://wiki.aireas.com/index.php/humansensor_airquality</sos:observedProperty> -->
    <sos:temporalFilter>
        <fes:During>
            <fes:ValueReference>phenomenonTime</fes:ValueReference>
            <gml:TimePeriod gml:id="tp_1">
                <gml:beginPosition>2016-04-24T22:15:15.000+01:00</gml:beginPosition>
                <gml:endPosition>2016-04-30T15:00:00.000+01:00</gml:endPosition>
            </gml:TimePeriod>
        </fes:During>
    </sos:temporalFilter>

<!--    <sos:responseFormat>http://www.opengis.net/om/2.0</sos:responseFormat>-->
</sos:GetObservation>


<?xml version="1.0" encoding="UTF-8"?>
<sos:GetObservation
	service="SOS" version="2.0.0"
	xmlns:om="http://www.opengis.net/om/2.0"
	xmlns:sos="http://www.opengis.net/sos/2.0"
	xmlns:gml="http://www.opengis.net/gml/3.2"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:xlink="http://www.w3.org/1999/xlink"
	xmlns:swe="http://www.opengis.net/swe/2.0"
	xmlns:sams="http://www.opengis.net/samplingSpatial/2.0"
	xmlns:sf="http://www.opengis.net/sampling/2.0"
	xsi:schemaLocation="http://www.opengis.net/sos/2.0 http://schemas.opengis.net/sos/2.0/sos.xsd          http://www.opengis.net/samplingSpatial/2.0 http://schemas.opengis.net/samplingSpatial/2.0/spatialSamplingFeature.xsd">
	<swes:extension>
		<swe:Boolean definition="MergeObservationsIntoDataArray">
			<swe:value>true</swe:value>
		</swe:Boolean>
	</swes:extension>

	<sosTemporalFilter><fesDuring><fesValueReference>phenomenonTime</fesValueReference><gml:TimePeriod gml:id="tp_1"><gml:beginPosition>2016-04-20T22:15:15.000+01:00</gml:beginPosition><gml:endPosition>2016-04-30T22:15:15.000+01:00</gml:endPosition></gml:TimePeriod></fesDuring></sosTemporalFilter>
	<sos:offering>http://wiki.aireas.com/index.php/humansensor_undefined_offering_initial</sos:offering>
	<sos:procedure>http://wiki.aireas.com/index.php/humansensor_standard_procedure</sos:procedure>
	</sos:GetObservation>




*/


		if (query.inputformat == 'getobservation' && query.objectid == 'humansensor') {

			if (query.project == undefined) query.project= 'EHVAirport' ;
			if (query.region == undefined) 	query.region= 'EHV' ;


			var _currentDateTime		= new Date();
			var _currentDateTimeMin24H	= new Date(_currentDateTime.getTime()-86400000);
			var beginDateTime	= _currentDateTimeMin24H.toISOString(); 	//	'2016-04-01T00:00:00+01:00';
			var endDateTime		= _currentDateTime.toISOString();  			//	'2016-08-31T00:00:00+01:00';

/*
			var requestBody	= {"request": "GetResult", "service": "SOS", "version": "2.0.0"};
			requestBody.offering					= 'http://wiki.aireas.com/index.php/humansensor_EHV_offering_initial';
			requestBody.observedProperty			= 'http://wiki.aireas.com/index.php/humansensor_airquality';
			requestBody.temporalFilter				= [];
			requestBody.temporalFilter[0]			= {};
			requestBody.temporalFilter[0].during	= {};
			requestBody.temporalFilter[0].during.ref	= "om:phenomenonTime";
			requestBody.temporalFilter[0].during.value	= [beginDateTime, endDateTime];
*/

			// init transaction
			var transaction = {};
			transaction.transaction = {};
			transaction.transaction.attributes = {
				 "service": "SOS"
				, "version": "2.0.0"
			};


			// init O&M variables
			var _offeringName 			= 'humansensor_' + query.region + '_offering_initial';
			var _offeringIdentifier		= 'http://wiki.aireas.com/index.php/' + _offeringName;

			var _procedureIdentifier	= 'http://wiki.aireas.com/index.php/humansensor_standard_procedure';
			var swesExtension						= {};
			swesExtension.sweBoolean				= {};
			swesExtension.sweBoolean.attributes		= {};
			swesExtension.sweBoolean.attributes.definition	= "MergeObservationsIntoDataArray";
			swesExtension.sweBoolean.sweValue		= 'true';
			transaction.transaction.swesExtension	= swesExtension;

			// init SOS sections
			transaction.transaction.sosProcedure 	= _procedureIdentifier;
			transaction.transaction.sosOffering 	= _offeringIdentifier;

		    var sosTemporalFilter			= {};
			sosTemporalFilter.fesDuring		= {};
			sosTemporalFilter.fesDuring.fesValueReference				= 'phenomenonTime';
			sosTemporalFilter.fesDuring.gmlTimePeriod					= {};
			sosTemporalFilter.fesDuring.gmlTimePeriod.attributes		= {};
			sosTemporalFilter.fesDuring.gmlTimePeriod.attributes.gmlId	= 'tp_1';
			sosTemporalFilter.fesDuring.gmlTimePeriod.gmlBeginPosition	= beginDateTime;
			sosTemporalFilter.fesDuring.gmlTimePeriod.gmlEndPosition	= endDateTime;
			transaction.transaction.sosTemporalFilter	= sosTemporalFilter;



			// add O&M namespace atrributes
			transaction.transaction.attributes = openIodSosOm.setOmNameSpaces(transaction.transaction.attributes);

			xmlDocument = '<?xml version="1.0" encoding="UTF-8"?>' + openIodXmlBuilder.buildXml({"sosGetObservation":transaction.transaction}, transaction.transaction);

//			if (query.inputformat == 'executeinsertom') {
//				self.testExecuteInsertObservation(req, res, query, _param, self, xmlDocument);
//			}


			var inpMethod 	= 'POST';
			var contentType = 'application/xml';

		    var options = {
				host:'https://openiod.org',
				uri: 'https://openiod.org/52n-sos-webapp/service',
	        	method: inpMethod,
	        	headers: {
    	      		'Content-Type': contentType,
					'Accept':'application/xml',
					//'Accept':'application/json',
		      		//    'Content-Type' : 'multipart/form-data; boundary=' + boundary,
					'Content-Length' : Buffer.byteLength(xmlDocument)
        		},
        		body: xmlDocument
    		}

			console.log('start request');
//			res.send(xmlDocument);

    		request.post(options,
      			//body: JSON.stringify(resultBody)
				function(error, response, body) {
					var resultText;
					if (error) {
						res.statusCode="500";
						res.send(error);
					} else {
						//console.log("Body:"+response.body+":Body en statusCode: " + response.statusCode);
						//console.log('response.status: ', response.status);
						if (response.status != undefined) {
							if (response.status.code == "500") {
								console.log('\nError: '+ response.status.code)
								res.statusCode="500";
								res.send('{ "name": "' + encodeURIComponent(response.status.name) + '", ' +
									'"description": "' + encodeURIComponent(response.status.description) + '", ' +
									'"message": "' + encodeURIComponent(response.message) + '" }');
							} else {
								console.log('\nError: '+ response.status.code)
								//res.statusCode = responseJson.status.code;
								res.send(response.body); // res.send(JSON.stringify(response.body));
							}
						} else {
							//        console.log('\nSend with headers: '+ JSON.stringify(res.headers));
							//res.setEncoding('utf8');
							//res.setContentType('application/json');
							//res.contentType="application/json";
							res.contentType('application/xml;charset=utf-8');
							res.send(response.body); // res.send(JSON.stringify(response.body));
						}



/* xml response */

/* json response
					var responseJson = JSON.parse(response.body);
					if (responseJson.status != undefined) {
						if (responseJson.status.code == "500") {
							console.log('\nError: '+ responseJson.status.code)
							res.statusCode="500";
							res.send('{ "name": "' + encodeURIComponent(responseJson.status.name) + '", ' +
								'"description": "' + encodeURIComponent(responseJson.status.description) + '", ' +
								'"message": "' + encodeURIComponent(responseJson.message) + '" }');
						} else {
							console.log('\nError: '+ responseJson.status.code)
							//res.statusCode = responseJson.status.code;
							res.send(response.body); // res.send(JSON.stringify(response.body));
						}
					} else {
				//        console.log('\nSend with headers: '+ JSON.stringify(res.headers));
				//res.setEncoding('utf8');
				//res.setContentType('application/json');
				//res.contentType="application/json";
						res.contentType('application/json;charset=utf-8');
						res.send(response.body); // res.send(JSON.stringify(response.body));
					}
*/
					}

					//res.send(response.body);

					var d = new Date();
					console.log('\n\n%d-%d-%d/%d:%d:%d.%d End of POST. callback  ==============================================\n\n',d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds());

				}
			);



			//res.send('Verwerking gestart');

			return;
		}



		if (query.action == 'getobservation' && query.sensorsystem != undefined && query.offering != undefined ) {

//		http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=getobservation&sensorsystem=scapeler_dylos&offering=offering_0439_initial&foi=scapeler_dylos_SCRP0000000098e6a65d
//		http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=getobservation&sensorsystem=scapeler_dylos&offering=offering_0439_initial&foi=scapeler_dylos_SCRP000000004123e145,scapeler_dylos_SCRP0000000098e6a65d
// period:
// date_start=2016-04-01T00:00:00+01:00&date_end=2016-04-07T00:00:00+01:00
// op=observed property, comma separated (todo)
// op=apri-sensor-pmsa003-concPM2_5_CF1
// offering=offering_0439_initial
// foi=apri-sensor-pmsa003_SCRP00000000b7710419
			var offeringFile='';
			var offeringConfig;
			var procedureFile;
			var procedureConfig;
			try {
				offeringFile		= fs.readFileSync(this.openIoDConfig.getConfigLocalPath() + "openiod-sensors/sensor_system/" + query.sensorsystem + "/" + query.offering + ".json");
				offeringConfig	= JSON.parse(offeringFile);
				// for now only one procedure possible!
				//for (var i=0; i<offeringConfig.procedure.length;i++) {
				procedureFile		= fs.readFileSync(this.openIoDConfig.getConfigLocalPath() + "openiod-sensors/sensor_system/" + query.sensorsystem + "/" + offeringConfig.procedure[0].id + ".json");
				procedureConfig	= JSON.parse(procedureFile);
				//}
			}
			catch(err) {
				errorResult(res, errorMessages.NOOFFERING);
				console.log(errorMessages.NOOFFERING.message);
				return;
			}
			if (offeringFile='') {
				return;
			}



			var _periodeBeginDateTime, _periodeEndDateTime, beginDateTime, endDateTime;


			if (query.date_start == '1d') {
				_periodeEndDateTime	= new Date();
				_periodeBeginDateTime	= new Date(_periodeEndDateTime.getTime()-(86400000*1));
				beginDateTime			= _periodeBeginDateTime.toISOString(); 		//	'2018-02-04T00:00:00+01:00';
				endDateTime				= _periodeEndDateTime.toISOString();  		//	'2018-04-07T00:00:00+01:00';
			} else {
				if (query.date_start == '3d') {
					_periodeEndDateTime	= new Date();
					_periodeBeginDateTime	= new Date(_periodeEndDateTime.getTime()-(86400000*3));
					beginDateTime			= _periodeBeginDateTime.toISOString(); 		//	'2018-02-04T00:00:00+01:00';
					endDateTime				= _periodeEndDateTime.toISOString();  		//	'2018-04-07T00:00:00+01:00';
				} else {
					if (query.date_start != undefined && query.date_end != undefined) {
						_periodeBeginDateTime	= new Date(query.date_start.replace(/ /i, '+'));
						_periodeEndDateTime	= new Date(query.date_end.replace(/ /i, '+'));
						beginDateTime			= _periodeBeginDateTime.toISOString(); 		//	'2018-02-04T00:00:00+01:00';
						endDateTime				= _periodeEndDateTime.toISOString();  		//	'2018-04-07T00:00:00+01:00';
					} else {
						_periodeEndDateTime		= new Date();
						_periodeBeginDateTime	= new Date(_periodeEndDateTime.getTime()-(43200000));  // default naar 12 uur ivm systeembelasting
						beginDateTime			= _periodeBeginDateTime.toISOString(); 		//	'2016-04-01T00:00:00+01:00';
						endDateTime				= _periodeEndDateTime.toISOString();  		//	'2016-08-31T00:00:00+01:00';
					}
				}
			}
			//console.log(query.date_start);
			//console.log(query.date_end);
			//console.log(beginDateTime);
			//console.log(endDateTime);
			//console.log(beginDateTime);
			//console.log(endDateTime);

			if (query.timeSeries) {

				var timeSeriesStep = 60000; // time series default per minute
				if (query.timeSeries == 'H') {  // time series per hour
					timeSeriesStep = 3600000;
				}
				if (query.timeSeries == 'D') {  // time series per day
					timeSeriesStep = 86400000;
				}
				if (query.timeSeries == '5m') {  // time series per 5 minutes
					timeSeriesStep = 300000;
				}

				var timeSeriesBeginZero = new Date(_periodeBeginDateTime.getFullYear(),_periodeBeginDateTime.getMonth()
					,_periodeBeginDateTime.getDate(),_periodeBeginDateTime.getHours(),_periodeBeginDateTime.getMinutes());
				var timeSeriesEndZero = new Date(_periodeEndDateTime.getFullYear(),_periodeEndDateTime.getMonth()
						,_periodeEndDateTime.getDate(),_periodeEndDateTime.getHours(),_periodeEndDateTime.getMinutes());

				if (query.timeSeries == 'H') {  // time series per hour
					timeSeriesBeginZero = new Date(_periodeBeginDateTime.getFullYear(),_periodeBeginDateTime.getMonth()
						,_periodeBeginDateTime.getDate(),_periodeBeginDateTime.getHours());
					timeSeriesEndZero = new Date(_periodeEndDateTime.getFullYear(),_periodeEndDateTime.getMonth()
							,_periodeEndDateTime.getDate(),_periodeEndDateTime.getHours());
				}
				if (query.timeSeries == 'D') {  // time series per day
					timeSeriesBeginZero = new Date(_periodeBeginDateTime.getFullYear(),_periodeBeginDateTime.getMonth()
						,_periodeBeginDateTime.getDate());
					timeSeriesEndZero = new Date(_periodeEndDateTime.getFullYear(),_periodeEndDateTime.getMonth()
							,_periodeEndDateTime.getDate());
				}
				if (query.timeSeries == '5m') {  // time series per 5 minutes
					timeSeriesBeginZero = new Date(_periodeBeginDateTime.getFullYear(),_periodeBeginDateTime.getMonth()
						,_periodeBeginDateTime.getDate(),_periodeBeginDateTime.getHours(),_periodeBeginDateTime.getMinutes()-_periodeBeginDateTime.getMinutes()%5);
					timeSeriesEndZero = new Date(_periodeEndDateTime.getFullYear(),_periodeEndDateTime.getMonth()
							,_periodeEndDateTime.getDate(),_periodeEndDateTime.getHours(),_periodeEndDateTime.getMinutes()-_periodeEndDateTime.getMinutes()%5);
				}

				// reset begin and end of timeserie to complete blocks start and end of a timeserie
				timeSeriesBeginZero	= new Date(timeSeriesBeginZero.getTime()-timeSeriesStep+1); //	get measurement from within first (complete) time block
				timeSeriesEndZero 	= new Date(timeSeriesEndZero.getTime()+1);
				beginDateTime 			= timeSeriesBeginZero.toISOString();
				endDateTime					= timeSeriesEndZero.toISOString();  		//	do not get measurements after end last timeserie block
				console.log(beginDateTime);
				console.log(endDateTime);

			}



			// init transaction
			var transaction = {};
			transaction.transaction = {};
			transaction.transaction.attributes = {
				 "service": "SOS"
				, "version": "2.0.0"
			};

			// init O&M variables
			var _offeringName			= '';
			if (query.provider=='smartemission') {
				_offeringName			= offeringConfig.offering.id;
			} else {
				_offeringName			= offeringConfig.id + '_' + offeringConfig.region + '_offering_' + offeringConfig.offering.id;
			}
			var _offeringIdentifier		= procedureConfig.defaults.urlPrefix + _offeringName;
			var _procedureIdentifier	= procedureConfig.defaults.urlPrefix + procedureConfig.id;
			console.log('offering name: '+_offeringName);
			console.log('offering identifier: '+_offeringIdentifier);
			console.log('procedure identifier: '+_procedureIdentifier);

			var swesExtension						= {};
			swesExtension.sweBoolean				= {};
			swesExtension.sweBoolean.attributes		= {};
			swesExtension.sweBoolean.attributes.definition	= "MergeObservationsIntoDataArray";
			swesExtension.sweBoolean.sweValue		= 'true';
			transaction.transaction.swesExtension	= swesExtension;

			// init SOS sections
			transaction.transaction.sosProcedure 	= _procedureIdentifier;
			transaction.transaction.sosOffering 	= _offeringIdentifier;



		    if (query.op != undefined) {
				var ops	= query.op.split(',');
				var sosObservedProperties	= [];
				for (var i=0; i<ops.length;i++) {
					var sosObservedProperty	= {};
					sosObservedProperty.sosObservedProperty 	= procedureConfig.defaults.urlPrefix + ops[i];
					sosObservedProperties.push(sosObservedProperty);
				};
//				console.dir(sosFeatureOfInterests);
				transaction.transaction.sosObservedProperties	= sosObservedProperties;
				// <sos:observableProperty>http://wiki.aireas.com/index.php/scapeler_dylos_SCRP0000000098e6a65d</sos:observableProperty>
			}


/*
			if (query.latest == 'true') {
				transaction.transaction.sosEventTime					= {};
				transaction.transaction.sosEventTime.ogcTM_Equals		= {};
				transaction.transaction.sosEventTime.ogcTM_Equals.ogcPropertyName	= "om:samplingTime";
				transaction.transaction.sosEventTime.ogcTM_Equals.gmlTimeInstant	= {};
				transaction.transaction.sosEventTime.ogcTM_Equals.gmlTimeInstant.gmlTimePosition	= "latest";
			}
*/


		    var sosTemporalFilter			= {};
			sosTemporalFilter.fesDuring		= {};
			sosTemporalFilter.fesDuring.fesValueReference				= 'phenomenonTime';
			sosTemporalFilter.fesDuring.gmlTimePeriod					= {};
			sosTemporalFilter.fesDuring.gmlTimePeriod.attributes		= {};
			sosTemporalFilter.fesDuring.gmlTimePeriod.attributes.gmlId	= 'tp_1';
			sosTemporalFilter.fesDuring.gmlTimePeriod.gmlBeginPosition	= beginDateTime;
			sosTemporalFilter.fesDuring.gmlTimePeriod.gmlEndPosition	= endDateTime;
			transaction.transaction.sosTemporalFilter	= sosTemporalFilter;


		  if (query.foi != undefined) {
				var fois	= query.foi.split(',');
				var sosFeatureOfInterests	= [];
				for (var i=0; i<fois.length;i++) {
					var sosFeatureOfInterest	= {};
					sosFeatureOfInterest.sosFeatureOfInterest 	= procedureConfig.defaults.urlPrefix + fois[i];
					sosFeatureOfInterests.push(sosFeatureOfInterest);
				};
//			console.dir(sosFeatureOfInterests);
				transaction.transaction.sosFeatureOfInterests	= sosFeatureOfInterests;
				// <sos:featureOfInterest>http://wiki.aireas.com/index.php/scapeler_dylos_SCRP0000000098e6a65d</sos:featureOfInterest>
			}


			// add O&M namespace atrributes
			transaction.transaction.attributes = openIodSosOm.setOmNameSpaces(transaction.transaction.attributes);

			xmlDocument = '<?xml version="1.0" encoding="UTF-8"?>' + openIodXmlBuilder.buildXml({"sosGetObservation":transaction.transaction}, transaction.transaction);

//			console.log(xmlDocument);

			if (query.debug=='true') {
				res.contentType('application/xml;charset=utf-8');
				res.send(xmlDocument);
				return;
			}

			var inpMethod 	= 'POST';
			var contentType = 'application/xml';

		    var options = {
				host:'https://openiod.org',
				uri: 'https://openiod.org/52n-sos-webapp/service',
	        	method: inpMethod,
	        	headers: {
    	      		'Content-Type': contentType,
//					'Accept':'application/xml',
					'Accept':'application/json',
					//'Accept':'application/json',
		      		//    'Content-Type' : 'multipart/form-data; boundary=' + boundary,
					'Content-Length' : Buffer.byteLength(xmlDocument)
        		},
        		body: xmlDocument
    		}
			if (query.provider=='smartemission') {
				options.host	= 'http://data.smartemission.nl';
				options.uri		= 'http://data.smartemission.nl/sos52n/service';
			}
			if (query.format=='xml') options.headers.Accept	= 'application/xml';

			console.log('start request');
//			res.send(xmlDocument);


    		request.post(options,
      			//body: JSON.stringify(resultBody)
				function(error, response, body) {
					var resultText;
					if (error) {
						res.statusCode="500";
						console.log(error);
					} else {
						//console.log("Body:"+response.body+":Body en statusCode: " + response.statusCode);
						//console.log('response.status: ', response.status);
						if (response.status != undefined) {
							if (response.status.code == "500") {
								console.log('\nError: '+ response.status.code)
								res.statusCode="500";
								res.send('{ "name": "' + encodeURIComponent(response.status.name) + '", ' +
									'"description": "' + encodeURIComponent(response.status.description) + '", ' +
									'"message": "' + encodeURIComponent(response.message) + '" }');
							} else {
								console.log('\nError: '+ response.status.code)
								//res.statusCode = responseJson.status.code;
								res.send(response.body); // res.send(JSON.stringify(response.body));
							}
						} else {
							//        console.log('\nSend with headers: '+ JSON.stringify(res.headers));
							//res.setEncoding('utf8');
							//res.setContentType('application/json');
							//res.contentType="application/json";

							if (query.format!='xml') {
								res.contentType('application/json;charset=utf-8');

								var results				= [];
								var resultUniqueFields	= [];

								var csvFile = "";
								var csvRec = '';

								//console.log(response.body);

								if (query.format=='json' || query.format=='csv') {
									var docIn;
									try {
										docIn	= JSON.parse(response.body);
									}
									catch(err) {
										console.log('ERROR trying to parse JSON')
									}
									//console.dir(docIn);
									if (docIn.observations) {
										var timeSeriesLastValue = NaN;
									for (var i=0;i<docIn.observations.length;i++) {
										var _observation			= docIn.observations[i];
										//console.dir(_observation);
										var recordOut				= {};
										recordOut.procedure			= _observation.procedure;
										//console.log(_observation);
										if (_observation.offering.length>1) {
											recordOut.offering			= getPropertyEnd(_observation.offering[0]);
										} else recordOut.offering			= getPropertyEnd(_observation.offering);
										recordOut.observableProperty= getPropertyEnd(_observation.observableProperty);
										recordOut.featureOfInterest	= getPropertyEndFoi(_observation.featureOfInterest.identifier.value);
										if (_observation.result.fields == undefined) {
											// result.resultTime ; result.uom result.value;
											recordOut.resultFields	= [];
											var _fields			= { name: 'phenomenonTime',
		definition: 'http://www.opengis.net/def/property/OGC/0/PhenomenonTime',
		type: 'time',
		uom: 'http://www.opengis.net/def/uom/ISO-8601/0/Gregorian' };
												recordOut.resultFields.push(_fields);
												_fields 				= {};
												_fields.name 			= _observation.observableProperty;
												_fields.definition 		= _observation.observableProperty;
												//_fields.type 			= ??;
												_fields.uom 			= _observation.result.uom;
												recordOut.resultFields.push(_fields);

											recordOut.resultValues	= [];
											var _values 			= [_observation.resultTime,_observation.result.value];
											recordOut.resultValues.push(_values);
										} else {
											//console.log("Fields");
											//console.dir(_observation.result.fields);
											//console.log("Values");
											//console.dir(_observation.result.values);
											recordOut.resultFields		= _observation.result.fields;
											recordOut.resultValues		= _observation.result.values;
										}
										if (query.format=='csv') {
											csvRec	= 	'"'+getUrlEnd(recordOut.procedure)+'";"' +
												getUrlEnd(recordOut.offering)+'";"' +
												getUrlEnd(_observation.observableProperty)+'";"' +
												getUrlEnd(_observation.featureOfInterest.identifier.value)+'"';
									//		for (var j=0;j<recordOut.resultFields.length;j++) {
									//			csvRec+=';"'+recordOut.resultFields[j].name + '"';
									//			csvRec+=';"'+recordOut.resultFields[j].uom + '"';
									//			csvRec+=';"'+recordOut.resultFields[j].type + '"';
									//		};
											if (recordOut.resultValues != undefined) {
												var csvValuesRec	='';
												if (query.timeSeries) {
													console.log("Timeseries begin: "+ timeSeriesBeginZero);
													console.log("Timeseries   end: "+ timeSeriesEndZero);
													var _timeSerieDateTime = new Date(timeSeriesBeginZero.getTime()+timeSeriesStep);
													var recordIndex = 0;
													var recordDateTime = new Date(recordOut.resultValues[recordIndex][0]);

													// pre fase
													while(recordDateTime.getTime() > _timeSerieDateTime.getTime()) {
														csvValuesRec	= '';
														csvValuesRec	+= ';"'+new Date(_timeSerieDateTime.getTime()-1).toISOString()+ '"';
														csvValuesRec	+= ';'+"NaN" + '\n';
														csvFile 		+= csvRec + csvValuesRec;
														_timeSerieDateTime = new Date(_timeSerieDateTime.getTime()+timeSeriesStep);
													}

													// proces fase
													var measurementCounter = 0;
													var measurementValue = 0;
													while(recordIndex < recordOut.resultValues.length) {
														recordDateTime = new Date(recordOut.resultValues[recordIndex][0]);
														while (_timeSerieDateTime.getTime() < recordDateTime.getTime()) {
															if (measurementCounter>0) {
																csvValuesRec	= '';
																timeSeriesLastValue = Math.round(measurementValue / measurementCounter*1000)/1000;
																csvValuesRec	+= ';"'+new Date(_timeSerieDateTime.getTime()-1).toISOString()+ '"';
																csvValuesRec	+= ';'+ timeSeriesLastValue + '\n';
																csvFile 		+= csvRec + csvValuesRec;
																measurementCounter = 0;
																measurementValue = 0;
															} else {
																csvValuesRec	= '';
																csvValuesRec	+= ';"'+new Date(_timeSerieDateTime.getTime()-1).toISOString()+ '"';
																if (query.timeSeriesInterpolate == 'last') {
																	csvValuesRec	+= ';'+ timeSeriesLastValue + '\n';
																} else {
																	csvValuesRec	+= ';'+"NaN" + '\n';
																}
																csvFile 		+= csvRec + csvValuesRec;
															}
															_timeSerieDateTime = new Date(_timeSerieDateTime.getTime()+timeSeriesStep);
														}
														measurementCounter++;
														measurementValue += recordOut.resultValues[recordIndex][1];
														recordIndex++;
													}
													if (measurementCounter>0) {
														csvValuesRec	= '';
														timeSeriesLastValue = Math.round(measurementValue / measurementCounter*1000)/1000;
														csvValuesRec	+= ';"'+new Date(_timeSerieDateTime.getTime()-1).toISOString()+ '"';
														csvValuesRec	+= ';'+ timeSeriesLastValue + '\n';
														csvFile 		+= csvRec + csvValuesRec;
														measurementCounter = 0;
														measurementValue = 0;
														_timeSerieDateTime = new Date(_timeSerieDateTime.getTime()+timeSeriesStep);
													}

													// end fase
													while(_timeSerieDateTime.getTime() <= timeSeriesEndZero.getTime()) {
														csvValuesRec	= '';
														csvValuesRec	+= ';"'+new Date(_timeSerieDateTime.getTime()-1).toISOString()+ '"';
														csvValuesRec	+= ';'+"NaN" + '\n';
														csvFile 		+= csvRec + csvValuesRec;
														_timeSerieDateTime = new Date(_timeSerieDateTime.getTime()+timeSeriesStep);
													}


												} else {
													for (var j=0;j<recordOut.resultValues.length;j++) {
														csvValuesRec	= '';
														csvValuesRec	+= ';"'+recordOut.resultValues[j][0] + '"';
														csvValuesRec	+= ';'+recordOut.resultValues[j][1] + '\n';
														csvFile 		+= csvRec + csvValuesRec;
													};
												}
											}
										}
										results.push(recordOut);
									}
								}
								}

								if (query.format=='csv') {
									res.contentType('text/plain; charset=UTF-8');
									res.send(csvFile);
									var d = new Date();
									console.log('\n\n%d-%d-%d/%d:%d:%d.%d End of POST (csv). callback  ==============================================\n\n',d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds());
									return;
								}


								if (query.format=='json') {
									res.contentType('text/plain; charset=UTF-8');
									res.send(results);
									var d = new Date();
									console.log('\n\n%d-%d-%d/%d:%d:%d.%d End of POST (json). callback  ==============================================\n\n',d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds());
									return;
								}

							} else {
								res.contentType('application/xml;charset=utf-8');
							}

							res.send(response.body); // res.send(JSON.stringify(response.body));
						}



/* xml response */

/* json response
					var responseJson = JSON.parse(response.body);
					if (responseJson.status != undefined) {
						if (responseJson.status.code == "500") {
							console.log('\nError: '+ responseJson.status.code)
							res.statusCode="500";
							res.send('{ "name": "' + encodeURIComponent(responseJson.status.name) + '", ' +
								'"description": "' + encodeURIComponent(responseJson.status.description) + '", ' +
								'"message": "' + encodeURIComponent(responseJson.message) + '" }');
						} else {
							console.log('\nError: '+ responseJson.status.code)
							//res.statusCode = responseJson.status.code;
							res.send(response.body); // res.send(JSON.stringify(response.body));
						}
					} else {
				//        console.log('\nSend with headers: '+ JSON.stringify(res.headers));
				//res.setEncoding('utf8');
				//res.setContentType('application/json');
				//res.contentType="application/json";
						res.contentType('application/json;charset=utf-8');
						res.send(response.body); // res.send(JSON.stringify(response.body));
					}
*/
					}

					//res.send(response.body);

					var d = new Date();
					console.log('\n\n%d-%d-%d/%d:%d:%d.%d End of POST. callback  ==============================================\n\n',d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds());

				}
			);



			//res.send('Verwerking gestart');

			return;
		}


		if ( query.action == 'getfoiconfig' ) {
			var foi 		= query.foi;
			var foiVersion 	= query.foiVersion;
			console.log("Foi config request from: %s v:%s", foi, foiVersion);

			var processSqlSelectResult = function(result,err) {
				console.log(result);
				//var _result = JSON.parse(result);
				if (result.length==0) {
					openIodConnector_ApriSensor.insertApriSensorConfig(foi, param, function(r) {
						console.log('New ApriSensor foi inserted for %s',foi);
					});
				}
				console.log('query result: ');
				var resultStr = JSON.stringify(result);

				console.log(resultStr);

				var getFoiConfigResult = resultStr + '\nOK\n' +foi +'\n'+foiVersion +'\n';

				switch (foi) {
					case 'SCWM68C63A80923C':
						getFoiConfigResult = getFoiConfigResult + 'PMSA003=true\n';
						//getFoiConfigResult = getFoiConfigResult + 'DISPLAY128x64=true\n';
						//getFoiConfigResult = getFoiConfigResult + 'BME280=true\n';
						break;
					case 'SCWM68C63A809385':
						getFoiConfigResult = getFoiConfigResult + 'PMSA003=true\n';
						getFoiConfigResult = getFoiConfigResult + 'DISPLAY128x64=true\n';
						getFoiConfigResult = getFoiConfigResult + 'DisplayPms=true\n';
						getFoiConfigResult = getFoiConfigResult + 'BME280=true\n';
						break;
					default:
        				getFoiConfigResult = getFoiConfigResult + 'PMSA003=true\n';
				}
/*				if (foi=='SCWM68C63A80923C') {
					getFoiConfigResult = getFoiConfigResult + 'PMSA003=false\n';
					getFoiConfigResult = getFoiConfigResult + 'BME280=false\n';
					getFoiConfigResult = getFoiConfigResult + 'BMP280=false\n';
					getFoiConfigResult = getFoiConfigResult + 'DISPLAY128x64=false\n';
					getFoiConfigResult = getFoiConfigResult + 'DisplayPms=false\n';
				} else {
					getFoiConfigResult = getFoiConfigResult + 'PMSA003=true\n';
					getFoiConfigResult = getFoiConfigResult + 'BME280=false\n';
					getFoiConfigResult = getFoiConfigResult + 'BMP280=false\n';
					getFoiConfigResult = getFoiConfigResult + 'DISPLAY128x64=false\n';
					getFoiConfigResult = getFoiConfigResult + 'DisplayPms=false\n';
				}
*/
				res.send(getFoiConfigResult);
			};

			openIodConnector_ApriSensor.getApriSensorConfig(foi, param, processSqlSelectResult);


			return;

		}


		// scapeler sensor insert observations
		// e.g.
//		http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertom&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&verbose=true&commit=true&observation=scapeler_shinyei:12.345&neighborhoodcode=BU04390402

		if ( query.action == 'insertom' && query.sensorsystem != undefined && query.offering != undefined ) {

			var xmlDocument;

			var offeringConfig	= {};
			var procedureConfig	= {};


			resultOutput = "";


			// keep offerings and procedures in memory after first readfile: sensorSystemConfigCache

			if (sensorSystemConfigCache[query.sensorsystem] == undefined) {
				sensorSystemConfigCache[query.sensorsystem] = {};
				sensorSystemConfigCache[query.sensorsystem].offering = {};
				sensorSystemConfigCache[query.sensorsystem].procedure = {};
			}
			var _sensorSystemConfigCacheSensorSystem = sensorSystemConfigCache[query.sensorsystem];
			var procedureId	= null;

			if (_sensorSystemConfigCacheSensorSystem.offering[query.offering] == undefined ) {

				var _offeringConfigFilePath = this.openIoDConfig.getConfigLocalPath() + "openiod-sensors/sensor_system/" + query.sensorsystem + "/" + query.offering + ".json";
				var offeringFile	= fs.readFileSync(_offeringConfigFilePath);
				offeringConfig	= JSON.parse(offeringFile);
				_sensorSystemConfigCacheSensorSystem.offering[query.offering] = offeringConfig;
				console.log("Sensor offering config file read into cache: %s", _offeringConfigFilePath);


				// for now only one procedure possible!
				//for (var i=0; i<offeringConfig.procedure.length;i++) {

				procedureId	= offeringConfig.procedure[0].id;

				var _procedureConfigFilePath = this.openIoDConfig.getConfigLocalPath() + "openiod-sensors/sensor_system/" + query.sensorsystem + "/" + procedureId + ".json";
				var procedureFile		= fs.readFileSync(_procedureConfigFilePath);
				procedureConfig		= JSON.parse(procedureFile);
				_sensorSystemConfigCacheSensorSystem.procedure[procedureId] = procedureConfig;
				//}
				console.log("Sensor procedure config file read into cache: %s", _procedureConfigFilePath);
			} else {
				procedureId	= _sensorSystemConfigCacheSensorSystem.offering[query.offering].procedure[0].id;
				console.log("Sensor procedure config file hit: %s", procedureId);
				offeringConfig	= _sensorSystemConfigCacheSensorSystem.offering[query.offering];
				procedureConfig	= _sensorSystemConfigCacheSensorSystem.procedure[procedureId];
			}


/* todo optional MongoDB collections ?
			if (query.project == undefined) query.project= '2016' ;
			if (query.region == undefined) 	query.region= '0439' ;


			// parameters for MongoDb transaction queue
			var mdOptions						= {};
			mdOptions.query						= {};
			mdOptions.query.project_code		= query.project;
			mdOptions.query.region_code			= query.region;
			mdOptions.query.city_code			= query.citycode;
			mdOptions.query.neighborhood_code	= query.neighborhoodcode;
			mdOptions.query.observation			= query.observation;

			openIodHumanSensorMd.insertHumanSensorTransActionQueue(mdOptions, function() {});
*/

			// init transaction
			var transaction = {};
			transaction.transaction = {};
			transaction.transaction.attributes = {
				 "service": "SOS"
				, "version": "2.0.0"
			};

			// init O&M variables
//			var _uniqueId				= new Date().getTime();
//			var _foiIdentifier			= procedureConfig.defaults.urlPrefix+ 'humansensor'+'_'+query.neighborhoodcode;
//			var _longName 				= 'human sensor ' + 'standard procedure';
//			var _shortName 				= 'humansensor_' + 'standard procedure';
//			var _name 					= 'humansensor'+'_'+query.neighborhoodcode;
//			var _offeringName 			= 'humansensor_' + query.region + '_offering_initial';
//			var _offeringUrl			= procedureConfig.defaults.urlPrefix + _offeringName;
//			var _procedureUniqueID 		= procedureConfig.defaults.urlPrefix+ 'humansensor_standard_procedure';
//			var _phenomenonTime			= new Date().toISOString();
//			var _resultTime				= _phenomenonTime;

			var _uniqueId							= new Date().getTime();
			var _procedureUniqueID 					= procedureConfig.defaults.urlPrefix + procedureConfig.id;
			var _featureofinterestCapabilitiesUrl	= procedureConfig.defaults.urlPrefix + offeringConfig.id;
			var _tmpFoi								= query.foi!=undefined?query.foi:query.neighborhoodcode;
			var _foiIdentifier						= procedureConfig.defaults.urlPrefix + offeringConfig.id +'_'+_tmpFoi; //query.neighborhoodcode;
			var _foiName 							= offeringConfig.id + '_' + _tmpFoi;
			var _name 								= offeringConfig.id + '_' + query.neighborhoodcode;
			var _longName 							= procedureConfig.name;
			var _shortName 							= procedureConfig.nameShort;
			var _offeringName 						= offeringConfig.id + '_' + offeringConfig.region + '_offering_' + offeringConfig.offering.id;
			var _offeringUrl						= procedureConfig.defaults.urlPrefix + _offeringName;

			var _phenomenonTime;
			var timeOffsetMillis = 0;

			if (query.timeOffsetMillis) {
				timeOffsetMillis = query.timeOffsetMillis;
				_phenomenonTime							= new Date(new Date().getTime()-timeOffsetMillis).toISOString();
			} else {
				_phenomenonTime						  = new Date().toISOString();
			}
			if (query.measurementTime) {
				_phenomenonTime = query.measurementTime;
			}
			var _resultTime							= _phenomenonTime;



			// example location airbox 37 Genovalaan / RIVM location
			var _lat					= 50; //query.lat;   	//51.4684249333333;
			var _lng					= 5.1; //query.lng;			//5.47211675;
			var _foi					= {};
			_foi.identifier				= _foiIdentifier;
			_foi.name					= _foiName;
			_foi.gmlName				= _foiName;
			_foi.lat					= _lat;
			_foi.lng					= _lng;

			var fiwareObject = {};
			fiwareObject.id=_tmpFoi+"_"+_resultTime;
			fiwareObject.sensorId=_tmpFoi;
			fiwareObject.type="AirQualityObserved";
			fiwareObject.sensorSystem=query.sensorsystem;
			fiwareObject.dateObserved=_resultTime;
//			fiwareObject.relativeHumidity=inRecord.s_humidity/1000;
//			fiwareObject.temperature	= milliKelvinToCelsius(inRecord.s_temperatureambient);
//			fiwareObject.CO2=inRecord.s_co2/1000;
//			fiwareObject.lightTop=inRecord.s_lightsensortop;
//			fiwareObject.pressure=inRecord.s_barometer/100;


			// init SOS sections
			transaction.transaction.sosOffering 	= _offeringUrl;
			transaction.transaction.sosObservations = [];

			var _inputObservation					= query.observation;
			var _categories							= _inputObservation.split(',');

			var phenomenonTimeXLinkHref;

			var fiwareMap	= {};
			fiwareMap['apri-sensor-pmsa003-concPM10_0_CF1']	= 'pm10';
			fiwareMap['apri-sensor-pmsa003-concPM2_5_CF1']	= 'pm25';
			fiwareMap['apri-sensor-pmsa003-concPM1_0_CF1']	= 'pm1';
			fiwareMap['apri-sensor-pmsa003-concPM10_0_amb']	= 'pm10amb';
			fiwareMap['apri-sensor-pmsa003-concPM2_5_amb']	= 'pm25amb';
			fiwareMap['apri-sensor-pmsa003-concPM1_0_amb']	= 'pm1amb';
			fiwareMap['apri-sensor-pmsa003-rawGt0_3um']	= 'raw03um';
			fiwareMap['apri-sensor-pmsa003-rawGt0_5um']	= 'raw05um';
			fiwareMap['apri-sensor-pmsa003-rawGt1_0um']	= 'raw1um';
			fiwareMap['apri-sensor-pmsa003-rawGt2_5um']	= 'raw25um';
			fiwareMap['apri-sensor-pmsa003-rawGt5_0um']	= 'raw5um';
			fiwareMap['apri-sensor-pmsa003-rawGt10_0um']	= 'raw10um';



			for (var i = 0;i<_categories.length;i++) {

				// init O&M
				var sosObservation			= {};
				var omOM_Observation 		= {};

				var _category				= _categories[i];
				var _categoryKeyValue		= _category.split(':');

				var _categoryId				= _categoryKeyValue[0];
				var _fiWareCategoryId	= _categoryKeyValue[0];
				var _categoryResult			= parseFloat(_categoryKeyValue[1]);

				// fiware attributes
				if (fiwareMap[_fiWareCategoryId]) {
					_fiWareCategoryId = fiwareMap[_fiWareCategoryId];
				}
				fiwareObject[_fiWareCategoryId] = _categoryResult;


				var _observedProperty 		= procedureConfig.defaults.urlPrefix+ _categoryId;
				var _result					= {};
				_result.value				= _categoryResult;
				_result.type				= "gml:ReferenceType"; //default

				var _gmlId					= 'obs_' + _uniqueId + '_' + i;
				var _gmlIdentifier			= procedureConfig.id + '_' + _gmlId;

				_foi.gmlId					= _gmlId;

				// init O&M sections

				omOM_Observation.attributes		 	= openIodSosOm.initAttributes(_gmlId);
				omOM_Observation.gmlDescription 	= openIodSosOm.initGmlDescription(_name);
				omOM_Observation.gmlIdentifier 		= openIodSosOm.initGmlIdentifier(_gmlIdentifier);

				//default value
				var _sosObservationType				= "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement";
				for (var ot=0;ot<procedureConfig.output.length;ot++) {
					if (procedureConfig.output[ot].id == _categoryId) {
						_sosObservationType	= procedureConfig.output[ot].sosObservationType;
						if (procedureConfig.output[ot].resultType != undefined) {
							_result.type		= procedureConfig.output[ot].resultType;
							_result.uom			= procedureConfig.output[ot].resultUom;
						}
						break;
					}
				}
				omOM_Observation.omType 			= openIodSosOm.initOmType(procedureConfig.output[0].sosObservationType);
				omOM_Observation.omPhenomenonTime 	= openIodSosOm.initOmPhenomenonTime(_phenomenonTime, phenomenonTimeXLinkHref );
				omOM_Observation.omResultTime 		= openIodSosOm.initOmResultTime(_resultTime);
				omOM_Observation.omProcedure 		= openIodSosOm.initOmProcedure(_procedureUniqueID);
				omOM_Observation.omObservedProperty = openIodSosOm.initOmObservedProperty(_observedProperty);
				omOM_Observation.omFeatureOfInterest= openIodSosOm.initFeatureOfInterest(_foi);
				omOM_Observation.omResult 			= openIodSosOm.initOmResult(_result);

				sosObservation.omOM_Observation		= omOM_Observation;
				transaction.transaction.sosObservations.push(sosObservation);

				if (i==0) {
					phenomenonTimeXLinkHref 		= '#phenomenonTime';
					_foi.xLinkHref					= '#ssf';
				}

			}


			// add O&M namespace atrributes
			transaction.transaction.attributes = openIodSosOm.setOmNameSpaces(transaction.transaction.attributes);

//			res.contentType('text/xml');
			xmlDocument = '<?xml version="1.0" encoding="UTF-8"?>' + openIodXmlBuilder.buildXml({"sosInsertObservation":transaction.transaction}, transaction.transaction);

			if (query.commit == 'true') {
				// fiwareObject ready to process
				self.processFiwareObject(fiwareObject);

				self.testExecuteInsertObservation(req, res, query, _param, self, xmlDocument);
			}

			if (query.verbose == 'true' && query.commit != 'true') {
				res.contentType('application/xml;charset=utf-8');
				res.send(xmlDocument);
			} else {
				res.send('Transaction commited. Use param &commit=false&verbose=true to return xml document');
			}

			console.log ('Transaction ready');

			return;

		}




		// human sensor insert observations
		if ( (query.inputformat == 'insertom' || query.inputformat == 'executeinsertom') && query.objectid == 'humansensor') {

			var xmlDocument;

			resultOutput = "";

			if (query.project == undefined) query.project= 'EHVAirport' ;
			if (query.region == undefined) 	query.region= 'EHV' ;

			// parameters for MongoDb transaction queue
			var mdOptions						= {};
			mdOptions.query						= {};
			mdOptions.query.project_code		= query.project;
			mdOptions.query.region_code			= query.region;
			mdOptions.query.city_code			= query.citycode;
			mdOptions.query.neighborhood_code	= query.neighborhoodcode;
			mdOptions.query.observation			= query.observation;

			openIodHumanSensorMd.insertHumanSensorTransActionQueue(mdOptions, function() {});


			// init transaction
			var transaction = {};
			transaction.transaction = {};
			transaction.transaction.attributes = {
				 "service": "SOS"
				, "version": "2.0.0"
			};


			// init O&M variables

			var _uniqueId				= new Date().getTime();
			var _foiIdentifier			= 'http://wiki.aireas.com/index.php/humansensor'+'_'+query.neighborhoodcode;
			var _longName 				= 'human sensor ' + 'standard procedure';
			var _shortName 				= 'humansensor_' + 'standard procedure';
			var _name 					= 'humansensor'+'_'+query.neighborhoodcode;
			var _offeringName 			= 'humansensor_' + query.region + '_offering_initial';
			var _offeringUrl			= 'http://wiki.aireas.com/index.php/' + _offeringName;

			var _procedureUniqueID 		= 'http://wiki.aireas.com/index.php/humansensor_standard_procedure';
			var _phenomenonTime			= new Date().toISOString();
			var _resultTime				= _phenomenonTime;


			// example location airbox 37 Genovalaan / RIVM location
			var _lat					= 50; //query.lat;   	//51.4684249333333;
			var _lng					= 5.1; //query.lng;			//5.47211675;
			var _foi					= {};
			_foi.identifier				= _foiIdentifier;
			_foi.name					= _name;
			_foi.gmlName				= _name;
			_foi.lat					= _lat;
			_foi.lng					= _lng;


			// init SOS sections
			transaction.transaction.sosOffering 	= _offeringUrl;
			transaction.transaction.sosObservations 	= [];

			var _inputObservation		= query.observation;
			var _categories				= _inputObservation.split(',');

			/* multiple observation example
			    <sos:observation>
        <om:OM_Observation gml:id="o2">
            <om:type xlink:href="http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CountObservation"/>
            <om:phenomenonTime xlink:href="#phenomenonTime"/>
            <om:resultTime xlink:href="#phenomenonTime"/>
            <om:procedure xlink:href="http://www.52north.org/test/procedure/9"/>
            <om:observedProperty xlink:href="http://www.52north.org/test/observableProperty/9_2"/>
            <om:featureOfInterest xlink:href="#ssf_test_feature"/>
            <om:result xsi:type="xs:integer">4</om:result>
        </om:OM_Observation>
    </sos:observation>
    <sos:observation>
        <om:OM_Observation gml:id="o3">
            <om:type xlink:href="http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement"/>
            <om:phenomenonTime xlink:href="#phenomenonTime"/>
            <om:resultTime xlink:href="#phenomenonTime"/>
            <om:procedure xlink:href="http://www.52north.org/test/procedure/9"/>
            <om:observedProperty xlink:href="http://www.52north.org/test/observableProperty/9_3"/>
            <om:featureOfInterest xlink:href="#ssf_test_feature"/>
            <om:result xsi:type="gml:MeasureType" uom="test_unit_9_3">0.29</om:result>
        </om:OM_Observation>
    </sos:observation>

			*/

			var phenomenonTimeXLinkHref;

			for (var i = 0;i<_categories.length;i++) {

				// init O&M
				var sosObservation		= {};
				var omOM_Observation 	= {};

				var _category				= _categories[i];
				var _categoryKeyValue		= _category.split(':');

				var _categoryId				= _categoryKeyValue[0];
				var _categoryResult			= _categoryKeyValue[1];


				var _observedProperty 		= "http://wiki.aireas.com/index.php/humansensor_" + _categoryId;
				var _result					= {};
				_result.value				= _categoryResult;
				_result.type				= "gml:ReferenceType";

				var _gmlId					= 'obs_' + _uniqueId + '_' + i;
				var _gmlIdentifier			= 'humansensor_standard_procedure' + '_' + _gmlId;

				_foi.gmlId					= _gmlId;

				// init O&M sections

				omOM_Observation.attributes		 	= openIodSosOm.initAttributes(_gmlId);
				omOM_Observation.gmlDescription 	= openIodSosOm.initGmlDescription('Human sensor observation');
				omOM_Observation.gmlIdentifier 		= openIodSosOm.initGmlIdentifier(_gmlIdentifier);
				omOM_Observation.omType 			= openIodSosOm.initOmType("http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation");
				omOM_Observation.omPhenomenonTime 	= openIodSosOm.initOmPhenomenonTime(_phenomenonTime, phenomenonTimeXLinkHref );
				omOM_Observation.omResultTime 		= openIodSosOm.initOmResultTime(_resultTime);
				omOM_Observation.omProcedure 		= openIodSosOm.initOmProcedure(_procedureUniqueID);
				omOM_Observation.omObservedProperty = openIodSosOm.initOmObservedProperty(_observedProperty);
				omOM_Observation.omFeatureOfInterest= openIodSosOm.initFeatureOfInterest(_foi);
				omOM_Observation.omResult 			= openIodSosOm.initOmResult(_result);


				sosObservation.omOM_Observation		= omOM_Observation
				transaction.transaction.sosObservations.push(sosObservation);

				if (i==0) {
					phenomenonTimeXLinkHref 		= '#phenomenonTime';
					_foi.xLinkHref					= '#ssf';
				}

			}



			// add O&M namespace atrributes
			transaction.transaction.attributes = openIodSosOm.setOmNameSpaces(transaction.transaction.attributes);

			//for (var key in nsAttributes) {
			//	transaction.transaction.attributes[key] = nsAttributes[key];
			//}

//			root = {};
//			root.sosInsertObservation = transaction.transaction;

//			res.contentType('text/xml');
			xmlDocument = '<?xml version="1.0" encoding="UTF-8"?>' + openIodXmlBuilder.buildXml({"sosInsertObservation":transaction.transaction}, transaction.transaction);

			if (query.inputformat == 'executeinsertom') {
				self.testExecuteInsertObservation(req, res, query, _param, self, xmlDocument);
			}

			res.contentType('application/xml;charset=utf-8');
			res.send(xmlDocument);

			console.log ('Ready');

			return;

		}


		if (query.inputformat == 'insertom' && query.objectid != 'humansensor') {

			resultOutput = self.testInsertObservation(req, res, query, _param, self);


	 		//return(resultOutput);
			res.send(resultOutput);

			return;
		}



		if (query.inputformat == 'executeinsertom' && query.objectid != 'humansensor') {

//			resultOutput = self.testInsertObservation(req, res, query, _param, self);
//			console.log('==== Observation ==================================');
//			self.testExecuteInsertObservation(req, res, query, _param, self, resultOutput);

			_param.action = 'EcnHistoryYearAvg';

			console.log('1x');

			openIodConnector_ILM.getAireasEcnHistoryData('all', _param, function(result, error ) {
//			openIodConnector_ILM.getAireasEcnHistoryData('all', _param, function(error, data ) {
				//console.log("Result: " + result);
				var xmlDocument;
				resultOutput = "";

//				res.send('Transform observation is processing ' + result.length + ' observations.' );

//				for (var i=0;i<result.length;i++) {

console.log('error: ' + error);

//				if (data == undefined) return;
//				console.log('succes airbox: ' + data[0].airbox);


//				var result = [];
//				result[0]=data[0];

				console.log('herhaal? '+ result.length);

				//console.log('succes airbox in result[0]: ' + result);
				console.log('succes airbox in result[0]: ' + result[0].airbox);

				var i=0;

					//console.log('');

					// init transaction
					var transaction = {};
					transaction.transaction = {};
					transaction.transaction.attributes = {
						  "service": "SOS"
						, "version": "2.0.0"
					};

					// init O&M
				    var omOM_Observation = {};

					// init O&M variables
					var _prefixedAirbox;
					if (result[i].airbox.length>2) {
						_prefixedAirbox = '0'+result[i].airbox;
					} else {
						_prefixedAirbox	= result[i].airbox.length==2?'00'+result[i].airbox:'000'+result[i].airbox;
					}

					//	var _longName 		= 'airbox_' + _prefixedAirbox + ': ' + result[i].airbox_location;
					var _shortName 		= 'airbox_' + _prefixedAirbox;
					var _offeringName 	= 'airbox_' + result[i].region + '_offering_initial';
					var _offeringUrl	= 'http://wiki.aireas.com/index.php/' + _offeringName;
					var _foiIdentifier	= 'http://wiki.aireas.com/index.php/airbox_' + _prefixedAirbox;

					var _uniqueId		= new Date().getTime();
					var _gmlId			= 'obs_' + _uniqueId + '_' + i;
					var _procedureUniqueID 		= 'http://wiki.aireas.com/index.php/airbox_standard_procedure'; // + result[i].airbox;
					var _gmlIdentifier	= 'airbox_standard_procedure' + '_' + _gmlId;
//					var _phenomenonTime	= result[i].hist_year + '-01-01T00:00:00.000+01:00';
//					var _resultTime		= result[i].hist_year + '-01-01T00:00:00.000+01:00';
					var _phenomenonTime	= result[i].tick_date.toISOString();
					var _resultTime		= result[i].tick_date.toISOString();
					var _observedProperty = "http://wiki.aireas.com/index.php/airbox_pm1";
					var _lat			= result[i].lat;
					var _lng			= result[i].lng;
					var _foi			= {};
					_foi.identifier		= _foiIdentifier;
					_foi.gmlName		= _shortName;
					_foi.gmlId			= _gmlId;
					_foi.lat			= _lat;
					_foi.lng			= _lng;
					var _result			= {};
					_result.value		= result[i].pm1;
					_result.uom			= "ug/m3";


					// init O&M sections

					omOM_Observation.attributes		 	= openIodSosOm.initAttributes(_gmlId);
					omOM_Observation.gmlDescription 	= openIodSosOm.initGmlDescription('Test observation');
					omOM_Observation.gmlIdentifier 		= openIodSosOm.initGmlIdentifier(_gmlIdentifier);
					omOM_Observation.omType 			= openIodSosOm.initOmType("http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement");
					omOM_Observation.omPhenomenonTime 	= openIodSosOm.initOmPhenomenonTime(_phenomenonTime);
					omOM_Observation.omResultTime 		= openIodSosOm.initOmResultTime(_resultTime);
					omOM_Observation.omProcedure 		= openIodSosOm.initOmProcedure(_procedureUniqueID);
					omOM_Observation.omObservedProperty = openIodSosOm.initOmObservedProperty(_observedProperty);
					omOM_Observation.omFeatureOfInterest= openIodSosOm.initFeatureOfInterest(_foi);
					omOM_Observation.omResult 			= openIodSosOm.initOmResult(_result);


					// init SOS sections
					transaction.transaction.sosOffering 	= _offeringUrl;
					transaction.transaction.sosObservation 	= {};
					transaction.transaction.sosObservation.omOM_Observation	= omOM_Observation;

					// add O&M namespace atrributes
					transaction.transaction.attributes = openIodSosOm.setOmNameSpaces(transaction.transaction.attributes);

					//for (var key in nsAttributes) {
					//	transaction.transaction.attributes[key] = nsAttributes[key];
					//}

//					root = {};
//					root.sosInsertObservation = transaction.transaction;

//					res.contentType('text/xml');
					xmlDocument = '<?xml version="1.0" encoding="UTF-8"?>' + openIodXmlBuilder.buildXml({"sosInsertObservation":transaction.transaction}, transaction.transaction);

					self.testExecuteInsertObservation(req, res, query, _param, self, xmlDocument);
					//resultOutput = xmlDocument;

//				}

				console.log ('Ready');

				//res.send(xmlDocument);
				return;
			});
			return;

		}

		if (query.inputformat == 'testom') {
			self.testTransformObservation(req, res, query, _param, self);
			return;
		}


		if (query.inputformat == 'executeinsertsensor' && query.objectid != 'humansensor') {

			openIodConnector_ILM.getAirboxData('all', _param, function(result, error ) {
				//console.log("Result: " + result);

				resultOutput = "";

				for (var i=0;i<result.length;i++) {
					var localObject 	= {};

					var _prefixedAirbox;
					if (result[i].airbox.length>2) {
						_prefixedAirbox = '0'+result[i].airbox;
					} else {
						_prefixedAirbox	= result[i].airbox.length=2?'00'+result[i].airbox:'000'+result[i].airbox;
					}

					var _procedureUniqueID 		= 'http://wiki.aireas.com/index.php/airbox_standard_procedure'; // + result[i].airbox;
//					var _featureofinterestUrl	= 'http://wiki.aireas.com/index.php/airbox_' + _prefixedAirbox;
					var _featureofinterestUrl	= result[i].identifier;
					var _longName 		= 'airbox_' + 'standard procedure'; // + result[i].airbox + ': ' + result[i].airbox_location;
					var _shortName 		= 'airbox_' + 'standard procedure'; //result[i].airbox;
					var _offeringName 	= 'airbox_' + result[i].region + '_offering_initial';
					var _offeringUrl	= 'http://wiki.aireas.com/index.php/' + _offeringName;

					localObject.smlIdentification			= openIodSosSensorMl.initSmlIdentification({uniqueID:_procedureUniqueID, longName:_longName, shortName:_shortName });
					localObject.smlCapabilitiesOfferings	= openIodSosSensorMl.initSmlCapabilitiesOfferings({name:_offeringName, url:_offeringUrl });
					localObject.smlCapabilitiesFeaturesOfInterest	= openIodSosSensorMl.initSmlCapabilitiesFeaturesOfInterest({url:_featureofinterestUrl});
					localObject.smlOutputs					= {};
					localObject.smlOutputs.smlOutputList	= [];
					localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"pm1", definition:"http://wiki.aireas.com/index.php/airbox_sensor_pm1"}) );
					localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"pm25", definition:"http://wiki.aireas.com/index.php/airbox_sensor_pm25"}) );
					localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"pm10", definition:"http://wiki.aireas.com/index.php/airbox_sensor_pm10"}) );
					localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"rhum", definition:"http://wiki.aireas.com/index.php/airbox_sensor_rhum"}) );
					localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"rhumext", definition:"http://wiki.aireas.com/index.php/airbox_sensor_rhumext"}) );
					localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"temp", definition:"http://wiki.aireas.com/index.php/airbox_sensor_temp"}) );
					localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"tempext", definition:"http://wiki.aireas.com/index.php/airbox_sensor_tempext"}) );


					var localProcedure = {};
					localProcedure.smlSensorMl = {};
					localProcedure.smlSensorMl.attributes = {};
					localProcedure.smlSensorMl.attributes.version = "1.0.1";
					localProcedure.smlSensorMl.smlMember = {};
					localProcedure.smlSensorMl.smlMember.smlSystem = {};
					localProcedure.smlSensorMl.smlMember.smlSystem = localObject;

					var obj = {};
					obj.objectType  	= 'smlPhysicalSystem';
					obj.objectId		= 'airboxId';
					obj.procedure 		= localProcedure;  //airbox Id
					obj.observableProperties = openIodSosSensorMl.initObservableProperties([
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_gpslat"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_gpslng"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_ozone"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_pm1"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_pm25"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_pm10"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_ufp"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_no2"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_rhum"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_rhumext"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_temp"},
		   { "swesObservableProperty": "http://wiki.aireas.com/index.php/airbox_tempext"}
		]);
					obj.metadata 		= {};
					obj.metadata.sosSosInsertionMetadata = openIodSosSensorMl.initObservationTypes([
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_GeometryObservation" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_GeometryObservation" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CountObservation" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" }
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation" },
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CountObservation" },
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_TextObservation" },
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_TruthObservation" },
//			{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_SWEArrayObservation" }
		]);

					_param.object = obj;

					resultOutput = self.testInsertSensor(req, res, query, _param, self);

					console.log(_shortName);

					self.testExecuteInsertSensor(req, res, query, _param, self, resultOutput);

				}

				res.send(resultOutput);
				return;
			});
			return;
		}


		if ( (query.inputformat == 'insertsensor' || query.inputformat == 'executeinsertsensor') && query.objectid == 'humansensor') {

				resultOutput = "";

				var localObject 	= {};

				if (query.region == undefined) query.region= 'EHV' ;


				var _procedureUniqueID 		= 'http://wiki.aireas.com/index.php/humansensor_standard_procedure';
				var _featureofinterestUrl	= 'http://wiki.aireas.com/index.php/humansensor';
				var _longName 				= 'human sensor ' + 'standard procedure';
				var _shortName 				= 'humansensor_' + 'standard procedure';
				var _offeringName 			= 'humansensor_' + query.region + '_offering_initial';
				var _offeringUrl			= 'http://wiki.aireas.com/index.php/' + _offeringName;

				localObject.smlIdentification					= openIodSosSensorMl.initSmlIdentification({uniqueID:_procedureUniqueID, longName:_longName, shortName:_shortName });

				// exclude offering when this transaction is an update e.g. addition of observable property
				// !! offering will be automaticly created and can result in errors for observationconstellation. Better to create a complete new offering ??
				localObject.smlCapabilitiesOfferings			= openIodSosSensorMl.initSmlCapabilitiesOfferings({name:_offeringName, url:_offeringUrl });

				localObject.smlCapabilitiesFeaturesOfInterest	= openIodSosSensorMl.initSmlCapabilitiesFeaturesOfInterest({url:_featureofinterestUrl});
				localObject.smlOutputs							= {};
				localObject.smlOutputs.smlOutputList			= [];
				localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"airquality", definition:"http://wiki.aireas.com/index.php/humansensor_airquality"}) );
				localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"noicestress", definition:"http://wiki.aireas.com/index.php/humansensor_noicestress"}) );
				localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"trafficstress", definition:"http://wiki.aireas.com/index.php/humansensor_trafficstress"}) );
				localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"odorstress", definition:"http://wiki.aireas.com/index.php/humansensor_odorstress"}) );
				localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"stress", definition:"http://wiki.aireas.com/index.php/humansensor_stress"}) );

				localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"shinyei", definition:"http://wiki.aireas.com/index.php/humansensor_shinyei"}) );
				localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:"dylos", definition:"http://wiki.aireas.com/index.php/humansensor_dylos"}) );




				var localProcedure = {};
				localProcedure.smlSensorMl = {};
				localProcedure.smlSensorMl.attributes = {};
				localProcedure.smlSensorMl.attributes.version = "1.0.1";
				localProcedure.smlSensorMl.smlMember = {};
				localProcedure.smlSensorMl.smlMember.smlSystem = {};
				localProcedure.smlSensorMl.smlMember.smlSystem = localObject;

				var obj = {};
				obj.objectType  	= 'smlPhysicalSystem';
				obj.objectId		= 'humansensor';
				obj.procedure 		= localProcedure;
				obj.observableProperties = openIodSosSensorMl.initObservableProperties([
				   { "swesObservableProperty": "http://wiki.aireas.com/index.php/humansensor_lat"},
				   { "swesObservableProperty": "http://wiki.aireas.com/index.php/humansensor_lng"},
				   { "swesObservableProperty": "http://wiki.aireas.com/index.php/humansensor_airquality"},
				   { "swesObservableProperty": "http://wiki.aireas.com/index.php/humansensor_noicestress"},
				   { "swesObservableProperty": "http://wiki.aireas.com/index.php/humansensor_trafficstress"},
				   { "swesObservableProperty": "http://wiki.aireas.com/index.php/humansensor_odorstress"},
				   { "swesObservableProperty": "http://wiki.aireas.com/index.php/humansensor_stress"},
				   { "swesObservableProperty": "http://wiki.aireas.com/index.php/humansensor_shinyei"},
				   { "swesObservableProperty": "http://wiki.aireas.com/index.php/humansensor_dylos"}
				]);
				obj.metadata 		= {};
				obj.metadata.sosSosInsertionMetadata = openIodSosSensorMl.initObservationTypes([
					{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_GeometryObservation" },
					{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_GeometryObservation" },
					{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation" },
					{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation" },
					{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation" },
					{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation" },
					{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation" }
//					{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement" },
//					{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CategoryObservation" },
//					{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_CountObservation" },
//					{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_TextObservation" },
//					{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_TruthObservation" },
//					{"sosObservationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_SWEArrayObservation" }
				]);

				_param.object = obj;

				resultOutput = self.testInsertSensor(req, res, query, _param, self);

				console.log(_shortName);

				if (query.inputformat == 'executeinsertsensor') {
					self.testExecuteInsertSensor(req, res, query, _param, self, resultOutput);
				}

				res.send(resultOutput);
				return;
		}







		if ( query.action == 'insertsensor' && query.sensorsystem != undefined && query.offering != undefined ) {
			//console.log(this.openIoDConfig.getConfigLocalPath());

			// oud: // e.g. http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&sensorsystem=scapeler_shinyei&action=insertsensor&offering=offering_0439_initial&commit=true


			//		pmsa003:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-pmsa003&offering=offering_0439_initial&commit=false
			//		sds011:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-sds011&offering=offering_0439_initial&commit=false
			//		ds18b20:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-ds18b20&offering=offering_0439_initial&commit=false
			//		am2320:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-am2320&offering=offering_0439_initial&commit=false
			//		bme280:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-bme280&offering=offering_0439_initial&commit=false
			//		dylos:		https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=scapeler_dylos&offering=offering_0439_initial&commit=false
			//		luchtmeetnet:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-luchtmeetnet&offering=offering_0439_initial&commit=false
			//		knmi:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-knmi10m&offering=offering_knmi10m_initial&commit=false
			//		bmp280:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-bmp280&offering=offering_0439_initial&commit=false
			//		luftdaten:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-luftdaten&offering=offering_0439_initial&commit=false
			//		RadiationD:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-radiationd&offering=offering_0439_initial&commit=false
			//		josuino:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-josuino&offering=offering_0439_initial&commit=false
			//		caire:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-caire&offering=offering_0439_initial&commit=false
			//		shinyei:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&commit=false
			//		co2:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=scapeler_co2&offering=offering_0439_initial&commit=false
			//		barometer:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=scapeler_barometer&offering=offering_0439_initial&commit=false
			//		pms7003:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-pms7003&offering=offering_0439_initial&commit=false
			//		mq131:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-mq131&offering=offering_0439_initial&commit=false
			//		sentinel ensemble surface forecast:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-sentinel&offering=offering_sentinel_ensemble_surface_forecast&commit=false
			//		sentinel ensemble surface analysis:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-sentinel&offering=offering_sentinel_ensemble_surface_analysis&commit=false
			//		mics6814:	https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-mics6814&offering=offering_0439_initial&commit=false


/*
reset offerings in SOS SERVICE
	After reboot SOS-server and also postgres DB restart after reboot SOS

curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-pmsa003&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-sds011&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-ds18b20&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-am2320&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-bme280&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=scapeler_dylos&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-luchtmeetnet&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-knmi10m&offering=offering_knmi10m_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-bmp280&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-luftdaten&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-radiationd&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-josuino&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-caire&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=scapeler_shinyei&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=scapeler_co2&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=scapeler_barometer&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-pms7003&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-mq131&offering=offering_0439_initial&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-sentinel&offering=offering_sentinel_ensemble_surface_forecast&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-sentinel&offering=offering_sentinel_ensemble_surface_analysis&commit=true"
curl "https://openiod.org/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&action=insertsensor&sensorsystem=apri-sensor-mics6814&offering=offering_0439_initial&commit=true"


*/




//			var offeringFile	= fs.readFileSync(this.openIoDConfig.getConfigLocalPath() + "openiod-sensors/sensor_system/" + query.sensorsystem + "/" + query.offering + ".json");

//			var offeringConfig	= JSON.parse(offeringFile);

//			// for now only one procedure possible!
//			//for (var i=0; i<offeringConfig.procedure.length;i++) {
//			var procedureFile		= fs.readFileSync(this.openIoDConfig.getConfigLocalPath() + "openiod-sensors/sensor_system/" + query.sensorsystem + "/" + offeringConfig.procedure[0].id + ".json");
//			var procedureConfig		= JSON.parse(procedureFile);
//			//}

			resultOutput = "";


			var offeringFile='';
			var offeringConfig;
			var procedureFile;
			var procedureConfig;
			try {
				offeringFile		= fs.readFileSync(this.openIoDConfig.getConfigLocalPath() + "openiod-sensors/sensor_system/" + query.sensorsystem + "/" + query.offering + ".json");
				offeringConfig	= JSON.parse(offeringFile);
				// for now only one procedure possible!
				//for (var i=0; i<offeringConfig.procedure.length;i++) {
				procedureFile		= fs.readFileSync(this.openIoDConfig.getConfigLocalPath() + "openiod-sensors/sensor_system/" + query.sensorsystem + "/" + offeringConfig.procedure[0].id + ".json");
				procedureConfig	= JSON.parse(procedureFile);
				//}
			}
			catch(err) {
				errorResult(res, errorMessages.NOOFFERING);
				console.log('ERROR: ' + errorMessages.NOOFFERING.message);
				return;
			}

			if (offeringFile='') {
				return;
			}



			var localObject 	= {};

	//		if (query.region == undefined) query.region= 'default' ;

			var _procedureUniqueID 							= procedureConfig.defaults.urlPrefix + procedureConfig.id;
			var _featureofinterestCapabilitiesUrl			= procedureConfig.defaults.urlPrefix + offeringConfig.id;
			var _longName 									= procedureConfig.name;
			var _shortName 									= procedureConfig.nameShort;
			var _offeringName 								= offeringConfig.id + '_' + offeringConfig.region + '_offering_' + offeringConfig.offering.id;
			var _offeringUrl								= procedureConfig.defaults.urlPrefix + _offeringName;

			localObject.smlIdentification					= openIodSosSensorMl.initSmlIdentification({uniqueID:_procedureUniqueID, longName:_longName, shortName:_shortName });

			// exclude offering when this transaction is an update e.g. addition of observable property
			// !! offering will be automaticly created and can result in errors for observationconstellation. Better to create a complete new offering ??
			localObject.smlCapabilitiesOfferings			= openIodSosSensorMl.initSmlCapabilitiesOfferings({name:_offeringName, url:_offeringUrl });

			localObject.smlCapabilitiesFeaturesOfInterest	= openIodSosSensorMl.initSmlCapabilitiesFeaturesOfInterest({url:_featureofinterestCapabilitiesUrl});
			localObject.smlOutputs							= {};
			localObject.smlOutputs.smlOutputList			= [];
			for (var i=0;i<procedureConfig.output.length;i++) {
				var _output	= procedureConfig.output[i];
				localObject.smlOutputs.smlOutputList.push(openIodSosSensorMl.initSmlOutputQuantity({name:_output.id, definition:procedureConfig.defaults.urlPrefix+_output.swesObservableProperty}));
			}

			var localProcedure 								= {};
			localProcedure.smlSensorMl 						= {};
			localProcedure.smlSensorMl.attributes 			= {};
			localProcedure.smlSensorMl.attributes.version 	= procedureConfig.sensorMlVersion;
			localProcedure.smlSensorMl.smlMember 			= {};
			localProcedure.smlSensorMl.smlMember.smlSystem 	= {};
			localProcedure.smlSensorMl.smlMember.smlSystem 	= localObject;

			var obj 										= {};
			obj.objectType  								= procedureConfig.type;
			obj.objectId									= procedureConfig.id;
			obj.procedure 		= localProcedure;

			var _observableProperties						= [];
			for (var i=0;i<procedureConfig.output.length;i++) {
				var _observableProperty = {};
				_observableProperty.swesObservableProperty	= procedureConfig.defaults.urlPrefix + procedureConfig.output[i].swesObservableProperty;
				_observableProperty.sosObservationType		= procedureConfig.output[i].sosObservationType;
				_observableProperties.push(_observableProperty);
			}

			obj.observableProperties = openIodSosSensorMl.initObservableProperties(_observableProperties);
			obj.metadata 		= {};
			obj.metadata.sosSosInsertionMetadata = openIodSosSensorMl.initObservationTypes(_observableProperties);

			_param.object = obj;

			resultOutput = self.testInsertSensor(req, res, query, _param, self);

			console.log(_shortName);

			if (query.commit == 'true') {
				self.testExecuteInsertSensor(req, res, query, _param, self, resultOutput);
			}

			res.send(resultOutput);
			return;

		}


		if (query.inputformat == 'insertsensor') {

			resultOutput = self.testInsertSensor(req, res, query, _param, self);
			console.log('xxxx Sensor xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
			//self.testExecuteInsertSensor(req, res, query, _param, self, resultOutput);
			res.send(resultOutput);
			return;
		}



		if (query.inputformat == 'testsml') {
			self.testTransformSml(req, res, query, _param, self);
			return;
		}

		errorResult(res, errorMessages.NOINPUTFORMAT);
		return;

	},

	setSmlNameSpaces: function () {
		var attributes = {};
		attributes['xmlns:sml'] 			= "http://www.opengis.net/sensorML/1.0.1";
		attributes['xmlns:sos'] 			= "http://www.opengis.net/sos/2.0";
		attributes['xmlns:swe'] 			= "http://www.opengis.net/swe/1.0.1";
		attributes['xmlns:swes'] 			= "http://www.opengis.net/swes/2.0";
		attributes['xmlns:gml'] 			= "http://www.opengis.net/gml";
		attributes['xmlns:ogc'] 			= "http://www.opengis.net/ogc";
		attributes['xmlns:xsi'] 			= "http://www.w3.org/2001/XMLSchema-instance";
		attributes['xmlns:xlink'] 			= "http://www.w3.org/1999/xlink";
		attributes['xsi:schemaLocation'] 	= "http://www.opengis.net/sensorml/2.0 http://schemas.opengis.net/sensorml/2.0/sensorML.xsd";
		return attributes;
	},



	initSmlPhysicalComponent: function (newObject, param) {

		var _object = param.object;

		//console.log('omOM_ObservationCollection', param);
		console.log('initSmlPhysicalComponent');
		//console.log(_object);
		var smlPhysicalComponent = newObject;

		//var _smlSystem = _object.procedure.smlSensorMl.smlMember.smlSystem;

		//console.log(_smlSystem);

//		for (var i=0; i<_object.elements.length; i++) {
//		for (var key in _smlSystem) {

/*
			if (_smlSystem.smlTypeOf) {
				smlPhysicalComponent.smlTypeOf = _smlSystem.smlTypeOf;
			}


			if (_smlSystem.smlKeywords) {
				smlPhysicalComponent.smlKeywords = _smlSystem.smlKeywords;
			}

			if (_smlSystem.smlCharacteristics) {
				smlPhysicalComponent.smlCharacteristics = _smlSystem.smlCharacteristics;
			}

			if (_smlSystem.smlCapabilitiesOfferings) {
				smlPhysicalComponent.smlCapabilitiesOfferings = _smlSystem.smlCapabilitiesOfferings;
			}
			if (_smlSystem.smlCapabilitiesParentProcedures) {
				smlPhysicalComponent.smlCapabilitiesParentProcedures = _smlSystem.smlCapabilitiesParentProcedures;
			}
			if (_smlSystem.smlCapabilitiesFeaturesOfInterest) {
				smlPhysicalComponent.smlCapabilitiesFeaturesOfInterest = _smlSystem.smlCapabilitiesFeaturesOfInterest;
			}


			if (_smlSystem.smlInputs) {
				smlPhysicalComponent.smlInputs = _smlSystem.smlInputs;
			}

			if (_smlSystem.smlOutputs) {
				smlPhysicalComponent.smlOutputs = _smlSystem.smlOutputs;
			}


			if (_smlSystem.smlPosition) {
				smlPhysicalComponent.smlPosition = _smlSystem.smlPosition;
			}
*/

//		smlPhysicalComponent.gmlBoundedBy					= this.initGmlBoundedBy(omOM_ObservationCollection, param);

//		smlPhysicalComponent.smlPhysicalComponentItems		= [];

//		//console.log(sml, _object.members);
//		for (var i=0; i<_object.members.length; i++) {
//			var smlMember = this.initSmlMember(smlPhysicalComponent.smlMembers, _object.members[i], param);
//			smlPhysicalComponent.smlMembers.push(smlMember);
//		}

//		}


		return smlPhysicalComponent;
	},

	initSmlMember: function (newSmlMembers, member, param) {
		var smlMember = {};
		smlMember.smlSensor = this.initSmlSensor(member, param);
		return smlMember;
	},

	initSmlSensor: function (member, param) {
		var smlSensor = {};
		var memberSensor = member.sensor;

/*		if (omOM_Observation.omSamplingTime) {
			omOM_Observation.omSamplingTime 			= this.initOmSamplingTime		(omOM_Observation, omOM_Observation);
		}
		if (omOM_Observation.omProcedure) {
			omOM_Observation.omProcedure 				= this.initOmProcedure			(omOM_Observation, omOM_Observation);
		}
		if (omOM_Observation.omObservedProperty) {
			omOM_Observation.omObservedProperty 		= this.initOmObservedProperty	(omOM_Observation, omOM_Observation);
		}
		if (omOM_Observation.omFeatureOfInterest) {
			omOM_Observation.omFeatureOfInterest 		= this.initOmFeatureOfInterest	(omOM_Observation, omOM_Observation, param);
		}
		if (omOM_Observation.result) {
			omOM_Observation.omResult 					= this.initOmResult				(omOM_Observation, omOM_Observation);
		}
*/
		return smlSensor;
	},


	initOmObservationCollection: function (newObject, param) {
		//console.log('omOM_ObservationCollection', param);
		var omOM_ObservationCollection = newObject;

/*		omOM_ObservationCollection.attributes 						= {};
		omOM_ObservationCollection.attributes['xmlns:om'] 			= "http://www.opengis.net/om/1.0";
		omOM_ObservationCollection.attributes['xmlns:gml'] 		= "http://www.opengis.net/gml";
		omOM_ObservationCollection.attributes['xmlns:xsi'] 		= "http://www.w3.org/2001/XMLSchema-instance";
		omOM_ObservationCollection.attributes['xmlns:xlink'] 		= "http://www.w3.org/1999/xlink";
		omOM_ObservationCollection.attributes['xmlns:swe'] 		= "http://www.opengis.net/swe/1.0.1";
		omOM_ObservationCollection.attributes['xmlns:sa'] 			= "http://www.opengis.net/sampling/1.0";
		omOM_ObservationCollection.attributes['gml:id'] 			= "oc_1425935648988";
		omOM_ObservationCollection.attributes['xsi:schemaLocation'] = "http://www.opengis.net/om/1.0 http://schemas.opengis.net/om/1.0.0/om.xsd http://www.opengis.net/sampling/1.0 http://schemas.opengis.net/sampling/1.0.0/sampling.xsd";
*/

//		omOM_ObservationCollection.gmlBoundedBy					= this.initGmlBoundedBy(omOM_ObservationCollection, param);
		omOM_ObservationCollection.omOM_Observations		= [];

		//console.log(omOM_ObservationCollection, param.object.omOM_Observations);
		for (var i=0; i<param.object.omOM_Observations.length; i++) {
			var omOM_Observation = this.initOmOM_Observation(omOM_ObservationCollection.omOM_Observations, param.object.omOM_Observations[i], param);
			omOM_ObservationCollection.omOM_Observations.push(omOM_Observation);
		}

		return omOM_ObservationCollection;
	},

	initGmlBoundedBy: function (omOM_ObservationCollection, param) {
		//console.log(param);
		var gmlBoundedBy = {};
		gmlBoundedBy.gmlEnvelope 						= {};
		gmlBoundedBy.gmlEnvelope.attributes				= {};
		gmlBoundedBy.gmlEnvelope.attributes.srsName 	= param.srsName;
		gmlBoundedBy.gmlEnvelope.gmlLowerCorner 		= {};
		gmlBoundedBy.gmlEnvelope.gmlLowerCorner.lat 	= param.boundingBox.lowerCorner.lat;
		gmlBoundedBy.gmlEnvelope.gmlLowerCorner.lng 	= param.boundingBox.lowerCorner.lng;
		gmlBoundedBy.gmlEnvelope.gmlUpperCorner 		= {};
		gmlBoundedBy.gmlEnvelope.gmlUpperCorner.lat 	= param.boundingBox.upperCorner.lat;
		gmlBoundedBy.gmlEnvelope.gmlUpperCorner.lng 	= param.boundingBox.upperCorner.lng;
		return gmlBoundedBy;
	},

	initOmOM_Observation: function (newOmOM_Observations, input_omOM_Observation, param) {
		var omOM_Observation = {};
		omOM_Observation.omOM_Observation = this.initOmObservation(input_omOM_Observation, param);
		return omOM_Observation;
	},

	initOmObservation: function (input_omOM_Observation, param) {
		var omOM_Observation = {};
		var omOM_Observation = input_omOM_Observation;

		//console.log(input_omOM_Observation);

		if (omOM_Observation.omSamplingTime) {
			omOM_Observation.omSamplingTime 			= this.initOmSamplingTime		(omOM_Observation, omOM_Observation);
		}
		if (omOM_Observation.omProcedure) {
			omOM_Observation.omProcedure 				= this.initOmProcedure			(omOM_Observation, omOM_Observation);
		}
		if (omOM_Observation.omObservedProperty) {
			omOM_Observation.omObservedProperty 		= this.initOmObservedProperty	(omOM_Observation, omOM_Observation);
		}
		if (omOM_Observation.omFeatureOfInterest) {
			omOM_Observation.omFeatureOfInterest 		= this.initOmFeatureOfInterest	(omOM_Observation, omOM_Observation, param);
		}
		if (omOM_Observation.result) {
			omOM_Observation.omResult 					= this.initOmResult				(omOM_Observation, omOM_Observation);
		}
		return omOM_Observation;
	},

	initOmSamplingTime: function (observation, inputObservation) {
		var omSamplingTime = {};
		omSamplingTime.gmlTimePeriod = inputObservation.omSamplingTime.gmlTimePeriod;
		//omSamplingTime.gmlTimePeriod = {};
		//omSamplingTime.gmlTimePeriod.xsiType = "gml:TimePeriodType";
		//omSamplingTime.gmlTimePeriod.gmlBeginPosition = inputObservation.startDatetime;
		//omSamplingTime.gmlTimePeriod.gmlBeginPosition = inputObservation.endDatetime;
		return omSamplingTime;
	},

	initOmProcedure: function (observation, inputObservation) {
		var omProcedure = {};
		omProcedure = inputObservation.omProcedure;
		//if (param.object.procedure.xlinkHref) {
		//	omProcedure.xlinkHref = inputObservation.procedure.xlinkHref;
		//}
		return omProcedure;
	},

	initOmObservedProperty: function (observation, inputObservation) {
		var omObservedProperty = {};
		omObservedProperty.sweCompositePhenomenon = inputObservation.omObservedProperty.sweCompositePhenomenon;
		//omObservedProperty.sweCompositePhenomenon.gmlId = "cpid0";
		//omObservedProperty.sweCompositePhenomenon.dimension = "2";
		//omObservedProperty.sweCompositePhenomenon.gmlName = "Result Components";
		//omObservedProperty.sweCompositePhenomenon.sweComponents = inputObservation.omObservedProperty.sweCompositePhenomenon.sweComponents;
		return omObservedProperty;
	},

	initOmFeatureOfInterest: function (observation, inputObservation, param ) {
		var omFeatureOfInterest = {};
		omFeatureOfInterest = inputObservation.omFeatureOfInterest;

//		omFeatureOfInterest.gmlFeatureCollection = {};
//		omFeatureOfInterest.gmlFeatureCollection.gmlFeatureMembers = [];
//		for (var i=0; i<inputObservation.featureOfInterest.gmlFeatureMembers.length; I++) {
//			var gmlFeatureMember = this.initOmGmlFeatureMember(omFeatureOfInterest.gmlFeatureCollection.gmlFeatureMembers, inputObservation.featureOfInterest.gmlFeatureMembers[i], param);
//			omFeatureOfInterest.gmlFeatureCollection.gmlFeatureMembers.push(gmlFeatureMember);
//		}
		return omFeatureOfInterest;
	},

/*
	initOmGmlFeatureMember: function (gmlFeatureMembers, paramGmlFeatureMember, param) {
		var gmlFeatureMember = {};
		gmlFeatureMember.saSamplePoint = {};
		gmlFeatureMember.saSamplePoint.gmlId = paramGmlFeatureMember.id;
		gmlFeatureMember.saSamplePoint.xsiSchemaLocation = "http://www.opengis.net/sampling/1.0 http://schemas.opengis.net/sampling/1.0.0/sampling.xsd";
		gmlFeatureMember.saSamplePoint.gmlDescription = paramGmlFeatureMember.description;
		gmlFeatureMember.saSamplePoint.gmlName = paramGmlFeatureMember.name;
		gmlFeatureMember.saSamplePoint.saSampleFeature = {};
		gmlFeatureMember.saSamplePoint.saSampleFeature.xlinkRole = paramGmlFeatureMember.xlinkRole;
		gmlFeatureMember.saSamplePoint.saSampleFeature.xlinkHref = paramGmlFeatureMember.xlinkHref;
		gmlFeatureMember.saSamplePoint.saPosition = {};
		gmlFeatureMember.saSamplePoint.saPosition.gmlPoint = {};
		gmlFeatureMember.saSamplePoint.saPosition.gmlPoint.gmlPos = {};
		gmlFeatureMember.saSamplePoint.saPosition.gmlPoint.gmlPos.srsName = param.srsName;
		gmlFeatureMember.saSamplePoint.saPosition.gmlPoint.gmlPos.lat = paramGmlFeatureMember.lat;
		gmlFeatureMember.saSamplePoint.saPosition.gmlPoint.gmlPos.lng = paramGmlFeatureMember.lng;
		return gmlFeatureMember;
	},
*/
	initOmResult: function (observation, inputObservation) {
		var i;
		var omResult = {};
		omResult.sweDataArray = {};
		if (inputObservation.result.values && inputObservation.result.values.length) {
			omResult.sweDataArray.sweElementCount = {};
			omResult.sweDataArray.sweElementCount.sweCount = {};
			omResult.sweDataArray.sweElementCount.sweCount.sweValue = inputObservation.result.values.length;
		}
		omResult.sweDataArray.sweElementType = {};
		omResult.sweDataArray.sweElementType.attributes = {};
		omResult.sweDataArray.sweElementType.attributes.name = "Components";
		omResult.sweDataArray.sweElementType.sweDataRecord = [];
		//omResult.sweDataArray.sweElementType.sweDataRecord.sweFields = [];
		for (var field in inputObservation.result.sweDataRecord) {
			if (inputObservation.result.sweDataRecord.hasOwnProperty(field)) {
				//console.log('         --> '+ field);
				var sweField = this.initSweField(field, inputObservation.result.sweDataRecord[field] );
				omResult.sweDataArray.sweElementType.sweDataRecord.push(sweField);
			}
		}
		omResult.sweDataArray.sweEncoding = {};
		omResult.sweDataArray.sweEncoding.sweTextBlock = {};
		omResult.sweDataArray.sweEncoding.sweTextBlock.attributes = {};
		omResult.sweDataArray.sweEncoding.sweTextBlock.attributes.decimalSeparator = ".";
		omResult.sweDataArray.sweEncoding.sweTextBlock.attributes.tokenSeparator 	= ",";
		omResult.sweDataArray.sweEncoding.sweTextBlock.attributes.blockSeparator 	= ";";
		omResult.sweDataArray.sweValues = [];

		//console.log('      ------>>>>>>  length: '+ inputObservation.result.values.length);
		for (i=0; i<inputObservation.result.values.length; i++) {
			var sweValue = inputObservation.result.values[i];
			//console.log('    '+ sweValue);
			omResult.sweDataArray.sweValues.push(sweValue);
		}

//		omResult.sweDataArray.sweValues = inputObservation.result.records;

		return omResult;
	},

	initSweField: function (field, fieldValue) {
		var sweField = {};
		sweField.sweField = {}
		sweField.sweField.attributes = {};
		sweField.sweField.attributes.name = field;

		//console.log('         initfield--> '+ field);
		for (var element in fieldValue) {
			if (fieldValue.hasOwnProperty(element)) {
				//sweField.name = field.name;
				//console.log('   =====>>>> element: ' + element);
				//var _type = "swe" + fieldValue[element];
				sweField.sweField[element] = fieldValue[element];
				//sweField.sweField.typeDefinition = field.typeDefinition;
//				sweField.sweField[element].sweUom = {}
//				sweField.sweField[element].sweUom.code = field.uom;
//				sweField.sweField[element].sweUom.xlinkHref = field.xlinkHref;
			}
		}


		return sweField;
	},



	testCreateSensorInternal: function(req, res, query, param) {
		/*
		** Transforming sensor data from IoT specific into SensorML or alike, json or xml
	   	*/

		param.srsName 		= 'urn:ogc:def:crs:EPSG::4326';
		param.boundingBox	= {lowerCorner: {lat:123,lng:456}, upperCorner: {lat:125,lng:458} };
//		param.object  = localObjects[param.objectId];

//		console.log('Object: ' + param.object);

		if (param.object) {
		} else {
			if (localObjects[param.objectId]) {
				param.object = localObjects[param.objectId];
			};
		};

		return param;
	},





	testCreateObservationInternal: function(req, res, query, param) {
		/*
		** Transforming observation data from IoT specific into O&M or alike, json or xml
		*/

		param.srsName 		= 'urn:ogc:def:crs:EPSG::4326';
		param.boundingBox	= {lowerCorner: {lat:123,lng:456}, upperCorner: {lat:125,lng:458} };


		if (param.object) {
		} else {
			if (localObjects[param.objectId]) {
				param.object = localObjects[param.objectId];
			};
		};

//		if (localObjects[param.objectId]) {
//			param.object = localObjects[param.objectId];
//			console.log('objectId found');
//		} else {
//			console.log('objectId not found: '+param.objectId);
//		};

		return param;
	},




	testExecuteInsertSensor: function(req, res, query, param, self, document) {
		/*
		** Execute Insert observation transaction into SOS database
   	 	*/

		var result = 'ExecuteInsertObservation: ' + document;

		var inpMethod 	= 'POST';
		var contentType = 'application/xml';
//		var contentType = 'application/json';
		var resultBody	= document;

		//https://openiod.org/52n-sos-webapp/service

/*
		//test:
var resultBodyTest = '<?xml version="1.0" encoding="UTF-8"?> \
<sos:InsertObservation \
    xmlns:sos="http://www.opengis.net/sos/2.0" \
    xmlns:swes="http://www.opengis.net/swes/2.0"\
    xmlns:swe="http://www.opengis.net/swe/2.0"\
    xmlns:sml="http://www.opengis.net/sensorML/1.0.1"\
    xmlns:gml="http://www.opengis.net/gml/3.2"\
    xmlns:xlink="http://www.w3.org/1999/xlink"\
    xmlns:om="http://www.opengis.net/om/2.0"\
    xmlns:sams="http://www.opengis.net/samplingSpatial/2.0"\
    xmlns:sf="http://www.opengis.net/sampling/2.0"\
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" service="SOS" version="2.0.0" xsi:schemaLocation="http://www.opengis.net/sos/2.0 http://schemas.opengis.net/sos/2.0/sos.xsd          http://www.opengis.net/samplingSpatial/2.0 http://schemas.opengis.net/samplingSpatial/2.0/spatialSamplingFeature.xsd">\
    <!-- multiple offerings are possible -->\
    <sos:offering>http://www.52north.org/test/offering/9</sos:offering>\
    <sos:observation>\
        <om:OM_Observation gml:id="o1">\
            <gml:description>test description for this observation</gml:description>\
            <gml:identifier codeSpace="">http://www.52north.org/test/observation/9</gml:identifier>\
            <om:type xlink:href="http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement"/>\
            <om:phenomenonTime>\
                <gml:TimeInstant gml:id="phenomenonTime">\
                    <gml:timePosition>2012-07-31T17:45:15.000+00:00</gml:timePosition>\
                </gml:TimeInstant>\
            </om:phenomenonTime>\
            <om:resultTime xlink:href="#phenomenonTime"/>\
            <om:procedure xlink:href="http://www.52north.org/test/procedure/9"/>\
            <om:observedProperty xlink:href="http://www.52north.org/test/observableProperty/9_3"/>\
            <om:featureOfInterest>\
                <sams:SF_SpatialSamplingFeature gml:id="ssf_test_feature_9">\
                    <gml:identifier codeSpace="">http://www.52north.org/test/featureOfInterest/9</gml:identifier>\
                    <gml:name>52°North</gml:name>\
                    <sf:type xlink:href="http://www.opengis.net/def/samplingFeatureType/OGC-OM/2.0/SF_SamplingPoint"/>\
                    <sf:sampledFeature xlink:href="http://www.52north.org/test/featureOfInterest/1"/>\
                    <sams:shape>\
                        <gml:Point gml:id="test_feature_9">\
                            <gml:pos srsName="http://www.opengis.net/def/crs/EPSG/0/4326">51.935101100104916 7.651968812254194</gml:pos>\
                        </gml:Point>\
                    </sams:shape>\
                </sams:SF_SpatialSamplingFeature>\
            </om:featureOfInterest>\
            <om:result xsi:type="gml:MeasureType" uom="test_unit_9_3">0.28</om:result>\
        </om:OM_Observation>\
    </sos:observation>\
</sos:InsertObservation>';
//resultBody=resultBodyTest;
*/

/*
<?xml version="1.0" encoding="UTF-8"?>
<sos:InsertObservation xmlns:sos="http://www.opengis.net/sos/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:om="http://www.opengis.net/om/2.0" xmlns:sams="http://www.opengis.net/samplingSpatial/2.0" xmlns:sf="http://www.opengis.net/sampling/2.0" xmlns:swe="http://www.opengis.net/swe/2.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" service="SOS" version="2.0.0" xsi:schemaLocation="http://www.opengis.net/sos/2.0 http://schemas.opengis.net/sos/2.0/sos.xsd          http://www.opengis.net/samplingSpatial/2.0 http://schemas.opengis.net/samplingSpatial/2.0/spatialSamplingFeature.xsd">
   <sos:offering>http://openiod.org/wiki/airbox_observations</sos:offering>
   <sos:observation>
      <om:OM_Observation gml:id="Ob">
         <om:phenomenonTime>
            <gml:TimeInstant gml:id="phenomenonTime">
               <gml:timePosition>2015-02-06T00:01:00.000+01:00</gml:timePosition>
            </gml:TimeInstant>
         </om:phenomenonTime>
         <om:resultTime xlink:href="#phenomenonTime" />
         <om:procedure xlink:href="Air Quality Measurements ILM" />
         <om:observedProperty xlink:href="http://wiki.aireas.com/xxx.property" />
         <om:featureOfInterest>
            <sams:SF_SpatialSamplingFeature gml:id="sf">
               <gml:description>NOT_SET</gml:description>
               <gml:name>1.cal</gml:name>
               <sf:sampledFeature xlink:role="urn:x-ogc:def:property:river" xlink:href="http://sensorweb.demo.52north.org:80/PegelOnlineSOSv2.1/sos?REQUEST=getFeatureOfInterest&amp;service=SOS&amp;version=1.0.0&amp;featureOfInterestID=OSTE" />
               <sams:shape />
            </sams:SF_SpatialSamplingFeature>
         </om:featureOfInterest>
         <om:result />
      </om:OM_Observation>
   </sos:observation>
</sos:InsertObservation>

*/




	    var options = {
    	    //host: 'http://192.168.0.21',
			host:'https://openiod.org',
        	//port: '8080',
			//uri: systemRepositoryHttpServer+'/alfresco/service' + urlService,
			uri: 'https://openiod.org/52n-sos-webapp/service',

        	//path: '/'+systemCode+'/alfresco/service' + urlService,
        	method: inpMethod,  //'POST',
        	headers: {
          		'Content-Type': contentType,
				'Accept':'application/xml',
      		//    'Content-Type' : 'multipart/form-data; boundary=' + boundary,
				'Content-Length' : Buffer.byteLength(resultBody)
        	},
        	body: resultBody
    	}

		console.log('start request');
		//console.log(options);


    	request.post(options,
      		//body: JSON.stringify(resultBody)

			function(error, response, body) {
				var resultText;
				console.log('Callback started, post request service \n url: ' +
					request.url + '\n ' +
					'\n req     /headers/content-type: ' + JSON.stringify(request.headers) +
				//	'\n response/headers/content-type: ' + JSON.stringify(response.headers) +
					'\n error: ' +
					error);
				//res.headers = response.headers;
				if (error) {
					res.statusCode="500";
					resultText=JSON.stringify(error);
					res.send(resultText);
				} else {
					console.log("Body:"+response.body+":Body en statusCode: " + response.statusCode);
//					res.statusCode = response.statusCode; //return statusCode

/* xml response */
					console.log('response.status: ', response.status);
					if (response.status != undefined) {
						if (response.status.code == "500") {
							console.log('\nError: '+ response.status.code)
							res.statusCode="500";
							res.send('{ "name": "' + encodeURIComponent(response.status.name) + '", ' +
								'"description": "' + encodeURIComponent(response.status.description) + '", ' +
								'"message": "' + encodeURIComponent(response.message) + '" }');
						} else {
							console.log('\nError: '+ response.status.code)
							//res.statusCode = responseJson.status.code;
							res.send(response.body); // res.send(JSON.stringify(response.body));
						}
					} else {
				//        console.log('\nSend with headers: '+ JSON.stringify(res.headers));
				//res.setEncoding('utf8');
				//res.setContentType('application/json');
				//res.contentType="application/json";
//						res.contentType('application/xml;charset=utf-8');
//						res.send(response.body); // res.send(JSON.stringify(response.body));
					}



/* xml response */

/* json response
					var responseJson = JSON.parse(response.body);
					if (responseJson.status != undefined) {
						if (responseJson.status.code == "500") {
							console.log('\nError: '+ responseJson.status.code)
							res.statusCode="500";
							res.send('{ "name": "' + encodeURIComponent(responseJson.status.name) + '", ' +
								'"description": "' + encodeURIComponent(responseJson.status.description) + '", ' +
								'"message": "' + encodeURIComponent(responseJson.message) + '" }');
						} else {
							console.log('\nError: '+ responseJson.status.code)
							//res.statusCode = responseJson.status.code;
							res.send(response.body); // res.send(JSON.stringify(response.body));
						}
					} else {
				//        console.log('\nSend with headers: '+ JSON.stringify(res.headers));
				//res.setEncoding('utf8');
				//res.setContentType('application/json');
				//res.contentType="application/json";
						res.contentType('application/json;charset=utf-8');
						res.send(response.body); // res.send(JSON.stringify(response.body));
					}
*/
				}
				//if(response.statusCode == 201){
				//  console.log('document saved as: http://mikeal.iriscouch.com/testjs/'+ rand)
				//} else {
				//  console.log('error: '+ response.statusCode)
				//  console.log(body)
				//}
				var d = new Date();
				console.log('\n\n%d-%d-%d/%d:%d:%d.%d End of POST. callback  ==============================================\n\n',d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds());
			}
		);


//		console.log(document);
//		res.send(document);

		return result;
	},


	sendFiwareData: function(data) {
		var _url = 'https://orion.openiod.nl/v2/entities?options=keyValues'; //openiodUrl;
		//_url = _url + '&region=0439' + '&neighborhoodcode=' + data.neighborhoodCode + '&citycode=' + data.cityCode + '&observation=' + data.observation ;

		//console.log(data);
		var json_obj = JSON.stringify(data);
		//console.log(_url);
		//console.log(json_obj)

		request.post({
    		headers: {'content-type': 'application/json'},
    		url: _url,
    		body: json_obj, //form: json_obj
			}, function(error, response, body){
				if (error) {
					console.log(error);
				}
  			//console.log(body);
			}
		);
	},

	processFiwareObject: function(fiwareObject) {

		//console.dir(fiwareObject);
		console.log('fiware insert object requested');
		this.sendFiwareData(fiwareObject);


	},


	testExecuteInsertObservation: function(req, res, query, param, self, document) {
		/*
		** Execute Insert observation transaction into SOS database
   	 	*/

		var result = 'ExecuteInsertObservation: ' + document;

		var inpMethod 	= 'POST';
		var contentType = 'application/xml';
//		var contentType = 'application/json';
		var resultBody	= document;

		//https://openiod.org/52n-sos-webapp/service

/*
		//test:
var resultBodyTest = '<?xml version="1.0" encoding="UTF-8"?> \
<sos:InsertObservation \
    xmlns:sos="http://www.opengis.net/sos/2.0" \
    xmlns:swes="http://www.opengis.net/swes/2.0"\
    xmlns:swe="http://www.opengis.net/swe/2.0"\
    xmlns:sml="http://www.opengis.net/sensorML/1.0.1"\
    xmlns:gml="http://www.opengis.net/gml/3.2"\
    xmlns:xlink="http://www.w3.org/1999/xlink"\
    xmlns:om="http://www.opengis.net/om/2.0"\
    xmlns:sams="http://www.opengis.net/samplingSpatial/2.0"\
    xmlns:sf="http://www.opengis.net/sampling/2.0"\
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" service="SOS" version="2.0.0" xsi:schemaLocation="http://www.opengis.net/sos/2.0 http://schemas.opengis.net/sos/2.0/sos.xsd          http://www.opengis.net/samplingSpatial/2.0 http://schemas.opengis.net/samplingSpatial/2.0/spatialSamplingFeature.xsd">\
    <!-- multiple offerings are possible -->\
    <sos:offering>http://www.52north.org/test/offering/9</sos:offering>\
    <sos:observation>\
        <om:OM_Observation gml:id="o1">\
            <gml:description>test description for this observation</gml:description>\
            <gml:identifier codeSpace="">http://www.52north.org/test/observation/9</gml:identifier>\
            <om:type xlink:href="http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement"/>\
            <om:phenomenonTime>\
                <gml:TimeInstant gml:id="phenomenonTime">\
                    <gml:timePosition>2012-07-31T17:45:15.000+00:00</gml:timePosition>\
                </gml:TimeInstant>\
            </om:phenomenonTime>\
            <om:resultTime xlink:href="#phenomenonTime"/>\
            <om:procedure xlink:href="http://www.52north.org/test/procedure/9"/>\
            <om:observedProperty xlink:href="http://www.52north.org/test/observableProperty/9_3"/>\
            <om:featureOfInterest>\
                <sams:SF_SpatialSamplingFeature gml:id="ssf_test_feature_9">\
                    <gml:identifier codeSpace="">http://www.52north.org/test/featureOfInterest/9</gml:identifier>\
                    <gml:name>52°North</gml:name>\
                    <sf:type xlink:href="http://www.opengis.net/def/samplingFeatureType/OGC-OM/2.0/SF_SamplingPoint"/>\
                    <sf:sampledFeature xlink:href="http://www.52north.org/test/featureOfInterest/1"/>\
                    <sams:shape>\
                        <gml:Point gml:id="test_feature_9">\
                            <gml:pos srsName="http://www.opengis.net/def/crs/EPSG/0/4326">51.935101100104916 7.651968812254194</gml:pos>\
                        </gml:Point>\
                    </sams:shape>\
                </sams:SF_SpatialSamplingFeature>\
            </om:featureOfInterest>\
            <om:result xsi:type="gml:MeasureType" uom="test_unit_9_3">0.28</om:result>\
        </om:OM_Observation>\
    </sos:observation>\
</sos:InsertObservation>';
//resultBody=resultBodyTest;
*/

	    var options = {
    	    //host: 'http://192.168.0.21',
			host:'https://openiod.org',
        	//port: '8080',
			//uri: systemRepositoryHttpServer+'/alfresco/service' + urlService,
//			uri: 'https://openiod.org/52n-sos-webapp/service?service=SOS&version=2.0.0',
			uri: 'https://openiod.org/52n-sos-webapp/service',

        	//path: '/'+systemCode+'/alfresco/service' + urlService,
        	method: inpMethod,  //'POST',
        	headers: {
          		'Content-Type': contentType,
				'Accept':'application/xml',
      		//    'Content-Type' : 'multipart/form-data; boundary=' + boundary,
				'Content-Length' : Buffer.byteLength(resultBody)
        	},
        	body: resultBody
    	}

		console.log('start request');
		//console.log(options);


    	request.post(options,
      		//body: JSON.stringify(resultBody)

			function(error, response, body) {
				var resultText;
//				console.log('Callback started, post request service \n url: ' +
//					request.url + '\n ' +
//					'\n req     /headers/content-type: ' + JSON.stringify(request.headers) +
//				//	'\n response/headers/content-type: ' + JSON.stringify(response.headers) +
//					'\n error: ' +
//					error);
				//res.headers = response.headers;
				if (error) {
					res.statusCode="500";
					resultText=JSON.stringify(error);
					console.log(resultText);
					//res.send(resultText);
				} else {
					console.log("Body:"+response.body+":Body en statusCode: " + response.statusCode);
//					res.statusCode = response.statusCode; //return statusCode

/* xml response */
					//console.log('response.status: ', response.status);
					if (response.status != undefined) {
						if (response.status.code == "500") {
							console.log('\nError: '+ response.status.code)
							res.statusCode="500";
							res.send('{ "name": "' + encodeURIComponent(response.status.name) + '", ' +
								'"description": "' + encodeURIComponent(response.status.description) + '", ' +
								'"message": "' + encodeURIComponent(response.message) + '" }');
						} else {
							console.log('\nError: '+ response.status.code)
							//res.statusCode = responseJson.status.code;
							res.send(response.body); // res.send(JSON.stringify(response.body));
						}
					} else {
				//        console.log('\nSend with headers: '+ JSON.stringify(res.headers));
				//res.setEncoding('utf8');
				//res.setContentType('application/json');
				//res.contentType="application/json";
//						res.contentType('application/xml;charset=utf-8');
//						res.send(response.body); // res.send(JSON.stringify(response.body));
					}



/* xml response */

/* json response
					var responseJson = JSON.parse(response.body);
					if (responseJson.status != undefined) {
						if (responseJson.status.code == "500") {
							console.log('\nError: '+ responseJson.status.code)
							res.statusCode="500";
							res.send('{ "name": "' + encodeURIComponent(responseJson.status.name) + '", ' +
								'"description": "' + encodeURIComponent(responseJson.status.description) + '", ' +
								'"message": "' + encodeURIComponent(responseJson.message) + '" }');
						} else {
							console.log('\n: '+ responseJson.status.code)
							//res.statusCode = responseJson.status.code;
							res.send(response.body); // res.send(JSON.stringify(response.body));
						}
					} else {
				//        console.log('\nSend with headers: '+ JSON.stringify(res.headers));
				//res.setEncoding('utf8');
				//res.setContentType('application/json');
				//res.contentType="application/json";
						res.contentType('application/json;charset=utf-8');
						res.send(response.body); // res.send(JSON.stringify(response.body));
					}
*/
				}
				//if(response.statusCode == 201){
				//  console.log('document saved as: http://mikeal.iriscouch.com/testjs/'+ rand)
				//} else {
				//  console.log('error: '+ response.statusCode)
				//  console.log(body)
				//}
				var d = new Date();
				console.log('\n\n%d-%d-%d/%d:%d:%d.%d End of POST. callback  ==============================================\n\n',d.getFullYear(),d.getMonth()+1,d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds());
			}
		);


//		console.log(document);
//		res.send(document);

		return result;
	},


	testInsertObservation: function(req, res, query, param) {
		/*
		** Insert observation data from IoT specific into SOS database
   	 	*/

		var resultOutput;

		var _param = this.testCreateObservationInternal(req, res, query, param);
		//console.log('testInsertObservation _param.object: ' + _param.object);

		_param.documentName 		= 'sosInsertObservation';
		var name 		= _param.documentName;
		var root 		= {};
		root[name]		= {};

		//var omOM_ObservationCollection = this.initOmObservationCollection(root[name], param);

//		var omOM_Observation = this.initOmObservation(param.object.omOM_Observation, param);

		var transaction = {};
		transaction.transaction = {};

		transaction.transaction.attributes = {
					  "service": "SOS"
					, "version": "2.0.0"
		};


		transaction.transaction.sosOffering 	= _param.object.sosOffering;
		transaction.transaction.sosObservation	= _param.object.sosObservation;

		var nsAttributes = this.setOmNameSpaces();
		for (var key in nsAttributes) {
			transaction.transaction.attributes[key] = nsAttributes[key];
		}

//
//		if (name == "omOM_ObservationCollection") this.initOmObservationCollection(root[name], param);
//
//			return root;


		if (query.format == 'json') {
			res.contentType('application/json');
			resultOutput = JSON.stringify(transaction.transaction);
		} else {
			res.contentType('text/xml');
			//var _object = {};
			root[name] = transaction.transaction;
			resultOutput = '<?xml version="1.0" encoding="UTF-8"?>' + openIodXmlBuilder.buildXml(root, transaction.transaction);
		}

		return resultOutput;

	},




	testInsertSensor: function(req, res, query, param, self) {
		/*
		** Insert sensor data from IoT specific into SOS database
   	 	*/

		var resultOutput;
		var _param;

		if (param.object) {
			_param = param;
		} else {
			_param = this.testCreateSensorInternal(req, res, query, param);
			//console.log(_param);
		}

		_param.documentName 		= 'swesInsertSensor';
		var name 		= _param.documentName;
		var root 		= {};
		root[name]		= {};


		var transaction = {};
		transaction.transaction = {
//			"sosInsertSensor": {
				"attributes": {
					  "service": "SOS"
					, "version": "2.0.0"
				}
		};

		//console.log(transaction.transaction);


		// procedure
		transaction.transaction.swesProcedureDescriptionFormat 	= "http://www.opengis.net/sensorML/1.0.1";
		transaction.transaction.swesProcedureDescription 		= _param.object.procedure;
		// observable properties
		transaction.transaction.swesObservableProperties 		= _param.object.observableProperties;
		// metadata
		transaction.transaction.swesMetadata 					= _param.object.metadata;


		var nsAttributes = this.setSmlNameSpaces();
		//console.log(transaction.transaction);

		for (var key in nsAttributes) {
			transaction.transaction.attributes[key] = nsAttributes[key];
		}

		if (query.format == 'json') {
			res.contentType('application/json');
			resultOutput = JSON.stringify(transaction.transaction);
			} else {
			res.contentType('text/xml');
			//var _object = {};
			root[name] = transaction.transaction;
			resultOutput = '<?xml version="1.0" encoding="UTF-8"?>' + openIodXmlBuilder.buildXml(root, _param);
		}

		return resultOutput;

	},




	testTransformObservation: function(req, res, query, param) {
	/*
	** Transforming observation data from IoT specific into O&M or alike, json or xml
    */

	var resultOutput;

	var _param = this.testCreateObservationInternal(req, res, query, param);


	var name 		= 'testobject';
	var root 		= {};
	root[name]		= {};

//	var omOM_ObservationCollection = this.initOmObservationCollection(root[name], param);
//	omOM_ObservationCollection.attributes = this.setOmNameSpaces();

	var omOM_Observation = this.initOmObservation(param.object.omOM_Observation, param);

//
//	if (name == "omOM_ObservationCollection") this.initOmObservationCollection(root[name], param);
//
//		return root;


	if (query.format == 'json') {
		res.contentType('application/json');
		resultOutput = JSON.stringify(omOM_Observation);
	} else {
		res.contentType('text/xml');
		//var _object = {};
		root[name] = omOM_Observation;
		resultOutput = openIodXmlBuilder.buildXml(root, param);
	}

 	//return(resultOutput);
	res.send(resultOutput);

	},




//=================================================== SML section



	testTransformSml: function(req, res, query, param, self) {
		/*
		** Transforming sensor (meta) data from IoT specific into SensorML or alike, json or xml
		*/

		var resultOutput;


		//	param.srsName 		= 'urn:ogc:def:crs:EPSG::4326';
		//	param.objectType  	= 'smlPhysicalComponent';
		//	param.objectId		= 'urn:aaa:bbbbb:21';
		//
		//	param.object  = {

		var _param = this.testCreateSensorInternal(req, res, query, param);
		//console.log('testTransformSml _param: ' + _param);
		//console.log('testTransformSml _param.object: ' + _param.object);

/*
		if (query.objectid) query.objectId = query.objectid;

		if (localObjects[query.objectId]) {
			param.object = localObjects[query.objectId];
		} else {
			resultOutput = '';
			errorResult(res, errorMessages.NOOBJECTID);
			console.log(query.objectId);
			console.log(localObjects);
			return;
		};
*/


		_param.documentName = _param.object.objectType; //'smlPhysicalComponent', 'smlPhysicalSystem';
		var name 		= _param.documentName;
		console.log('Objecttype: ' + _param.documentName);
		var root 		= {};
		root[name]		= {};

		var transaction = {};

		//console.log('Transaction: '+transaction.transaction);

		transaction.transaction = _param.object;
//		transaction.transaction.smlCharacteristics = _param.object.smlCharacteristics;
//		transaction.transaction.smlCapabilities = _param.object.smlCapabilities;
//		transaction.transaction.smlInputs = _param.object.smlInputs;
//		transaction.transaction.smlOutputs = _param.object.smlOutputs;


		transaction.transaction.attributes = {
					  "service": "SOS"
					, "version": "2.0.0"
		};

//		var smlPhysicalComponent = this.initSmlPhysicalComponent(root[name], _param);
//		smlPhysicalComponent.attributes = this.setSmlNameSpaces();
		var nsAttributes = this.setSmlNameSpaces();
		//console.log(transaction.transaction);

		for (var key in nsAttributes) {
			transaction.transaction.attributes[key] = nsAttributes[key];
		}


		//
		//	if (name == "omOM_ObservationCollection") this.initOmObservationCollection(root[name], param);
		//
		//		return root;


		if (query.format == 'json') {
			res.contentType('application/json');
			resultOutput = JSON.stringify(transaction.transaction);
		} else {
			res.contentType('text/xml');
			//var _object = {};
			root[name] = transaction.transaction;
			resultOutput = '<?xml version="1.0" encoding="UTF-8"?>' + openIodXmlBuilder.buildXml(root, transaction.transaction);
		}

	 	//return(resultOutput);
		res.send(resultOutput);

	}




} // end of module.exports
