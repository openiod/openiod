 
/**
 * This module build xml from javascript objects 
 * @module openiod-xmlbuilder
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

var fs 			= require('fs');
var ftp 		= require('ftp');
var url			= require('url');

console.log('Module ' + 'ftp.js' + ' executed');

var BPMN_process			= {};

// BPMN Categories
BPMN_process.flowObjects		= {};			// main graphical elements
var BPMN_data				= {};
var BPMN_connectingObjects	= {};
var BPMN_swimlanes			= {};
var BPMN_artifacts			= {};

BPMN_process.flowObjects.events			= {};
BPMN_process.flowObjects.activities		= {};  // activity / task (service, send, receive, user, manual, business rule, script, global)
BPMN_process.flowObjects.gateways		= {};

BPMN_data.dataObjects			= {};						// dataObjectReferences for states  eg dataObject[dataObjectState]
BPMN_data.inputOutputSpecification	= {};					// InputOutputSpecification class describes data requirements
BPMN_data.inputOutputSpecification.inputSets			= []; // collection of dataInput elements
BPMN_data.inputOutputSpecification.outputSets			= [];
BPMN_data.inputOutputSpecification.dataInputs			= []; // required input data to start task (optional==true)
// dataInput={};
// dataInput.name;
// dataInput.inputSetRefs;
// dataInput.isCollection;
BPMN_data.inputOutputSpecification.dataOutputs			= []; // required output data to end task
BPMN_data.dataStores			= {};

BPMN_connectingObjects.sequenceFlows	= {};
BPMN_connectingObjects.messageFlows		= {};
BPMN_connectingObjects.associations		= {};
BPMN_connectingObjects.dataAssociations	= {};

BPMN_swimlanes.pools			= {};
BPMN_swimlanes.lanes			= {};

BPMN_artifacts.group			= {};
BPMN_artifacts.textAnnotation	= {};

module.exports = {

init: function(req, res, params) {

	var self = this;

	console.log('Module ' + 'NDW_trafficSpeed_import.js' + ' init() executed');
	
	this.ftp(params, function(tempFileName) {
		var readStream = fs.createReadStream(tempFileName);
		console.log('Unzip file');
		var tempFileNameUnzip = tempFileName+"unzip";
		var writeStreamUnzip = fs.createWriteStream(tempFileNameUnzip);
		// This is here incase any errors occur
  		writeStreamUnzip.on('error', function (err) {
    		console.log(err);
  		});
		
		}
	);
},


ftp: function (query, callback) {
	
		var _url = url.parse(query.url);
		if (_url.post == null) _url.port=21; 
		//_url.path='/';
		console.log('url: ' + _url.hostname + ' ' + _url.port + ' ' + _url.path );
		
		var element = {};
		element.name= _url.path.substr(1);
//		console.log('ftp server on:ready for file: %s', element.name );
		
		var tempFileName = "./" + element.name;
		var writeStream = fs.createWriteStream(tempFileName);
		// This is here incase any errors occur
  		writeStream.on('error', function (err) {
    		console.log(err);
  		});
		
		if (_url.protocol == 'ftp:') {
			console.log('Ftp request: ' + _url.href);

			var files = [];

			var conn = new ftp();

			conn.on('ready', function () {
				
				conn.get(element.name, function (err, stream) {
					//console.log('download file callback ' + element.name);
					var i=0, j=0;
					var elementObjectStack = [];
					if (err) throw err;
					stream.once('close', function () {
						console.log('FTP connection end');
                   		conn.end();
						writeStream.close();
						callback(tempFileName);
               		});
					stream.pipe(writeStream);

				});
			});
			
			var _host = "83.247.110.3";
			var _port = "21";
			console.log('FTP connect to: %s:%s', _host, _port );
			conn.connect( { host:_host, port:_port });
			
		}

}


} // end of module.exports
