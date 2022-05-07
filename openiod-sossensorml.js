 
/**
 * This module contains functions for SOS SensorML
 * @module openiod-sossensorml
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.



module.exports = {

	init: function (name) {

		return true;

	},  // end of init


	initSmlIdentification: function(identification) {

		var smlIdentification = 		{
				"smlIdentifierList": [
					{ "smlIdentifier": {
						"attributes": {
							"name": "uniqueID"
						},
						"smlTerm": {
							"attributes": {
								"definition": "urn:ogc:def:identifier:OGC:1.0:uniqueID"
							},
							"smlValue": "?"						
						}
						}
					},	
					{ "smlIdentifier": {
						"attributes": {
							"name": "longName"
						},
						"smlTerm": {
							"attributes": {
								"definition": "urn:ogc:def:identifier:OGC:1.0:longName"
							},
							"smlValue": "?"						
						}
						}
					},	
					{ "smlIdentifier": {
						"attributes": {
							"name": "shortName"
						},
						"smlTerm": {
							"attributes": {
								"definition": "urn:ogc:def:identifier:OGC:1.0:shortName"
							},
							"smlValue": "?"						
						}
						}
					}	
				]		
			};
		smlIdentification.smlIdentifierList[0].smlIdentifier.smlTerm.smlValue = identification.uniqueID;
		smlIdentification.smlIdentifierList[1].smlIdentifier.smlTerm.smlValue = identification.longName;
		smlIdentification.smlIdentifierList[2].smlIdentifier.smlTerm.smlValue = identification.shortName;

		return smlIdentification;
	},


	initSmlCapabilitiesOfferings: function(offering) {

		var smlCapabilitiesOfferings = 	{
				"attributes": {
					"name": "offerings"
				},
				"sweSimpleDataRecord": {
					"sweField": {
						"attributes": {
							"name": "?"
						},
						"sweText": {
							"attributes": {
								"definition": "urn:ogc:def:identifier:OGC:offeringID"
							},
							"gmlName":"?",
							"sweValue":"?"
						}
					}
				}								
			};

		smlCapabilitiesOfferings.sweSimpleDataRecord.sweField.attributes.name 	= offering.name;
		smlCapabilitiesOfferings.sweSimpleDataRecord.sweField.sweText.gmlName 	= offering.name;
		smlCapabilitiesOfferings.sweSimpleDataRecord.sweField.sweText.sweValue 	= offering.url;

		return smlCapabilitiesOfferings;
	},


	initSmlCapabilitiesFeaturesOfInterest: function(featuresOfInterest) {

		var smlCapabilitiesFeaturesOfInterest = 	
			{
				"attributes": {
					"name": "featuresOfInterest"
				},
				"sweSimpleDataRecord": {
					"sweField": {
						"attributes": {
							"name": "featureOfInterestID"
						},
						"sweText": {
							"sweValue":"?"
						}
					}
				}								
			};
		smlCapabilitiesFeaturesOfInterest.sweSimpleDataRecord.sweField.sweText.sweValue = featuresOfInterest.url;

		return smlCapabilitiesFeaturesOfInterest;
	},

	initSmlOutputQuantity: function(output) {

		var smlOutput = 	
			{
				"attributes": {
					"name": output.name
				},
				"sweQuantity": {
						"attributes": {
							"definition": output.definition
						},
						"sweUom": {
							"attributes": {
								"code": "any" 
							}
						}
				}
			};
		return {smlOutput:smlOutput};
	},

	initObservableProperties: function(observableProperties) {
	
		var _observableProperties	= [];
		for (var i=0;i<observableProperties.length;i++) {
			var _oP = {};
			_oP.swesObservableProperty	= observableProperties[i].swesObservableProperty;
			_observableProperties.push(_oP);
		}

		return _observableProperties;
	},
	
	initObservationTypes: function(observationTypes) {
		var _observationTypes	= [];
		for (var i=0;i<observationTypes.length;i++) {
			var _oT = {};
			_oT.sosObservationType	= observationTypes[i].sosObservationType;
			_observationTypes.push(_oT);
		}

		return _observationTypes;
	}


} // end of module.exports
