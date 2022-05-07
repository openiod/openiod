 
/**
 * This module .... 
 * @module token
 */

"use strict"; // This is for your code to comply with the ECMAScript 5 standard.

/*

API examples:

Get token:
curl --cookie-jar jarfile --data "username=myname&password=mypw" "http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=token&action=getToken"

Create new account:
curl --cookie-jar jarfile --data "username=myname&password=mypw&email=test1@example.com" "http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=token&action=createAccount"

Verify token:
curl --cookie-jar jarfile --data "username=admin&token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluIiwiaWF0IjoxNDY2OTIxOTgzLCJleHAiOjE0Njk1MTM5ODN9.CWLJkuk4tC60oUGfPhRYLE7ycyMCienAqCN4RtaZyRU" "http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=token&action=verifyToken"

Change password:

Reset password:
curl --cookie-jar jarfile --data "email=test1@example.com" "http://localhost:4000/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=token&action=resetPassword"



*/

console.log('Module ' + 'token.js');

var nodemailer 				= require('nodemailer');
var handlebarsx			 	= require('handlebars');
var pg 						= require('pg');
var Promise					= require('promise');
var passport 				= require('passport');
var Strategy 				= require('passport-local'); //.Strategy;
const jwt 					= require('jsonwebtoken');


var _openIoDConfig;
var transporter;
var acknowledgeSubjectText	= 'Bevestig uw e-mail voor account aanvraag';
var templateEmailAcknowledgeSource	= "<h1>Bevestig uw aanvraag voor een nieuw account</h1> \
    Klik op de volgende link om uw account aanvraag te bevestigen:<p>{{data.url}}</p> \
    <BR/>";
var templateEmailAcknowledge;	

var resetPasswordSubjectText	= 'Wachtwoord reset verzoek';
var templateEmailResetPasswordSource	= "<h1>Bevestig uw verzoek tot wijzigen van het wachtwoord</h1> \
    Klik op de volgende link om het wachtwoord van uw account te kunnen resetten:<p>{{data.url}}</p> \
    <BR/>";
var templateEmailResetPassword;	
	



var _tokenContext 			= {secret:'secret xyz',expiresIn:'1d'};
var _tokenSignature 		= {secret:'secret xyz signature', expiresIn:'60d'};

var sqlConnString;

function initDbConnection(options) {
	// PostgreSql
//	console.log(options);
	sqlConnString = options.param.databaseType + '://' + 
		options.param.databaseAccount + ':' + 
		options.param.databasePassword + '@' + 
		options.param.databaseServer + '/' +
		_openIoDConfig.getSystemCode() + '_' + options.param.databaseName;
	//console.log(sqlConnString);
};

function clientConnect(sqlConnString) {
	return new Promise(function(fulfill, reject) {
		var client = new pg.Client(sqlConnString);
		client.connect(function(err) {
			if (err) {
				var _error = JSON.parse(err);
				console.log('err: ' + _error);
				reject(_error);
			} else fulfill(client);	
		});
	})	
}

function clientQuery(client, query) {
	return new Promise(function(fulfill, reject) {
		client.query(query, function(err, result) {
    		if(err) {
				var _error	= clientParseError(err);
				reject(_error);
    		} else fulfill(result.rows);
    		client.end();
  		});		
	})	
}

// special error text handling for Postgres error from module pg
function clientParseError(error) {
    var _error = {};
    for (var p in error) {
        if (error.hasOwnProperty(p)) {
            _error[p]	= error[p];
        };
    }
	return _error;
}


function executeSql (req, res, query, callback) {

//	console.log('sql start: '+sqlConnString);

	clientConnect(sqlConnString).then(function(client) {
		//console.log('query...sssss' + query );
		clientQuery(client, query).then(function(rows) {
			callback(req, res, rows);
   			client.end();
		}).catch(function(err) {
   			console.log('WARNING query, table: ', err.table, err.detail);
			callback(req, res, err);
		});
	}).catch(function(err) {
		console.log('catch promise sqlconnect');
		var _error = JSON.parse(err);
  		console.log(_error); 
		callback(req, res, _error);
	});
};




// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
	console.log('serialize user: '+ user.id);
	console.dir(user);
//	cb(null, user.id);
	cb( user.id);
});

passport.deserializeUser(function(id, cb) {
	console.log('deserialize user');
//	db.users.findById(id, function (err, user) {
//		if (err) { return cb(err); }
//		cb(null, user);
//	});
	cb( user.id);
});



