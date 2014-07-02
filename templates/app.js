// Module Dependencies and Setup

var express = require('express')
  , welcome = require('./controllers/welcome')
  , http = require('http')
  , path = require('path')
  , engine = require('ejs-locals')
  , flash = require('connect-flash')
  , expressValidator = require('express-validator')
  , mailer = require('express-mailer')
  , config = require('./config')
  , app = express()
//  , auth = require('./tooltwist-auth/tooltwist-auth')
  , auth = require('tooltwist-auth')
	  ;

app.engine('ejs', engine);
app.set('port', process.env.PORT || config.server.PORT);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon("public/img/favicon.ico"));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(expressValidator);
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(flash());

auth.initialize(app);

// Helpers

app.use(function(req, res, next){
  res.locals.userIsAuthenticated = req.isAuthenticated(); // check for user authentication
  res.locals.user = req.user; // make user available in all views
  res.locals.errorMessages = req.flash('error'); // make error alert messages available in all views
  res.locals.successMessages = req.flash('success'); // make success messages available in all views
  app.locals.layoutPath = "../shared/layout";
  app.locals.layoutPathLogin = "../shared/login";
  next();
});

// Mailer Setup

mailer.extend(app, {
  from: 'no-reply@example.com',
  host: 'smtp.mandrillapp.com', // hostname
  // secureConnection: true, // use SSL
  port: 587, // port for Mandrill
  transportMethod: 'SMTP', // default is SMTP. Accepts anything that nodemailer accepts
  auth: {
    user: config.mandrill.MANDRILL_USERNAME,
    pass: config.mandrill.MANDRILL_API_KEY
  }
});

// Routing Initializers

app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// Error Handling

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
} else {
  app.use(function(err, req, res, next) {
    res.render('errors/500', { status: 500 });
  });
}

// Routing
auth.addRoutes(app);

app.get('/', function(){
    if(req.isAuthenticated()) return res.redirect('/dashboard');
    res.render('welcome/index');
	
});




// Added by phil
//app.get('/products/retailremote', welcome.products_retailremote);
app.get('/casestudy/pcm', welcome.casestudy_pcm);
app.get('/casestudy/skysoftware', welcome.casestudy_skysoftware);
app.get('/casestudy/trackmotion', welcome.casestudy_trackmotion);
app.get('/casestudy/rpdata', welcome.casestudy_rpdata);

app.get('/api/retailremote', auth.requireLevel2, welcome.api_retailremote);
app.get('/api/tooltwist', welcome.api_tooltwist);
app.get('/api/tea', welcome.api_tea);

app.get('/product/useme.tv', welcome.products_usemetv);
app.get('/product/online', welcome.products_online);
app.get('/product/designer', welcome.products_designer);
app.get('/product/publish', welcome.products_publish);
app.get('/product/tea', welcome.products_tea);
app.get('/product/workbench', welcome.products_workbench);
app.get('/product/analytics', welcome.products_analytics);

app.get('/aboutUs', welcome.aboutUs);


// Catch-all
app.all('*', function(){
	// The flash message will be displayed on the top of the page.
    req.flash('error', "That doesn't seem to be a page.");
    res.redirect('/');	
});





// Start Server w/ DB Connection
auth.start(function(){
	
	
  http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });
	
});

