
/**
 * OpenIoD module for connecting Waterschap data and PostgreSQL database
 *
 * @param  {String} ##todo 
 * @return {String}
 */
 
 "use strict";

 
var pg = require('pg');
var sqlConnString;

function executeSql (query, callback) {
	console.log('sql start: ');
	var client = new pg.Client(sqlConnString);
	client.connect(function(err) {
  		if(err) {
    		console.error('could not connect to postgres', err);
			callback(result, err);
			return;
  		}
  		client.query(query, function(err, result) {
    		if(err) {
      			console.error('error running query', err);
				callback(result, err);
				return;
    		}
    		console.log('sql result: ' + result);
			callback(result.rows, err);
    		client.end();
  		});
	});
};


module.exports = {

	initDbConnection: function (options) {
		sqlConnString = options.param.systemParameter.databaseType + '://' + 
			options.param.systemParameter.databaseAccount + ':' + 
			options.param.systemParameter.databasePassword + '@' + 
			options.param.systemParameter.databaseServer + '/' +
			options.param.systemCode + '_' + options.param.systemParameter.databaseName;
	},
	
	getApriSensorConfig: function (featureOfInterest, param, callback) {

		if (sqlConnString == null) {
			this.initDbConnection({source:'postgresql', param: param });
		}

		this.getApriSensorConfigSql(featureOfInterest, param, callback);

	},

	
	getApriSensorConfigSql: function (featureOfInterest, param, callback) {
		var _attribute, _and;
		var _attribute 	= " foi_code ";
		var _from 		= " as_foi foi ";
		//var _where 		= " 1=1 ";
		//var _groupBy	= "  ";
		//var _orderBy	= _groupBy;
		var _orderBy = ' airbox ';
		
		var query = 'select foi_code from as_foi foi where foi.foi_code = \''+ featureOfInterest +
		   '\' order by foi_datetime desc limit 1; ';

		console.log('Postgres sql start execute: ' + query);
		executeSql(query, callback);

        return;
    },	

	insertApriSensorConfig: function (featureOfInterest, param, callback) {

		if (sqlConnString == null) {
			this.initDbConnection({source:'postgresql', param: param });
		}

		this.insertApriSensorConfigSql(featureOfInterest, param, callback);

	},

	
	insertApriSensorConfigSql: function (featureOfInterest, param, callback) {
				
		var query = 'insert into as_foi (foi_code,foi_datetime, creation_date) values (\''+ featureOfInterest +
		   '\', current_timestamp, current_timestamp); ';

		console.log('Postgres sql start execute: ' + query);
		executeSql(query, callback);

        return;
    }	



};


