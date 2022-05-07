 
/**
 * This module .... 
 * @module sos/GetCapabilities 
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

var openIodSosDb_pg			= require('./sos-db-pg');

console.log('Module ' + 'OpenIod-sos-pg.js' + ' executed');

// todo: see messages in OGC 06-121r3 Table 8
var errorMessages = {
	  NOQUERY 			: { "message": 'Query parameters missing'		, "returnCode": 501 }
	, NOSERVICE 		: { "message": 'SERVICE parameter missing'		, "returnCode": 501 }
	, NOREQUEST 		: { "message": 'REQUEST parameter missing'		, "returnCode": 501 }
	, UNKNOWNREQ 		: { "message": 'REQUEST parameter unknown'		, "returnCode": 501 }
	, UNKNOWNIDENTIFIER : { "message": 'IDENTIFIER parameter unknown'	, "returnCode": 501 }
	, URLERROR 			: { "message": 'URL incorrect'					, "returnCode": 501 }
	, NOFOI 			: { "message": 'Feature of Interest missing'	, "returnCode": 501 }
	, NOMODEL 			: { "message": 'MODEL parameter missing'		, "returnCode": 501 }
}

var errorResult = function(res, message) {
	res.returncode = message.returnCode;
	res.contentType('text/plain');
	res.status(message.returnCode).send(message.message);
};


// <?xml version="1.0" encoding="UTF-8"?> \
//  <wps:Capabilities service="WPS" version="1.0.0" xml:lang="en-US" xmlns:xlink="http://www.w3.org/1999/xlink" 
//    xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" 
//    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
//    xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 ../wpsGetCapabilities_response.xsd" 
//    updateSequence="1">
var xml = {
	start: '<?xml version="1.0" encoding="UTF-8"?>'
}
var sos = {
	name: 'Capabilities'
	, attr: {
		  service: 				'SOS'
		, version: 				'1.0.0'
		, 'xml:lang':			'en-US'
		, updateSequence:		'1'
	}
	, ns: {
		  'xmlns:sos': 		"http://www.opengis.net/sos/2.0"
		, 'xmlns:swes':		"http://www.opengis.net/swes/2.0" 
		, 'xmlns:xlink':	"http://www.w3.org/1999/xlink"
		, 'xmlns:gml':		"http://www.opengis.net/gml/3.2"
		  
// xsi:schemaLocation="http://www.w3.org/2003/05/soap-envelope http://www.w3.org/2003/05/soap-envelope/soap-envelope.xsd http://www.opengis.net/sos/2.0 http://schemas.opengis.net/sos/2.0/sos.xsd" 
// xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
// xmlns:wsa="http://www.w3.org/2005/08/addressing" 
// xmlns:swe="http://www.opengis.net/swe/2.0" 
// xmlns:ows="http://www.opengis.net/ows/1.1" 
// xmlns:sos="http://www.opengis.net/sos/2.0" 
// xmlns:fes="http://www.opengis.net/fes/2.0" 
// xmlns:gml="http://www.opengis.net/gml/3.2" 
// xmlns:ogc="http://www.opengis.net/ogc" 

		  

//xmlns:sos="http://www.opengis.net/sos/2.0"
//		, 'xmlns:wps':			"http://www.opengis.net/wps/1.0.0"
//		, 'xmlns:ows':			"http://www.opengis.net/ows/1.1"
//		, 'xmlns:xsi': 			"http://www.w3.org/2001/XMLSchema-instance"
//		, 'xsi:schemaLocation': "http://www.opengis.net/wps/1.0.0 ../wpsGetCapabilities_response.xsd"
	}
	, contents: {
		  'header': '<sos:contents><sos:Contents>'
		, 'footer': '</sos:Contents></sos:contents>'
	}	
}
var sosRootElements = {};

var result = {};
var _self;

module.exports = {

init: function(param) {

	_self = this;
	
	var key;
	console.log('Module ' + 'OpenIoD-sos-pg.js' + ' init() executed');
	
	sosRootElements.header = xml.start + '<' + sos.name;
	var _attrs = sos.attr;
	for ( key in _attrs) {
		sosRootElements.header += ' ' + key + '="' + _attrs[key] + '" ';
	}
	var _nss = sos.ns;
	for ( key in _nss) {
		sosRootElements.header += ' ' + key + '="' + _nss[key] + '" ';
	}
	sosRootElements.header += '> ';

	sosRootElements.footer = '</' + sos.name + '> ';
	
	
	openIodSosDb_pg.init(param);
	
	
	  
	//this.getCapabilities(req, res, query);
//	{
//		systemFolderParent: openIoDConfig.getSystemFolderParent(),
//		configParameter: 	openIoDConfig.getConfigParameter(),
//		systemCode: 		openIoDConfig.getSystemCode()
//	}
},


getCapabilities: function(req, res, query) {

	/*
	** respond with Service metadata document OGC 06-121r3 7.4.2
	
	** version			specification version for GetCapabilities response					char	mandatory
	** updateSequence	Service metadata document version. Increase when something changes.	char	[0:1]
	
	** sections:
	** ServiceIdentification	Metadata about this specific server.
	** ServiceProvider			Metadata about the organization operating this server.
	** OperationsMetadata		Metadata about the operations specified by this service and implemented by this server, 
								including the URLs for operation requests
	** Contents					Metadata about the data served by this server.
	** All						Return complete service metadata document, containing all elements
	
	*/
	res.sosResult = {};
	res.sosResult.nrOfBlocks = 0;
	

	res.sosResult.nrOfBlocks += 5;
	
	this.getAllProcDescFormat(req, res, query);
	this.getAllObservableProperties(req, res, query);
	this.getAllRelatedFeature(req, res, query);
	this.getOffering(req, res, query);
	this.getObservationTypes(req, res, query);


