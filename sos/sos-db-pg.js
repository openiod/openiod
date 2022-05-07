
/*jslint devel: true,  undef: true, newcap: true, white: true, maxerr: 50 */ 
/*global */
/**
 * The module is for retrieving AiREAS measure data from the Postgres database. 
 * @module sos-db-pg
 */
 
var pg = require('pg');

var sqlConnString;

function executeSql (sql, req, res, query, callback) {
	console.log('sql start: ');
	var client = new pg.Client(sqlConnString);
	client.connect(function(err) {
  		if(err) {
    		console.error('could not connect to postgres', err);
			callback(req, res, query, err);
			return;
  		}
  		client.query(sql, function(err, result) {
    		if(err) {
      			console.error('error running query', err);
				callback(req, res, query, err, result);
				return;
    		}
    		//console.log('sql result: ' + result);
			callback(req, res, query, err, result);
    		client.end();
  		});
	});
};

 

module.exports = {

	init: function (options) {

		sqlConnString = options.configParameter.sos.databaseType + '://' + 
			options.configParameter.sos.databaseAccount + ':' + 
			options.configParameter.sos.databasePassword + '@' + 
			options.configParameter.sos.databaseServer + '/' +
			options.systemCode + '_' + options.configParameter.sos.databaseName;
	},

    portletCache: [],

	getObservationTypes: function(req, res, query, callback) {
		var sqlSelect = " select observationtypeid, observationtype ";

		var sqlFrom = " FROM public.observationtype  ";
		var sqlWhere = ""; //" WHERE 1=1 "; 
		var sqlGroupBy = ""; //" group by ";
		//var queryOrderBy = " order by bu_naam  ";

		console.log('Postgres sql start execute');

		var sql = sqlSelect + sqlFrom; // + queryWhere + queryGroupBy;

		console.log('Query: ' + sql);
		executeSql(sql, req, res, query, callback );

        return;
	},
	
	getAllProcDescFormat: function(req, res, query, callback) {
		var sqlSelect = " select procdf.proceduredescriptionformat procdf_proceduredescriptionformat ";

		var sqlFrom = " FROM public.proceduredescriptionformat procdf ";
		var sqlWhere = ""; //" WHERE 1=1 "; 
		var sqlGroupBy = ""; //" group by ";
		//var queryOrderBy = " order by bu_naam  ";

		console.log('Postgres sql start execute');

		var sql = sqlSelect + sqlFrom; // + queryWhere + queryGroupBy;

		console.log('Query: ' + sql);
		executeSql(sql, req, res, query, callback );

        return;
	},

	getAllObservableProperties: function(req, res, query, callback) {
		var sqlSelect = " select obprop.identifier obprop_identifier ";

		var sqlFrom = " FROM public.observableproperty obprop ";
		var sqlWhere = ""; //" WHERE 1=1 "; 
		var sqlGroupBy = ""; //" group by ";
		//var queryOrderBy = " order by bu_naam  ";

		console.log('Postgres sql start execute');

		var sql = sqlSelect + sqlFrom; // + queryWhere + queryGroupBy;

		console.log('Query: ' + sql);
		executeSql(sql, req, res, query, callback );

        return;
	},

	getAllRelatedFeature: function(req, res, query, callback) {
		var sqlSelect = " select foi.identifier foi_identifier ";

		var sqlFrom = " FROM public.relatedfeature rf, public.featureofinterest foi ";
		var sqlWhere = " WHERE rf.featureofinterestid = foi.featureofinterestid "; //" WHERE 1=1 "; 
		var sqlGroupBy = ""; //" group by ";
		//var queryOrderBy = " order by bu_naam  ";

		console.log('Postgres sql start execute');

		var sql = sqlSelect + sqlFrom + sqlWhere; //+ sqlGroupBy;

		console.log('Query: ' + sql);
		executeSql(sql, req, res, query, callback );

        return;
	},


	getOffering: function(req, res, query, callback) {
		var sqlSelect = " select off.offeringid, off.hibernatediscriminator, off.identifier off_identifier, off.codespace, off.name, off.codespacename, off.description, ob.identifier ob_identifier, proc.identifier proc_identifier, proc.description proc_description, procdf.proceduredescriptionformat procdf_proceduredescriptionformat, obprop.identifier obprop_identifier, foi.identifier foi_identifier ";

		var sqlFrom = " FROM public.offering off, public.observationhasoffering oboff, public.observation ob, public.series ser, public.procedure proc, public.proceduredescriptionformat procdf, public.observableproperty obprop, public.offeringhasrelatedfeature offrf, public.relatedfeature rf, public.featureofinterest foi ";
		var sqlWhere = " WHERE off.offeringid = oboff.offeringid AND oboff.observationid = ob.observationid AND ob.seriesid = ser.seriesid AND ser.procedureid = proc.procedureid AND proc.proceduredescriptionformatid = procdf.proceduredescriptionformatid AND ser.observablepropertyid = obprop.observablepropertyid AND offrf.offeringid = off.offeringid AND offrf.relatedfeatureid = rf.relatedfeatureid AND rf.featureofinterestid = foi.featureofinterestid "; //" WHERE 1=1 "; 
		var sqlGroupBy = ""; //" group by ";
		//var sqlOrderBy = " order by bu_naam  ";

		console.log('Postgres sql start execute');

		var sql = sqlSelect + sqlFrom + sqlWhere; // + sqlGroupBy;

		console.log('Query: ' + sql);
		executeSql(sql, req, res, query, callback );

        return;
	}
	
	
};

    