passport.use(new Strategy({
		usernameField: 'username',
		passwordField: 'password',
		passReqToCallback: true //, //add req to middleware function when true and session true
//		session: false
	},

	function( req, username, password, done) {
		console.log(req.param);
		console.log('Strategy: Inlog parameters: '+req.param('username'));


//getContext('OpenIoD');
		
		if(username === 'devils name' && password === '666'){
			done(null, {
				id: 666,
				firstname: 'devils',
				lastname: 'name',
				email: 'devil@he.ll',
				verified: true
			});
		} else done(null, false);
		
/*
		user.findOne({
			firstName: firstName
			},
			function (err, firstName) {
				if (err) {
					return done(err);
				}
				if (!firstName) {
					console.log('User Not Found  ' + firstName);
				}
				if (!isValidPassword(firstName, password12)) {
					console.log('Invalid Password');
				} else {
					console.log('correct');
					return done(null, firstName);
				}
			}
		);
*/		
		
	}
));


var getToken	= function(req, res) {
	var signature = getUserToken(req.body.username+req.body.password);
//	console.log(signature);
//	if (signature=='eyJhbGciOiJIUzI1NiJ9.YWRtaW5hZG1pbng.U4Qx1g831ubzFhP-zxI-ug25feZ70d6nwgVBAH74Yos') {
//		console.log('Signature is ok');
//	};
	getDbUser(req, res, authenticate);
}


var createAccount	= function(req, res) {
	var signature = getUserToken(req.body.username+req.body.password);
//	console.log(signature);
//	if (signature=='eyJhbGciOiJIUzI1NiJ9.YWRtaW5hZG1pbng.U4Qx1g831ubzFhP-zxI-ug25feZ70d6nwgVBAH74Yos') {
//		console.log('Signature is ok');
//	};
	createDbUser(req, res, sendAcknowledgeEmail);
}


var resetPassword	= function(req, res) {
//	console.log(signature);
//	if (signature=='eyJhbGciOiJIUzI1NiJ9.YWRtaW5hZG1pbng.U4Qx1g831ubzFhP-zxI-ug25feZ70d6nwgVBAH74Yos') {
//		console.log('Signature is ok');
//	};
	updateDbUserResetPassword(req, res, sendResetPasswordEmail);
}


var sendAcknowledgeEmail	= function(req, res, e) {
	
	if (e && e.name == 'error') {
		//console.log(e);
		
		if (e.routine== '_bt_check_unique') {
			res.status(501).json({
				err: 'CreateAccountError',
				message: 'account cannot be created, account or email already in use.'
			});
		} else {
			res.status(501).json({
				err: 'CreateAccountError',
				message: 'account cannot be created.'
			});
		};
		return;
	}

	templateEmailAcknowledge	= handlebarsx.compile(templateEmailAcknowledgeSource);		
	var data = {};
	data.url = _tokenContext.protocol + '://' + _tokenContext.host + ':' + _tokenContext.port; 

	var templateResultHtml = templateEmailAcknowledge({
		data: data
	});

	transporter.sendMail({
    	from: 'noreply@openiod.com',
    	to: req.body.email,
    	subject: acknowledgeSubjectText,
    	html: templateResultHtml
	});
	
	respond(req, res);

}




var sendResetPasswordEmail	= function(req, res, e) {
	
	if (e && e.name == 'error') {
		//console.log(e);
		
		if (e.routine== '_bt_check_unique') {
			res.status(501).json({
				err: 'ResetPasswordError',
				message: 'cannot reset password, email-address not found.'
			});
		} else {
			res.status(501).json({
				err: 'ResetPasswordError',
				message: 'Reset failed.'
			});
		};
		return;
	}

	templateEmailResetPassword	= handlebarsx.compile(templateEmailResetPasswordSource);		
	var data = {};
	data.url = _tokenContext.protocol + '://' + _tokenContext.host + ':' + _tokenContext.port + '/SCAPE604/openiod?SERVICE=WPS&REQUEST=Execute&identifier=token&action=setPassword&signature=' + req.signature; 

	var templateResultHtml = templateEmailResetPassword({
		data: data
	});

	transporter.sendMail({
    	from: 'noreply@openiod.com',
    	to: req.body.email,
    	subject: resetPasswordSubjectText,
    	html: templateResultHtml
	});
	
	respond(req, res);

}




