var express = require('express');
var AWS = require('aws-sdk');
var jwt = require('jsonwebtoken');
var cookie = require('cookie');
AWS.config.region = 'us-east-1';

var ddb = new AWS.DynamoDB();

var router = express.Router();

router.post('/', function(req, res, next){
	if(!req.body.username) res.status(400).send({error:"no username provided"});
	if(!req.body.password) res.status(400).send({error:"no password provided"});

	var item = {
		'username' : {'S' : req.body.username},
		'password' : {'S' : req.body.password}   
	};
	ddb.putItem({
		'TableName' : 'UserTable',
		'Item' : item,
		'Expected': { username: { Exists: false } }     
	}, function(err, data){
		if (err) {
      		var returnStatus = 500;
      		if (err.code === 'ConditionalCheckFailedException') {
        		returnStatus = 409;
      		}
      		res.status(returnStatus).end();
      		console.log('DDB Error: ' + err);
  		} else {
  			var token = jwt.sign(req.body.username, 'shhhhh');  
          	res.cookie('userToken', token); 
  			res.redirect('/');
  		}	
  	});
});

module.exports = router;
