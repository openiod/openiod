
/**
 * The module transforms observations from format O&M to format OIOD (OpenIod) and vv
 * other transformations are possible eg. from and to raw sensor data
 * @module transform_observation
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

//var request 				= require('request');
var axios 				= require('axios');
var fs						= require('fs');

var pathPrefix				= './../../';

console.log('Module ' + 'transform_observation.js' + ' start');

//var openIodXmlBuilder 		= require(pathPrefix+'openiod-xmlbuilder');
//var openIodSosSensorMl 		= require(pathPrefix+'openiod-sossensorml');
//var openIodSosOm	 		= require(pathPrefix+'openiod-sosom');
//var openIodHumanSensorMd	= require(pathPrefix+'openiod-human-sensor-md');

var localObjects = [];
var openIoDConfig;

var errorMessages = {
	  NOQUERY 			: { "message": 'Query parameters missing'		, "returnCode": 501 }
	, NOSERVICE 		: { "message": 'SERVICE parameter missing'		, "returnCode": 501 }
	, NOREQUEST 		: { "message": 'REQUEST parameter missing'		, "returnCode": 501 }
	, UNKNOWNREQ 		: { "message": 'REQUEST parameter unknown'		, "returnCode": 501 }
	, UNKNOWNIDENTIFIER : { "message": 'IDENTIFIER parameter unknown'	, "returnCode": 501 }
	, URLERROR 			: { "message": 'URL incorrect'					, "returnCode": 501 }
	, NOFOI 			: { "message": 'Feature of Interest missing'	, "returnCode": 501 }
	, NOMODEL 			: { "message": 'MODEL parameter missing'		, "returnCode": 501 }
	, NOINPUTFORMAT 	: { "message": 'ACTION or INPUTFORMAT parameter missing, use inputformat=[insertom,getresult]'	, "returnCode": 501 }
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

module.exports = {

//	init: function (name, param) {
	init: function (req, res, query, param, openIoDConfig) {
		var self=this;

		self.openIoDConfig	= openIoDConfig;

		console.log('Module ' + 'transform_observation.js' + ' init()');
		this.getData(req, res, query, param, self);

	},  // end of init

	getData: function(req, res, query, param, self) {

		var _param = param;
		_param.query 	= query;

		// scapeler sensor insert observations
		// e.g.
//		http://localhost:4000/SCAPE604/openiod?identifier=transform_observation&action=insertom&observation=scapeler_shinyei:12.345

/*
    var offeringConfig	= {};
    var procedureConfig	= {};

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
*/
    var _phenomenonTime	= new Date().toISOString();
    if (query.measurementTime) {
      _phenomenonTime = query.measurementTime;
    }
    var _resultTime	= _phenomenonTime;

    var fiwareObject = {};
    fiwareObject.id=query.foi+"_"+_resultTime;
    fiwareObject.sensorId=query.foi;
    fiwareObject.type="AirQualityObserved";
    fiwareObject.sensorSystem=query.sensorsystem;
    fiwareObject.dateObserved=_resultTime;

    var _inputObservation					= query.observation;
    var _categories							= _inputObservation.split(',');

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

    }

    self.sendFiwareData(fiwareObject);

    res.send('Transaction commited. Use param &commit=false&verbose=true to return xml document');
    console.log ('Transaction ready');
	},

	sendFiwareData: function(data) {
		var _url = 'https://orion.openiod.org/v2/entities?options=keyValues';
		var json_obj = JSON.stringify(data);
    //console.dir(data)

    var fiwareService = 'as_v0'
    var fiwareServicePath = '/'
    if (data.sensorSystem=='scapeler_dylos') {
      fiwareServicePath = '/dylos'
    }

    if (data.sensorSystem=='apri-sensor-pmsa003') {
      fiwareServicePath = '/pmsa003'
    }
    if (data.sensorSystem=='apri-sensor-bme280') {
      fiwareServicePath = '/bme280'
    }
    if (data.sensorSystem=='apri-sensor-luftdaten') {
      fiwareService = 'luftdaten_v0'
      fiwareServicePath = '/sds011'
    }

    var headers ={
      'content-type': 'application/json'
      ,'fiware-service': fiwareService
      ,'fiware-servicepath': fiwareServicePath
    }
//    ,'Fiware-Service': fiwareService
//    ,'Fiware-ServicePath': fiwareServicePath
		axios.post(_url,json_obj,{headers})
    .then(function (response) {
      console.log(response.statusText+' '+response.status);
    })
    .catch(function (error) {
      console.log(headers)
      console.log(error.code+' '+error.response.statusText+' '+error.response.status);
    })
  }
} // end of module.exports
