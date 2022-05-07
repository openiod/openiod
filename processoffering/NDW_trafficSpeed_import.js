 
/**
 * This module build xml from javascript objects 
 * @module openiod-xmlbuilder
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

var fs 			= require('fs');
var request 	= require('request');
var ftp 		= require('ftp');
var url			= require('url');
var zlib 		= require('zlib');
var sax 		= require('sax'),
  strict = true, // set to false for html-mode
  saxParser = sax.parser(strict);
var openIodMongoDb 					= require('./../openiod-mongodb');


//var selectedSites = {};
//selectedSites["GEO01_SRETI23"]=true;
//selectedSites["GEO01_SRETI23r"]=true;



console.log('Module ' + 'NDW_trafficSpeed_import.js' + ' executed');

module.exports = {

init: function(req, res, query) {

	var self = this;

	console.log('Module ' + 'NDW_trafficSpeed_import.js' + ' init() executed');
	
//	res.contentType('text/html');
//	var html = 'NDW_trafficSpeed_import processing ftp and parsing started as a batch process';
//	res.send(html);


	/* ftp and gunzip already executed, just read resulting file and process */
	
		var _url = url.parse(query.url);
		if (_url.post == null) {
			if (_url.protocol == 'ftp:') {
					_url.port	= 21; 
			} else 	_url.port	= 80;
		};	
		//_url.path='/';
		console.log('url: ' + _url.post + ' ' + _url.protocol + ' ' + _url.hostname + ' ' + _url.port + ' ' + _url.path );
		
		var element = {};
		element.name= _url.path.substr(1);
//		console.log('ftp server on:ready for file: %s', element.name );
		
		var _length = element.name.length;
		//console.log(_length);
		var tempFileName = "./" + element.name.substr(0,_length-3);  // excl. ".gz"
		
		console.log(tempFileName);

		console.log('Remove import from previous run');
		
		console.log('Init MongoDB connection');
		openIodMongoDb.init('openiod', null, function() {


//		openIodMongoDb.removeCollectionRecord('NDW_trafficSpeed_import', {}, function() {
		openIodMongoDb.dropCollection('NDW_trafficSpeed_import', {}, function() {
			console.log('Import from previous run removed');
			console.log('Start reading stream from recieved unzipped file');

			var readStream = fs.createReadStream(tempFileName);
//			console.log('Unzip file');
//			var tempFileNameUnzip = tempFileName+"unzip";
//			var writeStreamUnzip = fs.createWriteStream(tempFileNameUnzip);
//			// This is here incase any errors occur
//  			writeStreamUnzip.on('error', function (err) {
//   	 			console.log(err);
//  			});
		
//			readStream.on('end', function (err) {
//   		 		console.log('readStream end and unzipped');
   		 		console.log('Start sax xml parsing');
				self.saxStreaming(tempFileName, function() {
					res.contentType('text/html');
					console.log('NDW_trafficSpeed_import parsing ready');
					var html = 'NDW_trafficSpeed_import parsing ready';
 					res.send(html);
				} )
  			//});

//			readStream.pipe(zlib.createGunzip()).pipe(writeStreamUnzip);
		
//			writeStreamUnzip.close();
		
		
		});
		});

		return;



	this.ftpHttp(query, function(tempFileName) {

		console.log('Remove import from previous run');

//		openIodMongoDb.removeCollectionRecord('NDW_trafficSpeed_import', {}, function() {
		openIodMongoDb.dropCollection('NDW_trafficSpeed_import', {}, function() {
			console.log('Import from previous run removed');
			console.log('Start reading stream from recieved (tmp)file and unzip');

			var readStream = fs.createReadStream(tempFileName);
			console.log('Unzip file');
			var tempFileNameUnzip = tempFileName+"unzip";
			var writeStreamUnzip = fs.createWriteStream(tempFileNameUnzip);
			// This is here incase any errors occur
  			writeStreamUnzip.on('error', function (err) {
   	 			console.log(err);
  			});
		
			readStream.on('end', function (err) {
   		 		console.log('readStream end and unzipped');
   		 		console.log('Start sax xml parsing');
				self.saxStreaming(tempFileNameUnzip, function() {
					res.contentType('text/html');
					console.log('NDW_trafficSpeed_import ftphttp and parsing ready');
					var html = 'NDW_trafficSpeed_import ftphttp and parsing ready';
 					res.send(html);
				} )
  			});

			readStream.pipe(zlib.createGunzip()).pipe(writeStreamUnzip);
		
//			writeStreamUnzip.close();
		
		
		});
		
		}
	);
},



