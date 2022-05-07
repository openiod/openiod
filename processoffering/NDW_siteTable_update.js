 
/**
 * This module build xml from javascript objects 
 * @module openiod-xmlbuilder
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



console.log('Module ' + 'NDW_siteTable_update.js' + ' executed');

module.exports = {

init: function(req, res, query) {

	var self = this;
	
	console.log('Module ' + 'NDW_siteTable_update.js' + ' init() executed');
	
	this.executeNDW_siteTable_update(req, res, query);
},


// =================================================   
executeNDW_siteTable_update: function( req, res, query) {

	openIodMongoDb.datex2Import2Model({collectionName: 'NDW_siteTable', location: 'EHV' }, function() {} );
	res.contentType('text/html');
	var htmlFile = 'execute NDW_siteTable update executed';
 	res.send(htmlFile);	

}




} // end of module.exports
