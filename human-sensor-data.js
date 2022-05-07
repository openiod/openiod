/*
** Module: human-sensor-data.js
**   Triggered by crontab openiod-human-sensor-date-get-cron.sh every .. minutes
**		Updates MongoDB with new sos data
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
var fs 					= require('fs');
//var xml2js 				= require('xml2js');
var sax 		= require('sax'),
  strict = true, // set to false for html-mode
  saxParser = sax.parser(strict);
var openIodMongoDb 		= require('./openiod-mongodb');
openIodMongoDb.init('openiod', null);  

var _systemCode 		= openIoDConfig.getSystemCode();
var _systemFolderParent	= openIoDConfig.getSystemFolderParent();
var _systemFolder		= openIoDConfig.getSystemFolder();
var _systemListenPort	= openIoDConfig.getSystemListenPort();

var foiArray;

//var _server = 'openiod.com';
var _server = '149.210.201.210:4000';

// request for human-sensor data
var url = 'http://'+_server+'/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=transform_observation&inputformat=getobservation&objectid=humansensor&format=xml';

/*
request(url, function (error, response, body) {
	if (error) {
		console.log('Error: %s ; Body: %s', error, body);
	} else {
		//console.log(body); // Log the HTML response
		saxStreaming(body);
	}
})
*/


var saxStreaming	= function () {

	var recordCountIn 	= 0;
	var recordCountOut 	= 0;
		
	var recordObjects = {};
	recordObjects.initialRecordObject	= {};
	recordObjects.mergeRecordObject		= {};
	recordObjects.newRecordObject		= {};
	var elementObjectStack = [];
	
	
	var featureOfInterests	= {}; 
	
	var _observedProperty	= '';
	var _featureOfInterest	= '';
	var _resultValues		= '';
	
	
				
	function m(a,b,c){for(c in b)b.hasOwnProperty(c)&&((typeof a[c])[0]=='o'?m(a[c],b[c]):a[c]=b[c])};
		
	var action = {  
		xml: { 
			keyElement: { 
				'sos:GetObservationResponse': { 
					onOpenTag: {
					  action: function(element) { 
							//console.log('ObservationData: ' + element.attributes.id + ' onOpenTag' ); 
							return {initialRecordObject: { _id: { siteTableId : element.attributes.id + '_' + element.attributes.version} }};
						}
					},
					onCloseTag: {
					  action: function(elementName, record, stack) { 
							var result = {saveRecordObject: { } };  //trigger for saveCollection
							return result;
						}
					}
				},
				'om:observedProperty': {
					onOpenTag: {
					  action: function(element) { 
							//console.log('SiteRecord: ' + element.attributes.id + ' onOpenTag' ); 
							_observedProperty = element.attributes['xlink:href'];
							//console.log(_observedProperty);
							return {recordObject: {},
									recordObjectId: { _id: { recordId: element.attributes.id } }  };
						}
					},
					onCloseTag: {
					  action: function(elementName, record, stack) { 
							//console.log('Dit is siteRecord' + elementName + ' onCloseTag' ); 
							var result = {}; //{saveRecordObject: { } };  //trigger for saveCollection
							return result;
						}
					}
				},
				'om:featureOfInterest': {
					onOpenTag: {
					  action: function(element) { 
							//console.log('SiteRecord: ' + element.attributes.id + ' onOpenTag' ); 
							_featureOfInterest = element.attributes['xlink:href'];
							//console.log(_featureOfInterest);
							return {recordObject: {},
									recordObjectId: { _id: { recordId: element.attributes.id } }  };
						}
					},
					onCloseTag: {
					  action: function(elementName, record, stack) { 
							//console.log('Dit is siteRecord' + elementName + ' onCloseTag' ); 
							var result = {}; //{saveRecordObject: { } };  //trigger for saveCollection
							return result;
						}
					}
				},
				'ns:values': {
					onOpenTag: {
					  action: function(element) { 
							//console.log('SiteRecord: ' + element.attributes.id + ' onOpenTag' ); 
							//_resultValues = element.text;
							//console.log(_resultValues);
							return {recordObject: {},
									recordObjectId: { _id: { recordId: element.attributes.id } }  };
						}
					},
					onCloseTag: {
					  action: function(elementName, record, stack) { 
					  		_resultValues = stack[0].node.text; 
							//console.log(_resultValues);
							var foiTitle	= _featureOfInterest.substr(_featureOfInterest.lastIndexOf('/')+1); 
							if (featureOfInterests[foiTitle] == undefined) {
								featureOfInterests[foiTitle] = {};
							}
							var _foi = featureOfInterests[foiTitle];
							var opTitle	= _observedProperty.substr(_observedProperty.lastIndexOf('/')+1);
							if (_foi[opTitle] == undefined) {
								_foi[opTitle] 		= {};
							}
							var _op	= _foi[opTitle];
							var _resultValueArray	= _resultValues.split('@@');
							for (var i=0;i<_resultValueArray.length;i++) {
								var _categoryValue	= _resultValueArray[i].split(',')[1];
								if (_op[_categoryValue] == undefined) {
									_op[_categoryValue] = 0;
								}
								_op[_categoryValue] += 1;
								//console.log(_categoryValue + ' ' + _op[_categoryValue]);
							}
							
							
							//console.log('Dit is siteRecord' + elementName + ' onCloseTag' ); 
							var result = {}; //{saveRecordObject: { } };  //trigger for saveCollection
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
			
				recordObject = {};
				recordObject.featureOfInterests	= featureOfInterests;
				
				//console.log(recordObject);
			
				openIodMongoDb.saveCollectionRecord('humansensor24h', recordObject, function() {openIodMongoDb.closeDb();} );
				
				

			}
		}
	};


//	var readStream = fs.createReadStream(xmlDoc);
//	console.log('saxStream');
		
//	if (action.xml) {
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
			//callback();
			
			return;
			
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

		//console.log('start url and pipe');
		request(url).pipe(saxStream);
		
		//console.log('after pipe');
		//request(url).pipe(fs.createWriteStream('doodle.xml'));
		//readStream.pipe(saxStream);
								
	}
	
	
saxStreaming();

//console.log('end of procedure');