ftpHttp: function (query, callback) {
	
		var _url = url.parse(query.url);
		if (_url.post == null) {
			if (_url.protocol == 'ftp:') {
					_url.port	= 21; 
			} else 	_url.port	= 80;
		};	
		//_url.path='/';
		console.log('url: ' + _url.post + ' ' + _url.protocol + ' ' + _url.hostname + ' ' + _url.port + ' ' + _url.path );
		
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
		
		if (_url.protocol == 'http:') {
			console.log('http request: ' + _url.href);

			this.streamNdwFile(query.url, element.name, writeStream, false, function () {
				console.log('HTTP connection end');
				writeStream.close();
				callback(tempFileName);
       		});

		}

},


saxStreaming: function (tempFileNameUnzip,  callback) {

		var recordCountIn 	= 0;
		var recordCountOut 	= 0;
		
				var recordObjects = {};
				recordObjects.initialRecordObject	= {};
				recordObjects.mergeRecordObject		= {};
				recordObjects.newRecordObject		= {};
				var elementObjectStack = [];
				
				function m(a,b,c){for(c in b)b.hasOwnProperty(c)&&((typeof a[c])[0]=='o'?m(a[c],b[c]):a[c]=b[c])};
		
		var action = {   xml: { 
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
						  	//	var skip = true;
						  	//	if (selectedSites[element.attributes.id]==true) {
							//		skip = false;
							//	};
								return {recordObjectId: { _id: { recordId: element.attributes.id } } }; //, skip:skip
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
					//console.log('Recordkey: %s', recordObject._id.recordId);
				}
			  }
		  };


		var readStream = fs.createReadStream(tempFileNameUnzip);
		console.log('saxStream');

		
	
