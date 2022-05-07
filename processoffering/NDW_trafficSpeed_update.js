 
/**
 * This module build xml from javascript objects 
 * @module 
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

//var fs 			= require('fs');
//var ftp 		= require('ftp');
//var url			= require('url');
//var zlib 		= require('zlib');
//var sax 		= require('sax'),
//  strict = true, // set to false for html-mode
//  saxParser = sax.parser(strict);
var openIodMongoDb 					= require('./../openiod-mongodb');
openIodMongoDb.init('openiod', null);



console.log('Module ' + 'NDW_trafficSpeed_update.js' + ' executed');

module.exports = {

init: function(req, res, query) {

	var self = this;
	
	console.log('Module ' + 'NDW_trafficSpeed_update.js' + ' init() executed');
	
	this.executeNDW_trafficSpeed_update(req, res, query);
},


// =================================================   
executeNDW_trafficSpeed_update: function( req, res, query) {

	openIodMongoDb.datex2Import2Model({collectionName: 'NDW_trafficSpeed', location: 'EHV' }, function() {} );
	res.contentType('text/html');
	var htmlFile = 'execute NDW_trafficSpeed update executed';
 	res.send(htmlFile);	
//	openIodMongoDb.removeCollectionRecord({collectionName: 'NDW_trafficSpeed', location: 'EHV' }, function() {} );
//	console.log('Module ' + 'NDW_trafficSpeed_update.js' + ' import cleaned/removed');

}




} // end of module.exports
