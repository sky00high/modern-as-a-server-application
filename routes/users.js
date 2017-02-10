var express = require('express');
var router = express.Router();

var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';
//var userTable = process.env.userTable;
var ddb = new AWS.DynamoDB();


/* GET users listing. */
router.get('/', function(req, res, next) {

	var params = {
		TableName: "UserTable"
	};


	//TODO beautify returned json structure
	ddb.scan(params, function(err, data){
		if(err) res.status(500).send({ error: 'user, get, dynamo'});
		else res.json(data.Items);
	})
});

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
  		res.status(201).end();
  	}
  });



});

module.exports = router;