/*
	output += '	<swes:offering> \
						<sos:ObservationOffering> \
							<swes:identifier>http://www.my_namespace.org/water_gage_1_observations</swes:identifier>\
							<swes:procedure>http://www.my_namespace.org/sensors/Water_Gage_1</swes:procedure>\
							<swes:procedureDescriptionFormat>http://www.opengis.net/sensorML/1.0.1</swes:procedureDescriptionFormat>\
							<swes:observableProperty>http://sweet.jpl.nasa.gov/2.0/hydroSurface.owl#WaterHeight</swes:observableProperty>\
              <swes:relatedFeature>\
                <swes:FeatureRelationship>\
                  <swes:target xlink:href="http://wfs.example.org?request=getFeature&amp;featureid=Rhine_Sandbank_123"/>\
                </swes:FeatureRelationship>\
              </swes:relatedFeature>\
							<sos:observedArea>\
								<gml:Envelope srsName="http://www.opengis.net/def/crs/EPSG/0/4326">\
									<gml:lowerCorner>50.7167 7.76667</gml:lowerCorner>\
									<gml:upperCorner>53.7167 9.76667</gml:upperCorner>\
								</gml:Envelope>\
							</sos:observedArea>\
							<sos:phenomenonTime>\
								<gml:TimePeriod gml:id="phenomenonTime">\
									<gml:beginPosition>2009-01-11T16:22:25.00Z</gml:beginPosition>\
									<gml:endPosition>2010-08-21T08:32:10.00Z</gml:endPosition>\
								</gml:TimePeriod>\
							</sos:phenomenonTime>\
						</sos:ObservationOffering>\
					</swes:offering>\
					<sos:responseFormat>http://www.opengis.net/om/2.0</sos:responseFormat>\
					<sos:observationType>http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement</sos:observationType>';

*/

	
	
},

getOffering: function(req, res, query) {
	var offering = openIodSosDb_pg.getOffering(req, res, query, this.getOffering_callback);
},
getOffering_callback: function(req, res, query, err, result) {
	
	//console.log(err);
	//console.log(result);
	
	if (err == null && result.rows.length > 0) {
		res.sosResult.offering = result.rows;
	}

	_self.composeResult(req, res, query, err, result);
},

getObservationTypes: function(req, res, query) {
	var observationTypes = openIodSosDb_pg.getObservationTypes(req, res, query, this.getObservationTypes_callback);
},
getObservationTypes_callback: function(req, res, query, err, result) {
	
	if (err != null ) {
		console.log(err);
		console.log(result);
	}
	
	if (err == null && result.rows.length > 0) {
		res.sosResult.observationTypes = result.rows;
	}

	_self.composeResult(req, res, query, err, result);
},

getAllProcDescFormat: function(req, res, query) {
	var allProcDescFormat = openIodSosDb_pg.getAllProcDescFormat(req, res, query, this.getAllProcDescFormat_callback);
},
getAllProcDescFormat_callback: function(req, res, query, err, result) {
	
	if (err != null ) {
		console.log(err);
		console.log(result);
	}
	
	if (err == null && result.rows.length > 0) {
		res.sosResult.allProcDescFormat = result.rows;
	}

	_self.composeResult(req, res, query, err, result);
},

getAllObservableProperties: function(req, res, query) {
	var allObservableProperties = openIodSosDb_pg.getAllObservableProperties(req, res, query, this.getAllObservableProperties_callback);
},
getAllObservableProperties_callback: function(req, res, query, err, result) {
	
	if (err != null ) {
		console.log(err);
		console.log(result);
	}
	
	if (err == null && result.rows.length > 0) {
		res.sosResult.allObservableProperties = result.rows;
	}

	_self.composeResult(req, res, query, err, result);
},

getAllRelatedFeature: function(req, res, query) {
	var allRelatedFeature = openIodSosDb_pg.getAllRelatedFeature(req, res, query, this.getAllRelatedFeature_callback);
},
getAllRelatedFeature_callback: function(req, res, query, err, result) {
	
	if (err != null ) {
		console.log(err);
		console.log(result);
	}
	
	if (err == null && result.rows.length > 0) {
		res.sosResult.allRelatedFeature = result.rows;
	}

	_self.composeResult(req, res, query, err, result);
},

