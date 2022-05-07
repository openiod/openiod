 
/**
 * This module build xml from javascript objects 
 * @module openiod-xmlbuilder
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

var elementNameMapping = {
	smlPhysicalComponent : {name: 'sml:PhysicalComponent'},
	smlPhysicalSystem : {name: 'sml:PhysicalSystem'},
	smlCapabilities:	{name: 'sml:capabilities'},
	smlCapabilitiesOfferings:	{name: 'sml:capabilities'},
	smlCapabilitiesParentProcedures:	{name: 'sml:capabilities'},
	smlCapabilitiesFeaturesOfInterest:	{name: 'sml:capabilities'},
	smlCapabilityList:	{name: 'sml:CapabilityList'},
	smlCapability:	{name: 'sml:capability'},
	smlCharacteristics:	{name: 'sml:characteristics'},
	smlCharacteristicList:	{name: 'sml:CharacteristicList'},
	smlCharacteristic:	{name: 'sml:characteristic'},
	smlIdentification:	{name: 'sml:identification'},
	smlIdentifier:	{name: 'sml:identifier'},
	smlIdentifierList:	{name: 'sml:IdentifierList'},
	smlInputs:	{name: 'sml:inputs'},
	smlInputList:	{name: 'sml:InputList'},
	smlInput:	{name: 'sml:input'},
	smlKeywords:	{name: 'sml:keywords'},
	smlKeyword:	{name: 'sml:keyword'},
	smlKeywordList:	{name: 'sml:KeywordList'},
	smlkeyword:	{name: 'sml:keyword'},
	smlMember:	{name: 'sml:member'},	
	smlOutputs:		{name: 'sml:outputs'},
	smlOutputList:	{name: 'sml:OutputList'},
	smlOutput:		{name: 'sml:output'},
	smlObservableProperty: {name:'sml:ObservableProperty'},
	smlPosition:	{name: 'sml:position'},	
	smlSensorMl:	{name: 'sml:SensorML'},	
	smlSystem:	{name: 'sml:System'},	
	smlTerm:	{name: 'sml:Term'},	
	smlTypeOf:	{name: 'sml:typeOf'},
	smlValue:	{name: 'sml:value'},
	sosEventTime : {name: 'sos:eventTime'},
	sosFeatureOfInterests : {name: 'sos:featureOfInterest', skipContainer: true },
	sosFeatureOfInterest : {name: 'sos:featureOfInterest'},
	sosGetObservation : {name: 'sos:GetObservation'},
	sosInsertObservation : {name: 'sos:InsertObservation'},
	sosSosInsertionMetadata: {name: 'sos:SosInsertionMetadata'},
	sosObservations : {name: 'sos:observation', repeat:true},
	sosObservation : {name: 'sos:observation'},
	sosObservationType: {name: 'sos:observationType'},
	sosObservedProperties : {name: 'sos:featureOfInterest', skipContainer: true },
	sosObservedProperty : {name: 'sos:observedProperty'},
	sosOffering : {name: 'sos:offering'},
	sosProcedure : {name: 'sos:procedure'},
	sosTemporalFilter: {name: 'sos:temporalFilter'},
	fesDuring: {name: 'fes:During'},
	fesValueReference: {name: 'fes:ValueReference'},
	gmlBoundedBy: {name: 'gml:boundedBy'},
	gmlDescription: {name: 'gml:description'},
	gmlIdentifier: {name: 'gml:identifier', compress:true},
	gmlEnvelope: {name: 'gml:envelope'},
	gmlFeatureCollection: {name: 'gml:FeatureCollection'},
	gmlFeatureMember: {name: 'gml:featureMember'},
	gmlId: {name: 'gml:id'},
	gmlName: {name: 'gml:name'},
	gmlLowerCorner: {name: 'gml:lowerCorner', compress:true, separator:" "},
	gmlUpperCorner: {name: 'gml:upperCorner', compress:true, separator:" "},
	gmlPoint: {name: 'gml:Point'},
	gmlPointCoordinate: {name: 'gml:PointCoordinate'},
	gmlPos: {name: 'gml:pos', compress:true, separator:" "},
	gmlTimeInstant: {name: 'gml:TimeInstant'},
	gmlTimePeriod: {name: 'gml:TimePeriod'},
	gmlTimePosition: {name: 'gml:timePosition'},
	gmlTimeInstant: {name: 'gml:TimeInstant'},
	gmlBeginPosition: {name: 'gml:beginPosition'},
	gmlEndPosition: {name: 'gml:endPosition'},
	ogcPropertyName: {name: 'ogc:PropertyName'},
	ogcTM_Equals: {name: 'ogc:TM_Equals'},
	omFeatureOfInterest: {name: 'om:featureOfInterest'},
	omMembers: {name: 'om:member', repeat:true},
	omOM_Observation: {name: 'om:OM_Observation'},
	omObservationCollection: {name: 'om:observationCollection'},
	omObservedProperty: {name: 'om:observedProperty'},
	omProcedure: {name: 'om:procedure'},
	omPhenomenonTime: {name: 'om:phenomenonTime'},	
	omResultTime: {name: 'om:resultTime'},	
	omResult: {name: 'om:result', compress:true},	
	omSamplingTime: {name: 'om:samplingTime'},
	omType: {name: 'om:type'},
	samsPosition: {name: 'sams:position'},
	samsShape: {name: 'sams:shape'},
	samsSF_SpatialSamplingFeature: {name: 'sams:SF_SpatialSamplingFeature'},
	samsSamplingPoint: {name: 'sams:SamplingPoint'},
	sfSampledFeature: {name: 'sf:sampledFeature'},
	sweCategory: {name: 'swe:category'},
	sweBoolean: {name: 'swe:Boolean'},
	sweComponent: {name: 'swe:component'},
	sweComponents: {name: 'swe:components', skipContainer: true},
	sweCompositePhenomenon: {name: 'swe:compositePhenomenon'},
	sweCount: {name: 'swe:Count'},	
	sweDataArray: {name: 'swe:DataArray'},	
	sweDataRecord: {name: 'swe:DataRecord'},	
	sweElementCount: {name: 'swe:elementCount'},	
	sweElementType: {name: 'swe:elementType'},	
	sweEncoding: {name: 'swe:encoding'},	
	sweField: {name: 'swe:field'},	
	sweFloat: {name: 'swe:Float'},	
	sweLabel: {name: 'swe:label'},	
	sweObservableProperty: {name:'swe:ObservableProperty'},
	sweQuantity: {name: 'swe:Quantity'},	
	sweQuantityRange: {name: 'swe:QuantityRange'},	
	sweSimpleDataRecord: {name: 'swe:SimpleDataRecord'},	
	sweText: {name: 'swe:Text'},	
	sweTextBlock: {name: 'swe:TextBlock'},	
	sweTime: {name: 'swe:Time'},	
	sweUom: {name: 'swe:uom'},
	sweValue: {name: 'swe:value'},
	sweValues: {name: 'swe:values', compress:true, separator:"sweEncoding"},
	swesInsertSensor: {name: 'swes:InsertSensor'},
	swesExtension: {name: 'swes:extension'},
	swesProcedureDescription: {name: 'swes:procedureDescription'},
	swesProcedureDescriptionFormat: {name: 'swes:procedureDescriptionFormat'},
	swesMetadata: {name: 'swes:metadata'},
	swesObservableProperties: {name: 'swes:observableProperties', skipContainer: true },
	swesObservableProperty: {name: 'swes:observableProperty' },
	swesObservationType: {name: 'swes:observationType'},
	xLinkHref: {name: 'xlink:href'},
	xLinkRole: {name: 'xlink:role'},
	xLinkTitle: {name: 'xlink:title'},
	xsiSchemLocation: {name: 'xsi:schemLocation'},
	xsiType: {name: 'xsi:type'}
}



module.exports = {

	init: function (name) {

		return true;

	},  // end of init

	buildXml: function (object, param) {
		var xmlOutput = "";
		
		xmlOutput = this.buildXmlElement(object, xmlOutput, param);
		
/*		
		omObservationCollection.nameSpaces 						= {};
		omObservationCollection.nameSpaces['xmlns:om'] 			= "http://www.opengis.net/om/1.0";
		omObservationCollection.nameSpaces['xmlns:gml'] 		= "http://www.opengis.net/gml";
		omObservationCollection.nameSpaces['xmlns:xsi'] 		= "http://www.w3.org/2001/XMLSchema-instance";
		omObservationCollection.nameSpaces['xmlns:xlink'] 		= "http://www.w3.org/1999/xlink";
		omObservationCollection.nameSpaces['xmlns:swe'] 		= "http://www.opengis.net/swe/1.0.1";
		omObservationCollection.nameSpaces['xmlns:sa'] 			= "http://www.opengis.net/sampling/1.0";
		omObservationCollection.nameSpaces['gml:id'] 			= "oc_1425935648988";
		omObservationCollection.nameSpaces['xsi:schemaLocation'] = "http://www.opengis.net/om/1.0 http://schemas.opengis.net/om/1.0.0/om.xsd http://www.opengis.net/sampling/1.0 http://schemas.opengis.net/sampling/1.0.0/sampling.xsd";
		omObservationCollection.gmlBoundedBy					= this.initGmlBoundedBy(omObservationCollection, param);
		omObservationCollection.omMembers		= [];

		for (var i=0; i<param.members.length; I++) {
			var omMember = initOmMember(omObservationCollection.omMembers, param.members[i], param);
			omObservationCollection.omMembers.push(omMember);
		}
*/		
		return xmlOutput;
	},
	
	buildXmlElement: function (object, xmlOutput, param) {
		var elementName, elementCompress, elementSeparator, elementRepeat, elementSkipContainer;
		//console.log('buildXmlElement object: ' + object);
		for (var key in object) {
			//console.log('buildXmlElement key: ' + key + ' value: ' + object[key]);
			//if (object[key] && object[key].length != undefined ) console.log('             length: ' + object[key].length);
   			if (object.hasOwnProperty(key) && key != 'attributes') {
				//console.log('objectkey: ' + typeof(object[key]) + object[key]);
				var elementProperties = elementNameMapping[key];
				if (elementProperties) {
					elementName 		= elementProperties.name
					elementCompress 	= elementProperties.compress?elementProperties.compress:false;
					elementSeparator 	= elementProperties.separator?elementProperties.separator:"";
					elementRepeat	 	= elementProperties.repeat?elementProperties.repeat:false;
					elementSkipContainer= elementProperties.skipContainer?elementProperties.skipContainer:false;
				} else {
					elementName 		= key;
					elementCompress 	= false;
					elementSeparator 	= "";
					elementRepeat		= false;
					elementSkipContainer= false;
				}
				if (key == 'sweEncoding') { // save encoding for sweValues
					param.sweEncoding = object[key];  
				}
				
				var _typeOf = typeof(object[key]);
				
				
				if ( object[key] && object[key].constructor === Array ) {
					if (elementCompress) { 
						xmlOutput = xmlOutput + "<" + elementName + ">";
						if (elementSeparator == 'sweEncoding') {
							xmlOutput = this.compressElementSweEncoded(object[key], elementSeparator, xmlOutput, param);
						} else {
							xmlOutput = this.compressElement(object[key], elementSeparator, xmlOutput, param);
						}
						xmlOutput = xmlOutput + "</" + elementName + ">";
					} else {
						//console.log("                          ---->>> ARRAY : key: " + key );
						var _array = object[key];
						for (var j=0;j<_array.length;j++) {
							if ( !elementSkipContainer && (elementRepeat || j==0) ) {
								xmlOutput = xmlOutput + "<" + elementName + ">";
							}
							xmlOutput = this.buildXmlElement(_array[j], xmlOutput, param);
							if (!elementSkipContainer && (elementRepeat || j==_array.length-1) ) {
								xmlOutput = xmlOutput + "</" + elementName + ">";
							}
						}
					}	
				} else if (_typeOf === "number" || _typeOf === "string") {
					//console.log("NUMBER/STRING: " + object[key].constructor);
					xmlOutput = xmlOutput + '<' + elementName + '>' + object[key] + '</' + elementName + '>';
				} else {
					xmlOutput = xmlOutput + "<" + elementName;
					if (object[key] != undefined && object[key].attributes != undefined) {
						//console.log('ATTRIBUTEN!!');
						var attributes = object[key].attributes;
						for (var attribute in attributes) {
							if (attributes.hasOwnProperty(attribute)) {
								var _attribute = elementNameMapping[attribute]?elementNameMapping[attribute].name:attribute;
								xmlOutput = xmlOutput + " " + _attribute + "=\"" + attributes[attribute] + "\"";
							}
						}
					};
					xmlOutput = xmlOutput + ">";
					
					if (elementCompress) { 
						//console.log(' -------------> compress');
						//if (elementSeparator == 'sweEncoding') {
						//	xmlOutput = this.compressElementSweEncoded(object[key], elementSeparator, xmlOutput, param);
						//} else {
							xmlOutput = this.compressElement(object[key], elementSeparator, xmlOutput, param);
						//}
					} else {
						xmlOutput = this.buildXmlElement(object[key], xmlOutput, param);
					}	
					xmlOutput = xmlOutput + "</" + elementName + ">";
				}
   			}
		} 

		return xmlOutput;
	},

	compressElementSweEncoded: function(object, elementSeparator, xmlOutput, param) {
		var _elementTokenSeparator = param.sweEncoding.sweTextBlock.attributes.tokenSeparator;
		var _elementBlockSeparator = param.sweEncoding.sweTextBlock.attributes.blockSeparator;
		for (var i=0;i<object.length;i++) {
			var _record = object[i];
			for (var j=0;j<_record.length;j++) {
				xmlOutput = xmlOutput + _record[j];
				if (j != _record.length-1) xmlOutput = xmlOutput + _elementTokenSeparator;
			}
			if (i != object.length-1) xmlOutput = xmlOutput + _elementBlockSeparator;
		}
		return xmlOutput;
	},

	compressElement: function(object, elementSeparator, xmlOutput, param) {
		var _elementSeparator = "";
		for (var element in object) {
			if (object.hasOwnProperty(element) && element != 'attributes') {
				var _typeOf = typeof(object[element]);
				if (_typeOf === "number" || _typeOf === "string") {
					xmlOutput = xmlOutput + _elementSeparator + object[element];
				} else {
					xmlOutput = this.compressElement(object[element], elementSeparator, xmlOutput, param);
				}
				_elementSeparator = elementSeparator;
			}
		}
		return xmlOutput;
	}

} // end of module.exports
