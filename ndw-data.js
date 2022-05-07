/*
** Module: ndw-data.js
**   Triggered by crontab openioddata-get-cron.sh every 10 minutes
**		Updates MongoDB with new trafficSpeed data
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
//var express 			= require('express');
//var cookieParser 		= require('cookie-parser');
//var session 			= require('express-session');
//var uid 				= require('uid-safe');
////var bodyParser 		= require('connect-busboy');
//var fs 					= require('fs');
//var xml2js 				= require('xml2js');
var _systemCode 		= openIoDConfig.getSystemCode();
var _systemFolderParent	= openIoDConfig.getSystemFolderParent();
var _systemFolder		= openIoDConfig.getSystemFolder();
var _systemListenPort	= openIoDConfig.getSystemListenPort();

//var _server = 'openiod.com';
var _server = '149.210.201.210:4000';

// request for new NDW trafficSpeed data
//var url = 'http://'+_server+'/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=NDW_trafficSpeed_import&format=json&url=ftp://83.247.110.3/trafficspeed.gz';
var url = 'http://'+_server+'/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=NDW_trafficSpeed_import&format=json&url=http://opendata.ndw.nu/trafficspeed.xml.gz';
request(url, function (error, response, body) {
	if (error) {
		console.log('Error: %s ; Body: %s', error, body);
	} else {
		console.log(body); // Log the HTML response
		updateTrafficSpeedData();
	}
})

// Update traffiSpeed data from imported data
var updateTrafficSpeedData = function() {
	// request for new NDW trafficSpeed data
	console.log('Removing import collection');
	var url = 'http://'+_server+'/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=NDW_trafficSpeed_update&format=json';
	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body); // Log the HTML response
			console.log('Removing import collection completed');
		} else {
			console.log('Error: %s ; Body: %s', error, body);
		}
	})
};