//							if (action.xml) {
								// stream usage
								// takes the same options as the parser
								var saxStream = require("sax").createStream(strict, {trim:true} );
								saxStream.on("error", function (e) {
  									// unhandled errors will throw, since this is a proper node
  									// event emitter.
  									console.error("error on saxstream! %s", e);
  									// clear the error
  									//this._parser.error = null;
  									//this._parser.resume();
								});

								saxStream.on("end", function() {
									console.log('End    items processed: %s (%s)', recordCountIn, recordCountOut);
									callback();
									
								});
								
								saxStream.on("opentag", function (node) {
								
									var recordObjectElement = false;
  									// same object as above
									if (action.xml && action.xml.keyElement && action.xml.keyElement[node.name] && action.xml.keyElement[node.name].onOpenTag && action.xml.keyElement[node.name].onOpenTag.action ) {
										var _actionFunction = action.xml.keyElement[node.name].onOpenTag.action;
										
										
										if (_actionFunction.constructor === Function) { // action is function??
											//if ( i<10 ) {
												var openTagActionResult = _actionFunction(node);
												if (openTagActionResult.initialRecordObject) {
													recordObjects.initialRecordObject = openTagActionResult.initialRecordObject;
													//console.log('InitialRecord: ' + JSON.stringify(recordObjects.initialRecordObject) );
												}
												if (openTagActionResult.recordObject) {
													elementObjectStack = [];
													// add to element stack
													var firstStackItem = {};
													//console.log('add stack record: ' + node.name );
													firstStackItem.node = node;
													firstStackItem.newNode = node;
													//firstStackItem.newNode.elements=[];
													elementObjectStack.push(firstStackItem);
													recordObjectElement = true;
													
													recordObjects.newRecordObject = recordObjects.initialRecordObject;
													m(recordObjects.newRecordObject, openTagActionResult.recordObject);
//													console.log('Result: ' + JSON.stringify(recordObjects.newRecordObject) );
//													action.mongodb.saveFunction(recordObjects.newRecordObject);	

									//				i++;
									//				
									//				if (i>2) {
									//					throw new Error("Test stack open: ");
									//				}
												}
												if (openTagActionResult.recordObjectId) {
													m(recordObjects.newRecordObject, openTagActionResult.recordObjectId);
												}

			//									console.log('Node key: ' + node.name + ' ' + node.attributes.id );
											//}
										}
																												
										
									} else {

										if ( recordObjects.newRecordObject != {} ) {
											//console.log('subelement: ' + node.name );
											//recordObjects.newRecordObject[node.name]={};
										}
									}
					
								//	console.log('add stack?: ' + node.name + '(' + elementObjectStack.length + ')'  );
									if (elementObjectStack.length > 0 && recordObjectElement == false ) {
										// add to element stack
										//console.log('add stack: ' + node.name + '(' + elementObjectStack.length + ')'  );
										var stackItem = {};
										stackItem.node = node;
										//stackItem.newNode = node;
										stackItem.newNode = {};
										for (var key in node ) {
											if (key == 'attributes') {
											 	if (testEmpty(node[key])==false ) {
													stackItem.newNode[key] = node[key] ;
												}	
											} else {
												stackItem.newNode[key] = node[key] ;
											}	
							//				console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxx  geen attributes');
										}
							//				console.log('yyyyyyyyyyyyyyyyyyyyyyyyyyy  wel  attributes: ' + JSON.stringify(stackItem.newNode.attributes) );
							//				for (var key in stackItem.newNode.attributes ) {
							//					console.log( 'Node key: ' + key + ' ' + stackItem.newNode.attributes[key] );
							//				}
							//			}
											
										elementObjectStack.push(stackItem);	
									}
									
									
								})
								
								var testEmpty = function(data){
									var count = 0;
  									for(var i in data) {
										if(data.hasOwnProperty(i)) {
      										count ++;
										}
  									}
  									return count == 0;
								}

								saxStream.on("text", function (text) {
									if (elementObjectStack.length > 0) {
	  									var elementStackItemIndex 	= elementObjectStack.length-1;
										elementObjectStack[elementStackItemIndex].node.text 	= text;
										elementObjectStack[elementStackItemIndex].newNode.text	= text;
										//console.log('Element text: ' + text);
									}	
								})
								
								saxStream.on("closetag", function (nodeName) {
									//console.log('xxxxxxx Node key: ' + nodeName + action.xml.keyElement[nodeName] );


									if (elementObjectStack.length > 1) {  // add element to parent in stack)
										var childStackItemIndex 	= elementObjectStack.length-1;
										var parentStackItemIndex 	= childStackItemIndex-1;
										var childElement 			= elementObjectStack[childStackItemIndex].newNode;
										var parentElement 			= elementObjectStack[parentStackItemIndex].newNode;
										if (parentElement.elements==undefined) parentElement.elements=[];
										elementObjectStack[parentStackItemIndex].newNode.elements.push(childElement);
										
									}

									if (elementObjectStack.length == 1) {
										recordObjects.newRecordObject.elements = elementObjectStack[0].newNode.elements;
									}

									if (action.xml && action.xml.keyElement && action.xml.keyElement[nodeName] && action.xml.keyElement[nodeName].onCloseTag && action.xml.keyElement[nodeName].onCloseTag.action ) {
										//console.log('yyyyyyyyyyy Node key: ' + nodeName + ' ' + action.xml.keyElement[nodeName].onCloseTag );
										var _actionFunction = action.xml.keyElement[nodeName].onCloseTag.action;
										if (_actionFunction.constructor === Function) { // action is function??
											//var _actionFunction = action.xml.keyElement[node.name];
											//if (_actionFunction) { // action is function??
								//			if ( j<10 ) {
												var closeTagActionResult = _actionFunction(nodeName, recordObjects.newRecordObject, elementObjectStack);

												recordCountIn++;

												if (closeTagActionResult.saveRecordObject) {
//													recordObjects.newRecordObject = recordObjects.initialRecordObject;
//													console.log('NewMergeRecord: ' + JSON.stringify(elementObjectStack[0]) );
//													m(recordObjects.newRecordObject, elementObjectStack[0]);
													
							//						if(recordObjects.newRecordObject.skip==true) { 
														//skip records when not in selected regions
							//						} else {
														action.database.saveFunction(recordObjects.newRecordObject);
														recordCountOut++;

														
							//						}
													//console.log('Result: ' + JSON.stringify(recordObjects.newRecordObject) );
												}

												if (recordCountIn%1000==0) {
													console.log('       items processed: %s (%s)', recordCountIn, recordCountOut);
												}
													
												if (closeTagActionResult.recordObject) {
													//console.log('Result after closetag: ' + JSON.stringify(recordObjects.newRecordObject) );
													elementObjectStack = [];
													recordObjects.newRecordObject = {};
												}

												//console.log('Node key: ' + nodeName  );
												//for (var key in node ) {
												//	console.log( 'Node key: ' + key + ' ' + node[key] );
												//}
												//j++;
								//			}
										}
									}
									

							
									// remove from element stack
									if (elementObjectStack.length > 0) {
										//console.log('Stacklength: ' + elementObjectStack.length);
										//console.log('remove stack: ' + nodeName );
										var lastStackItemIndex = elementObjectStack.length-1;
										if (elementObjectStack[lastStackItemIndex].node.name != nodeName ) {
											
											console.log('ERROR in elemnt stack for element: ' + nodeName + ' (stackelement: ' + elementObjectStack[lastStackItemIndex].node.name + ')');
											throw new Error("Invalid stack: ");
										}
										elementObjectStack.pop();
									} 		
							//		if (j>5) {
							//			throw new Error("Test stack: ");
							//		}				
									
							});		

		readStream.pipe(saxStream);


									
	},

			
