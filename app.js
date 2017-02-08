var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var index = require('./routes/index');
var users = require('./routes/users');
var AWS= require('aws-sdk');
AWS.config.region = 'us-east-1';
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', index);
app.use('/users', users);





//dyn= new AWS.DynamoDB({ endpoint: new AWS.Endpoint('http://localhost:8000') });
dyn = new AWS.DynamoDB();
/*
 var params = {
  AttributeDefinitions: [
     {
    AttributeName: "Artist", 
    AttributeType: "S"
   }, 
     {
    AttributeName: "SongTitle", 
    AttributeType: "S"
   }
  ], 
  KeySchema: [
     {
    AttributeName: "Artist", 
    KeyType: "HASH"
   }, 
     {
    AttributeName: "SongTitle", 
    KeyType: "RANGE"
   }
  ], 
  ProvisionedThroughput: {
   ReadCapacityUnits: 5, 
   WriteCapacityUnits: 5
  }, 
  TableName: "Music3"
 };
  dyn.createTable(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else{
     console.log(data);


   }                // successful response

 });
 */


     dyn.listTables(function (err, data)
      {
         console.log('listTables',err,data);
      });















var router = express.Router();
router.get('/', function(req,res){
  res.json({ message: 'lalalalala2;'});
});

router.route('/login')
  .post(function(req, res) {
    
    var token = jwt.sign(req.body, 'secret', {
      expiresIn:60*60*24
    });
    res.json({
      success:true,
      message: 'this is the tokken',
      token:token
    });
  })
  .get(function(req,res){
    res.json({ message: 'lalalalala;'});
    console.log(req);
  });
app.use('/', router);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