// serialize for passport when session==false
function serialize(req, res, context, next) {  
	console.log('serialize');
//	console.log('req: '+req);
//	console.dir(req);
	
//	console.log('res: '+res);
//	console.dir(res);

//	console.log('next: '+next);
//	console.dir(next);
//	console.dir('req.body: '+JSON.stringify(req.body));
	var user = {};
	user.id			= req.body.username;
	user.username	= req.body.username;
	user.password	= req.body.password;
	db.updateOrCreate(user, function(err, user){
		if(err) {return next(err);}
		// we store the updated information in req.user again
		req.user = {
			id: user.id
		};
		next(req, res, context, respond);
	});
}
const db = {  
	updateOrCreate: function(user, cb) {
		// db dummy, we just cb the user
		cb(null, user);
	}
};

function generateToken(req, res, context, next) {  
	req.token = jwt.sign({
		id: req.user.id,
	}, context.secret, {  //todo
		expiresIn: context.expiresIn
	});
	next(req,res);
}

var verifyToken	= function(req, res, context) {
	console.log(req.token);
	jwt.verify(req.token, context.secret, function(err, decoded) {
		//console.log(err);
		//console.log(decoded);
  		if (err==null ) {
			if (decoded.id==req.body.username) {
				var _iat	= new Date(decoded.iat*1000);
				var _exp	= new Date(decoded.exp*1000);
				console.log('token for ',decoded.id,' is OK from ',_iat, ' till ', _exp );
				respond(req,res);
				return;
			}
		}
		console.log('token error: ', err );
		res.status(501).json({
			err: 'invalidToken',
			message: 'token invalid or expired'
		});
		return;
		// err: null
  		// decoded: { id: 'admin', iat: 1466112449, exp: 1466198849 }
	});
	//getDbUser(req, res, authenticate);
}
//var verifyToken	= function(req, res) {
//	jwt.verify(req.body.token, _tokenContext.secret, function(err, decoded) {
//		console.log(err);
//		console.log(decoded);
//	});
//}



/*
var generateToken	= function (req,context) {  
	var token = jwt.sign({
		id: req.user.id,
	}, context.secret, {
		expiresIn: context.expiresIn
	});
	//next();
}
*/

function respond(req, res) {  
	console.log('respond');
	res.status(200).json({
		user: req.user,
		token: req.token
	});
}

var errorMessages = {
	  NOQUERY 			: { "message": 'Query parameters missing'		, "returnCode": 501 }
	, NOSERVICE 		: { "message": 'SERVICE parameter missing'		, "returnCode": 501 }
	, NOREQUEST 		: { "message": 'REQUEST parameter missing'		, "returnCode": 501 }
	, UNKNOWNREQ 		: { "message": 'REQUEST parameter unknown'		, "returnCode": 501 }
	, UNKNOWNIDENTIFIER : { "message": 'IDENTIFIER parameter unknown'	, "returnCode": 501 }
	, URLERROR 			: { "message": 'URL incorrect'					, "returnCode": 501 }
	, NOTEST 			: { "message": 'Test error message'				, "returnCode": 501 }
	, NOMODEL 			: { "message": 'MODEL parameter missing'		, "returnCode": 501 }
}

var errorResult = function(res, message) {
	res.returncode = message.returnCode;
	res.contentType('text/plain');
	res.status(message.returnCode).send(message.message);
};

var getDbUser	= function(req, res, callback) {

	var _attribute, _and;
	
	var _signature 	= getUserToken(req.body.username+req.body.password);
	
	var _attribute 	= " usr.id ";
	var _from 		= " openiod_user usr ";
	var _where 		= " usr.id = '" + req.body.username + "' and usr.signature = '" + _signature + "'";
	//var _groupBy	= "  ";
	//var _orderBy	= _groupBy;
	//var _orderBy = ' identifier ';
		
	var query = 'select ' + _attribute + ' from ' + _from + ' where ' + _where +
	// ' group by ' + _groupBy + 
	//' order by ' + _orderBy + 
	' ;';
		
//	console.log('Postgres sql start execute: ' + query);
	
	executeSql(req, res, query, callback);
    return;

}

var createDbUser	= function(req, res, callback) {

	var _attribute, _and;
	
	var _signature 	= getUserToken(req.body.username+req.body.password);
	
//	var _attribute 	= " usr.id ";
	var _into 		= " openiod_user ";
//	var _where 		= " usr.id = '" + req.body.username + "' and usr.signature = '" + _signature + "'";
	var _values		= '\''+req.body.username + '\',\'' + _signature + '\',\'' + req.body.email + '\',null,current_timestamp,current_timestamp'; 
	//var _groupBy	= "  ";
	//var _orderBy	= _groupBy;
	//var _orderBy = ' identifier ';
		
	var query = 'insert into ' + _into + ' (id,signature,email,email_acknowledge_date,mutation_date,creation_date) VALUES(' + _values + ')'
	// ' group by ' + _groupBy + 
	//' order by ' + _orderBy + 
	' ;';
		
	console.log('Postgres sql start execute: ' + query);
	
	executeSql(req, res, query, callback);
    return;

}


