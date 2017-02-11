var cookie = require('cookie');
var express = require('express');
var jwt = require('jsonwebtoken');
var AWS = require('aws-sdk');
AWS.config.region = 'us-east-1';

var ddb = new AWS.DynamoDB();

var router = express.Router();

router.route('/')
  .get(function(req, res) {
    console.log("arrived login GET");
    res.render('../views/login');
  })
  .post(function(req, res) {
    console.log("arrived login POST");
    if(!req.body.username) res.status(400).send({error:"no username provided"});
    if(!req.body.password) res.status(400).send({error:"no password provided"});

    var username = req.body.username;
    var password = req.body.password;
    var params = {
      Key: {
        "username" : {
          S : username
        }
      },
      TableName: "UserTable"
    };

    ddb.getItem(params, function(err, data){
      if(err){
        var errCode = 500;
        if (err.code === 'ResourceNotFoundException') {
          returnStatus = 404;
        }
        res.status(returnStatus).end();
        console.log('DDB Error: ' + err);
      } else {
        if(!data.Item) res.status(404).send({error : "cannot find user"});
        var correctPassword = data.Item.password.S;
        if(correctPassword == password){
          var token = jwt.sign(username, 'shhhhh');  
          res.cookie('userToken', token); 
          res.redirect('/');
          
        } else {
          res.status(401).send({error: "wrong password"});
          res.render('../views/login');
        }
      }
    });
  });
  

module.exports = router;