streamNdwFile: function (url, fileName, writeStream, unzip, callback ) {
	
		var self = this;
		
		var _wfsResult=null;
		console.log("Request start: " + " (" + url + ")");

		var outFile;

		function StreamBuffer(req) {
  			var self = this

  			var buffer = []
  			var ended  = false
  			var ondata = null
  			var onend  = null

  			self.ondata = function(f) {
    			//console.log("self.ondata")
    			for(var i = 0; i < buffer.length; i++ ) {
      				f(buffer[i])
      			//	console.log(i);
    			}
    			//console.log(f);
    			ondata = f
  			}

  			self.onend = function(f) {
    			onend = f
    			if( ended ) {
      				onend()
    			}
  			}
			
			req.pipe(writeStream);

  			req.on('data', function(chunk) {
    			// console.log("req.on data: ");
    			if (_wfsResult) {
      				_wfsResult += chunk;
    			} else {
      				_wfsResult = chunk;
    			}

    			if( ondata ) {
      				ondata(chunk)
    			} else {
      				buffer.push(chunk)
    			}
  			})

  			req.on('end', function() {
    			//console.log("req.on end")
    			ended = true;

	    		if( onend ) {
   		   			onend()
    			}
  			})        
 
  			req.streambuffer = self
		}

		function writeFile(path, fileName, content) {
  			fs.writeFile(path + fileName, content, function(err) {
    			if(err) {
      				console.log(err);
    			} else {
      				console.log("The file is saved! " + tmpFolder + fileName + ' (unzip:' + unzip + ')');
					if (unzip) {
						var exec = require('child_process').exec;
						var puts = function(error, stdout, stderr) { sys.puts(stdout) }
						exec(" cd " + tmpFolder + " ;  unzip -o " + tmpFolder + fileName + " ", puts);
					}
    			}
  			});	 
		}
	
		
		

  		new StreamBuffer(request.get( { url: url }, function(error, response) {
			console.log("Request completed ");
			//var currDate = new Date();
			//var iso8601 = currDate.toISOString();
			
			//var cqlFile = createCql(_wfsResult, featureOfInterest, param, callback);			
			//writeFile()
			callback();	

			//	writeFile(tmpFolder, fileName, iso8601 + ' ' + cqlFile);
			//	writeFile(tmpFolder, fileName, cqlFile);


			
			
			})
  		);

	} 
	




} // end of module.exports
