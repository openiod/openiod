 
/**
 * The apri-config-main module for init and config node-apri system 
 * @module node-apri-config-main
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

var cassandra 		= require('cassandra-driver');
var async 			= require('async');

var client;


module.exports = {

	init: function (name, param) {
	
		//Connect to the cluster
		client = new cassandra.Client({contactPoints: ['192.168.0.91'], keyspace: 'openiod'});
		client.connect(function (err) {
			//console.log('clientconnect: '+client);
			//console.log(client);
			//console.log(err);
		});
		//console.log(client);

	},  // end of init

	getModel: function (model, param, callback) {
	
		client.execute("SELECT user_id, fname, lname FROM users", function (err, result) {
           if (!err){
               if ( result.rows.length > 0 ) {
                   var user = result.rows[0];
                   console.log("name = %s", user.fname + ' ' + user.lname);
				   //return result.rows;
               } else {
                   console.log("No results");
				   //return "No results" ;
               }
           }
 			//console.log('dit is een test '+ err);
           // Run next function in series
           callback(err, result);
       });
	
	},
	
	executeCql: function (cqlFile, param, callback) {
	
		client.execute(cqlFile, function (err, result) {
           if (!err){
               if ( result.rows != undefined && result.rows.length > 0 ) {
                   //var user = result.rows[0];
                   //console.log("name = %s", user.fname + ' ' + user.lname);
				   //return result.rows;
				   //console.log("Results");
               } else {
                   //console.log("No results");
				   //return "No results" ;
               }
           } else {
		   		console.log("Cql ERROR: " + err );
		   }
		   
		   //console.log("End of: executeCql");
 			//console.log('dit is een test '+ err);
           // Run next function in series
           callback(err, result);
       });
	
	}	


} // end of module.exports
