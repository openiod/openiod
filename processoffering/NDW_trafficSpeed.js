 
/**
 * This module build xml from javascript objects 
 * @module openiod-xmlbuilder
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

var fs 			= require('fs');
//var ftp 		= require('ftp');
var url			= require('url');
//var zlib 		= require('zlib');
//var sax 		= require('sax'),
//  strict = true, // set to false for html-mode
//  saxParser = sax.parser(strict);
var openIodMongoDb 					= require('./../openiod-mongodb');
openIodMongoDb.init('openiod', null);



console.log('Module ' + 'NDW_trafficSpeed.js' + ' executed');

module.exports = {

init: function(req, res, query) {

	var self = this;

	console.log('Module ' + 'NDW_trafficSpeed.js' + ' init() executed');
	
	this.getTrafficSpeed(req, res, query);

},


getTrafficSpeed: function( req, res, query) {
	console.log('getTrafficSpeed %s %s %s', query.location, query.valueType, query.maxRetrievedDate);
	openIodMongoDb.getTrafficSpeed({ "location": query.location, "valueType": query.valueType, "maxRetrievedDate": query.maxRetrievedDate }, function(result) {
		res.contentType('application/json');
		res.header('Access-Control-Allow-Origin', '*');
		var resultJson = JSON.stringify(result);
 		res.send(resultJson);	
	} );
}






} // end of module.exports
