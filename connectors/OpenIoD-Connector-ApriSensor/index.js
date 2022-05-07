
/**
 * OpenIoD module for connecting ApriSensor data 
 *
 * @param  {String} ##todo 
 * @return {String}
 */
 
 "use strict";

var request = require('request');

var openIodConnector_ApriSensor_PG				= require('./postgres');	

var localModelFolders 	= [];
var models 				= {};


module.exports = {

	getApriSensorConfig: function (featureOfInterest, param, callback) {
		openIodConnector_ApriSensor_PG.getApriSensorConfig(featureOfInterest, param, callback);
	},
	
	insertApriSensorConfig: function (featureOfInterest, param, callback) {
		openIodConnector_ApriSensor_PG.insertApriSensorConfig(featureOfInterest, param, callback);
	}

};




