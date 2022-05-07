 
/**
 * This module contains functions for SOS O&M  
 * @module openiod-sosom
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.



module.exports = {

	init: function (name) {

		return true;

	},  // end of init

	initAttributes: function (id) {
	
		var attributes = {
			"gmlId": id
		}
		return attributes;	
	},

	setOmNameSpaces: function (attributes) {
	
		var _attributes = attributes;
		
		_attributes['xmlns:om'] 			= "http://www.opengis.net/om/2.0";
		_attributes['xmlns:sos'] 			= "http://www.opengis.net/sos/2.0";		
		_attributes['xmlns:gml'] 			= "http://www.opengis.net/gml/3.2";
		_attributes['xmlns:ogc'] 			= "http://www.opengis.net/ogc";
		_attributes['xmlns:xsi'] 			= "http://www.w3.org/2001/XMLSchema-instance";
		_attributes['xmlns:xlink'] 			= "http://www.w3.org/1999/xlink";
		_attributes['xmlns:swe'] 			= "http://www.opengis.net/swe/2.0";
		_attributes['xmlns:swes'] 			= "http://www.opengis.net/swes/2.0";
		_attributes['xmlns:fes']			= "http://www.opengis.net/fes/2.0";
		_attributes['xmlns:sams'] 			= "http://www.opengis.net/samplingSpatial/2.0";
		_attributes['xmlns:sf'] 			= "http://www.opengis.net/sampling/2.0";
		_attributes['xsi:schemaLocation'] 	= "http://www.opengis.net/sos/2.0 http://schemas.opengis.net/sos/2.0/sos.xsd          http://www.opengis.net/samplingSpatial/2.0 http://schemas.opengis.net/samplingSpatial/2.0/spatialSamplingFeature.xsd";

		return _attributes;	
	},
	
	
	initGmlDescription: function (gmlDescription) {
		return gmlDescription;
	},


	initGmlIdentifier: function (identifier) {
	
		var _gmlIdentifier =
		{
			"attributes": {
				"codeSpace": "http://www.opengis.net/def/nil/OGC/0/unknown"
			},
			"keyValue": identifier
		}
	
		return _gmlIdentifier;
	},


	initOmType: function (omType) {
	
		var _omType =
		{
			"attributes": {
				"xLinkHref": omType
			}
		}
	
		return _omType;
	},


	initOmPhenomenonTime: function (phenomenonTime, xLinkHref) {
	
		var omPhenomenonTime;
		
		if (xLinkHref == undefined) {
			omPhenomenonTime = 
			{
				"gmlTimeInstant": {
					"attributes": {
						"gmlId": "phenomenonTime"
					},
					"gmlTimePosition": phenomenonTime
				}
			}
		} else {
			omPhenomenonTime = 
			{
				"attributes": {
					"xLinkHref": xLinkHref
				}
			}
		}
	
		return omPhenomenonTime;	
	},


	initOmResultTime: function (resultTime) {
	
		var omResultTime = 
		{
			"attributes": {
				"xLinkHref": "#phenomenonTime"
			}
		}
	
		return omResultTime;	
	},


	initOmProcedure: function (procedure) {
	
		var omProcedure = 
		{
			"attributes": {
				"xLinkHref": procedure
			}
		}
	
		return omProcedure;	
	},


	initOmObservedProperty: function (observedProperty) {
	
		var omObservedProperty = 
		{
			"attributes": {
				"xLinkHref": observedProperty
			}
		}
	
		return omObservedProperty;	
	},


	initFeatureOfInterest: function (featureOfInterest) {
		var omFeatureOfInterest = {};
		
		if (featureOfInterest.xLinkHref != undefined) {
			omFeatureOfInterest = 
			{
				"attributes": {
					"xLinkHref": featureOfInterest.xLinkHref
				}
			}
			return omFeatureOfInterest;
			
		};
		
	
		omFeatureOfInterest = 
		{
			 "samsSF_SpatialSamplingFeature": {
				"attributes": {
					"gmlId": "ssf"
				},
				"gmlIdentifier": {
					"attributes": {
						"codeSpace": "http://www.opengis.net/def/nil/OGC/0/unknown"
					},
					"keyValue": featureOfInterest.identifier,
				},
				//"gmlDescription": "NOT_SET",
				"gmlName": featureOfInterest.gmlName,
				"sfSampledFeature": {
					"attributes": {
						"xLinkRole": "urn:x-ogc:def:property:neighborhood",
						"xLinkHref": "http://sensorweb.demo.52north.org:80/PegelOnlineSOSv2.1/sos?REQUEST=getFeatureOfInterest&amp;service=SOS&amp;version=1.0.0&amp;featureOfInterestID=OSTE"
					}
				},
				"samsShape": {
					"gmlPoint": {
						"attributes": {
							"gmlId": featureOfInterest.gmlId
						},
						"gmlPos": {
							"attributes": {
								"srsName": "urn:ogc:def:crs:EPSG::4326"
							},
							"keyValue": "" + featureOfInterest.lat + " " + featureOfInterest.lng
						}	
					}
				}
			}
		}
		return omFeatureOfInterest;	
	},
	
	initOmResult: function (result) {
		var omResult;
		
/*		if (result.type=="string") {
			omResult = 
			{
				"attributes": {
					"codeSpace": "http://www.aireas.com/"
				},
				"keyValue":result.value				
			}
		} else {
*/
			if (result.type=="gml:ReferenceType") {
			omResult = 
			{
				"attributes": {
					"xsiType": "gml:ReferenceType",
					"xLinkTitle":''+result.value,
					"xLinkHref":''+result.value					
				}
			}
		} else {
			omResult = 
			{
				"attributes": {
					"xsiType": "gml:MeasureType",
					"uom":result.uom
				},
				"keyValue": result.value
			}
		}
//		}
			
		return omResult;	
	}


} // end of module.exports
