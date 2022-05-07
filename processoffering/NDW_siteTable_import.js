 
/**
 * This module build xml from javascript objects 
 * @module openiod-xmlbuilder
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

var fs 			= require('fs');
var ftp 		= require('ftp');
var url			= require('url');
var zlib 		= require('zlib');
var sax 		= require('sax'),
  strict = true, // set to false for html-mode
  saxParser = sax.parser(strict);
var openIodMongoDb 					= require('./../openiod-mongodb');
openIodMongoDb.init('openiod', null);



console.log('Module ' + 'NDW_siteTable_import.js' + ' executed');

module.exports = {

init: function(req, res, query) {

	var self = this;

	console.log('Module ' + 'NDW_siteTable_import.js' + ' init() executed');
	
	this.ftp(query, function(tempFileName) {
		var readStream = fs.createReadStream(tempFileName);
		console.log('Unzip file');
		var tempFileNameUnzip = tempFileName+"unzip";
		var writeStreamUnzip = fs.createWriteStream(tempFileNameUnzip);
		// This is here incase any errors occur
  		writeStreamUnzip.on('error', function (err) {
    		console.log(err);
  		});
		
		readStream.on('end', function (err) {
    		console.log('readStream end');
		self.saxStreaming(tempFileNameUnzip, function() {
			res.contentType('text/html');
			console.log('NDW_siteTable_import ftp ready');
			var html = 'NDW_siteTable_import ftp ready';
 			res.send(html);
		} )
  		});

		readStream.pipe(zlib.createGunzip()).pipe(writeStreamUnzip);
		
//		writeStreamUnzip.close();
		
		
		
		
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
		
		var action = {  xml: { 
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
													
													action.database.saveFunction(recordObjects.newRecordObject);
													recordCountOut++;
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


									
	}




} // end of module.exports
