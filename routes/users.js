var express = require('express');
var router = express.Router();

var AWS = require('aws-sdk');
console.log(process);
AWS.config.region = process.env.REGION;
var userTable = process.env.userTable;
var ddb = new AWS.DynamoDB();

/* GET users listing. */
router.get('/', function(req, res, next) {

	var params = {
		TableName: userTable
	};
	console.log(params);
	ddb.getItem(params, function(err, data){
		if(err) console.log(err);
		else console.log(data);
	})
  res.json(process.env);
});

module.exports = router;