var updateDbUserResetPassword	= function(req, res, callback) {

	var _attribute, _and;
	
	req.signature = getResetPasswordToken(req.body.email);
	
//	var _attribute 	= " usr.id ";
	var _table		= " openiod_user ";
//	var _where 		= " usr.id = '" + req.body.username + "' and usr.signature = '" + _signature + "'";
//	var _values		= '\''+req.body.username + '\',\'' + _signature + '\',\'' + req.body.email + '\',null,current_timestamp,current_timestamp'; 
	//var _groupBy	= "  ";
	//var _orderBy	= _groupBy;
	//var _orderBy = ' identifier ';
		
	var query = 'update ' + _table + ' set reset_password_signature=\''+req.signature+ '\' where email =\'' + req.body.email + '\';';
	// ' group by ' + _groupBy + 
	//' order by ' + _orderBy + 
//	' ;';
		
	console.log('Postgres sql start execute: ' + query);
	
	executeSql(req, res, query, callback);
    return;

}


var getUserToken	= function(payLoad) {
	const signature = jwt.sign(
		payLoad,
		_tokenSignature.secret,
		{
			algorithm: 'HS256'
		}
	);
	return signature;
}


var getResetPasswordToken	= function(payLoad) {
	const signature = jwt.sign(
		payLoad,
		_tokenContext.resetSecret,
		{
			algorithm: 'HS256'
		}
	);
	return signature;
}


//var authenticate	= function(req, res, query, param, callback) {
var authenticate	= function(req, res, result) {
	//	req.user = {};
	
	if (result[0]== undefined) {
		console.log(result);
		res.status(501).json({
			err: 'notAuthorized',
			message: 'account/password not found'
		});
		return;
	}
	
	console.log('userId: '+ result[0].id);
	
	passport.initialize();
	passport.authenticate('local'  //'basic',   //
		, { session:true//,   // when false then next middleware function(s) (no session cookies, disable passport store), when true then Strategy functions
			//successRedirect: '/SCAPE604/app',
			//failureRedirect: '/SCAPE604/login'
			//, failureFlash: 'test failure flash'  
	});	


	serialize(req, res, _tokenContext, generateToken);


//	_authenticate(req, 'a', 'b', 'c');
	//_authenticate.serialize();
	//_authenticate.generateToken();
//	console.log(_authenticate);
//	, serialize
//	, generateToken
//	, respond

	
//	var resultOutput;
//	if (query.featureofinterest == null) {
		//errorResult(res, errorMessages.NOTEST);
		return;
//	};


}


module.exports = {

	init: function(req, res, 
			depricated_query, depricated_param,  //query, param. Depricated
			openIoDConfig ) {
		
		if (_openIoDConfig == undefined) _openIoDConfig = openIoDConfig;
		if (transporter == undefined) {
			transporter 	= nodemailer.createTransport();
		}	
	
		_tokenContext 		= _openIoDConfig.getContext('OpenIoD');
		_tokenSignature		= _openIoDConfig.getSignature('OpenIoD');
		if (sqlConnString == null) {
			initDbConnection({source:'postgresql', param: _tokenContext.db });
		}
	
		console.log('Module ' + 'token.js' + ' init() executed');
		//this.getData(req, res, query, param);
		
		if ( req.body.token && req.body.token !='') req.token = req.body.token;
		if ( req.token == null  && req.openIodUrlQuery.token && req.openIodUrlQuery.token != '') req.token = req.openIodUrlQuery.token;
		
		if ( req.token != null) {
			//console.log('verify token');
			verifyToken(req, res, _tokenContext);
			return;
		}
		console.log('Action: ' + req.openIodUrlQuery.action );
		if (req.openIodUrlQuery.action == 'getToken') 		getToken		(req, res);
		if (req.openIodUrlQuery.action == 'createAccount') 	createAccount	(req, res);
		if (req.openIodUrlQuery.action == 'resetPassword') 	resetPassword	(req, res);
		//if (req.openIodUrlQuery.action == 'verifyToken') 	verifyToken		(req, res);
		
	}

} // end of module.exports
