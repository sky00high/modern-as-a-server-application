var cookie = require('cookie');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var AWS = require("aws-sdk");
var stripe = require("stripe")("sk_test_JCy56FAehenafOCX4DpsLILx");
var jwt = require('jsonwebtoken');
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
	console.log("====== date ======");
	console.log(new Date().toString(36)); // the presicion is only to the second. Not that precise. May have issue when mulple users.

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
        var username = jwt.verify(cookies.userToken, 'shhhhh')
        res.render(__dirname + '/views/index', { username : username, items: data.Items });
    })
});

router.get('/index/:itemId', function(req, res) {
	var cookies = cookie.parse(req.headers.cookie || '');
	if (!cookies.userToken) {
		res.redirect('/login');
	} 
	
	var username = jwt.verify(cookies.userToken, 'shhhhh');
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

router.get('/history', function(req, res) {
	var cookies = cookie.parse(req.headers.cookie || '');
	var username = jwt.verify(cookies.userToken, 'shhhhh');

    var docClient = new AWS.DynamoDB.DocumentClient();

	var params = {
	    TableName : "PaymentTable",
	    IndexName : "username",
	    KeyConditionExpression: "username = :yyyy", // ?
	    ExpressionAttributeValues: {
	        ":yyyy" : username
	    }
	};

	docClient.query(params, function(err, data) {
	    if (err) {
	        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
	    } else {
	        console.log("Query succeeded.");
	        console.log(data.Items);
	        res.render(__dirname + '/views/history', {username : username, payments : data.Items});
	    }
	});

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
        var username = jwt.verify(cookies.userToken, 'shhhhh')
        var date = new Date();
        var UUID = (+date).toString(36);
        console.log("UUID: " + UUID);
        console.log("userName(Token)" + username);
        console.log("itemId: " + itemId);

		var docClient = new AWS.DynamoDB.DocumentClient();

		var params = {
		    TableName: "PaymentTable",
		    Item: {
		        "UUID": UUID,
		        "username" : username,
		        "itemId" : itemId,
		        "timestamp" : date.toString(),
		        "price" : "$10.00"
		    }
		};

		docClient.put(params, function(err, data) {
		    if (err) {
		        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
		    } else {
		        console.log("Added item:", JSON.stringify(data, null, 2));
		    }
		});

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