composeResult: function(req, res, query, err, result) {

	res.sosResult.nrOfBlocks -= 1;
	console.log('Wait queue: %s', res.sosResult.nrOfBlocks);
	if (res.sosResult.nrOfBlocks <=0 ) {

		var output = sosRootElements.header; 
	
		output += sos.contents.header;
		
		// allProcDescFormat
		if (res.sosResult.allProcDescFormat) {
			for (var i=0;i<res.sosResult.allProcDescFormat.length;i++) {
				console.log(res.sosResult.allProcDescFormat[i].procdf_proceduredescriptionformat);
				output += '<swes:procedureDescriptionFormat>' + res.sosResult.allProcDescFormat[i].procdf_proceduredescriptionformat + '</swes:procedureDescriptionFormat>';
			}
		}
		
		// allObservableProperties
		if (res.sosResult.allObservableProperties) {
			for (var i=0;i<res.sosResult.allObservableProperties.length;i++) {
				console.log(res.sosResult.allObservableProperties[i].obprop_identifier);
				output += '<swes:observableProperty>' + res.sosResult.allObservableProperties[i].obprop_identifier + '</swes:observableProperty>';
			}
		}		

		// allRelatedFeature
		if (res.sosResult.allRelatedFeature) {
			for (var i=0;i<res.sosResult.allRelatedFeature.length;i++) {
				console.log(res.sosResult.allRelatedFeature[i].obprop_identifier);
				output += '<swes:relatedFeature><swes:FeatureRelationship><swes:target xlink:href="' + res.sosResult.allRelatedFeature[i].foi_identifier + '"></swes:target></swes:FeatureRelationship></swes:relatedFeature>';
			}
		}		
		
		// todo: offering
		if (res.sosResult.offering) {
			for (var i=0;i<res.sosResult.offering.length;i++) {
				console.log(res.sosResult.offering[i].offeringid);
				output += '<swes:offering><sos:ObservationOffering>';
				
//				output += res.sosResult.offering[i].offeringid + '/' + res.sosResult.offering[i].identifier + '/' + 
				
				output += '<swes:identifier>' + res.sosResult.offering[i].ob_identifier + '</swes:identifier>';
				output += '<swes:procedure>' + res.sosResult.offering[i].proc_identifier + '</swes:procedure>';			
				output += '<swes:procedureDescriptionFormat>' + res.sosResult.offering[i].procdf_proceduredescriptionformat + '</swes:procedureDescriptionFormat>';
				output += '<swes:observableProperty>' + res.sosResult.offering[i].obprop_identifier + '</swes:observableProperty>';

              	output += '<swes:relatedFeature><swes:FeatureRelationship>'; 
					output += '<swes:target xlink:href="http://openiod.com?request=getFeature&amp;featureid=' + res.sosResult.offering[i].foi_identifier + '"/>';
              	output += '</swes:FeatureRelationship></swes:relatedFeature>'; 


				
				output += '</sos:ObservationOffering></swes:offering>';
			}
		}		
		
/*
		output += '<swes:offering>';
		output += '<sos:ObservationOffering>\
							<swes:identifier>http://www.my_namespace.org/water_gage_1_observations</swes:identifier>\
							<swes:procedure>http://www.my_namespace.org/sensors/Water_Gage_1</swes:procedure>\
							<swes:procedureDescriptionFormat>http://www.opengis.net/sensorML/1.0.1</swes:procedureDescriptionFormat>\
							<swes:observableProperty>http://sweet.jpl.nasa.gov/2.0/hydroSurface.owl#WaterHeight</swes:observableProperty>\
              <swes:relatedFeature>\
                <swes:FeatureRelationship>\
                  <swes:target xlink:href="http://wfs.example.org?request=getFeature&amp;featureid=Rhine_Sandbank_123"/>\
                </swes:FeatureRelationship>\
              </swes:relatedFeature>\
							<sos:observedArea>\
								<gml:Envelope srsName="http://www.opengis.net/def/crs/EPSG/0/4326">\
									<gml:lowerCorner>50.7167 7.76667</gml:lowerCorner>\
									<gml:upperCorner>53.7167 9.76667</gml:upperCorner>\
								</gml:Envelope>\
							</sos:observedArea>\
							<sos:phenomenonTime>\
								<gml:TimePeriod gml:id="phenomenonTime">\
									<gml:beginPosition>2009-01-11T16:22:25.00Z</gml:beginPosition>\
									<gml:endPosition>2010-08-21T08:32:10.00Z</gml:endPosition>\
								</gml:TimePeriod>\
							</sos:phenomenonTime>\
						</sos:ObservationOffering>';
		output += '</swes:offering>';
		//
*/		
		
		// todo:
		output +=  '<sos:responseFormat>http://www.opengis.net/om/2.0</sos:responseFormat>';
		//
		
		
		
		
		for (var i=0;i<res.sosResult.observationTypes.length;i++) {
			console.log(res.sosResult.observationTypes[i].observationtype);
			
			output += '<sos:observationType>' + res.sosResult.observationTypes[i].observationtype + '</sos:observationType>';
		}

		output += sos.contents.footer;

		output += sosRootElements.footer;

		req.tmpResult = output	
		res.contentType('text/xml');
 		res.send(output);

	}

}






} // end of module.exports
