var cookie = require('cookie');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var AWS = require("aws-sdk");
var stripe = require("stripe")("sk_test_JCy56FAehenafOCX4DpsLILx");

var app = express();

var urlencodedParser = bodyParser.urlencoded({ extended: false })

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', index);
var users = require('./routes/users');
app.use('/users', users);

var login = require('./routes/login');
app.use('/login', login);


var router = express.Router();
app.use('/', router);


router.get('/index', function(req, res) {
	var cookies = cookie.parse(req.headers.cookie || '');
    AWS.config.update({
        region: "us-east-1",
    });
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "ItemTable"
    };
    docClient.scan(params, function(err, data) {
        if (err) res.status(500).send({ error: 'user, get, dynamo' });
        res.render(__dirname + '/views/index', { username : cookies.userToken, items: data.Items });
    })
    
});

router.get('/index/:itemId', function(req, res) {
    AWS.config.update({
        region: "us-east-1",
    });
    var docClient = new AWS.DynamoDB.DocumentClient();

    var params = {
        TableName: "ItemTable",
        Key:{
            "UUID" : req.params.itemId
        }
    };

    docClient.get(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            res.render(__dirname + '/views/item', {item :data.Item})
        }
    })
});




router.post('/transaction/', urlencodedParser, function(req, res) {
    console.log("arrived transaction POST page. ");    

    console.log("-------- req.body -----------");
    console.log(req.body);
    console.log("-----------------------------");

    var itemId = req.body.itemId;
    var token = req.body.stripeToken; // Using Express
    //var email = req.body.stripeEmail;

    // Create a Customer:
    stripe.customers.create({
        //email: email,
        source: token,
    }).then(function(customer) { // 那么then()的意义何在？前后代码段落直接顺接下来有问题吗？？
        // YOUR CODE: Save the customer ID and other info in a database for later.
        console.log("here is the payment process");
        var cookies = cookie.parse(req.headers.cookie || '');
        console.log("userName(Token)" + cookies.userToken);
        console.log("itemId: " + itemId);

        return stripe.charges.create({ 
            amount: 100,
            currency: "usd",
            customer: customer.id, // 这个ID是什么，打印出来看看？
        });
    }).then(function(charge) { // why ？
        return "is this?";
    }).then(function(string) {
        console.log(string);
    });

    res.render(__dirname + '/views/transaction');
});

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
