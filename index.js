var mongoose = require('mongoose')
	, UserModel = require('./models/user')
	, User = mongoose.model('User')
	, passport = require('passport')
	, engine = require('ejs-locals')
    , http = require('http')
	, flash = require('connect-flash')
	, path = require('path')
	, expressValidator = require('express-validator')
    , mailer = require('express-mailer')
	, LocalStrategy = require('passport-local').Strategy
;

var DEBUGGING = true;
var _env = null;
var _app = null;
var template_home = 'tooltwist-auth/home';
var template_home_signedIn = 'tooltwist-auth/dashboard';
var template_login = 'tooltwist-auth/login';
var template_register = 'tooltwist-auth/register';
var template_account = 'tooltwist-auth/account';
var template_request_password_reset = 'tooltwist-auth/request_password_reset';
var template_password_reset = 'tooltwist-auth/password_reset';
var template_error_500 = 'tooltwist-auth/500'

var default_url_when_signedIn = '/dashboard';



exports.initialize = function(dir, express, app, config) {
	_env = app.get('env'); // will be 'development' or 'production'
	_app = app;
	
	// Load the configuration.
	if ( !config) {
		// Load config from file
		console.log('Loading config')
	    config = require(dir + '/config');
	}

	// Override default pages
	if (config.auth.templates.home)
		template_home = config.auth.templates.home;
	if (config.auth.templates.home_signedIn)
		template_home_signedIn = config.auth.templates.home_signedIn;
	if (config.auth.templates.login)
		template_login = config.auth.templates.login;
	if (config.auth.templates.register)
		template_register = config.auth.templates.register;
	if (config.auth.templates.account)
		template_account = config.auth.templates.account;
	if (config.auth.templates.request_password_reset)
		template_request_password_reset = config.auth.templates.request_password_reset;
	if (config.auth.templates.password_reset)
		template_password_reset = config.auth.templates.password_reset;
	if (config.auth.templates.error_500)
		template_error_500 = config.auth.templates.error_500;
	
	// Allow override of the url used for the home page, when signed in.
	if (config.auth.default_url_when_signedIn)
		default_url_when_signedIn = config.auth.default_url_when_signedIn;
	
	// Set up the express server.
	app.engine('ejs', engine);
	app.set('port', process.env.PORT || config.server.PORT);
	app.set('views', dir + '/views');
	app.set('view engine', 'ejs');
	app.use(express.favicon("public/img/favicon.ico"));
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(expressValidator);
	app.use(express.methodOverride());
	app.use(express.cookieParser('your secret here'));
	app.use(express.session());
	app.use(flash());


	// Set up Authentication
	app.use(passport.initialize());
	app.use(passport.session());
	
	passport.serializeUser(function(user, done) {
	  done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
	  User.findById(id, function(err, user) {
	    done(err, user);
	  });
	});

	// Use local authentication (i.e. Not Facebook, LinkedIn, etc)
	passport.use(new LocalStrategy(
	  function(username, password, done) {
	    User.findOne({ username: username }, function (err, user) {
	      if (err) return done(err);
	      if (!user) return done(null, false, { message: "Sorry, unknown username/password." });
	      user.validPassword(password, function(err, isMatch){
	        if(err) return done(err);
	        if(isMatch) return done(null, user);
	        else done(null, false, { message: 'Sorry, unknown username/password.' });
	      });
	    });
	  }
	));


	// Database Connection

	if (_env === 'development') {
	  mongoose.connect('mongodb://localhost/nodedemo');
	} else {
	  // insert db connection for production
	}
	

	// Set variables to be avaiable for the views.
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
	    user: config.mandrill[_env].MANDRILL_USERNAME,
	    pass: config.mandrill[_env].MANDRILL_API_KEY
	  }
	});
	

	// Routing Initializers
	app.use(express.static(path.join(dir, 'public')));
	app.use(app.router);
	

	// Error Handling
	if (_env === 'development') {

		// Standard error handler
		app.use(express.errorHandler());
	} else {

		// Display our own page
		app.use(function(err, req, res, next) {
			res.render(template_error_500, { status: 500 });
		});
	}
	
};

exports.addRoutes = function(app){

	// Routing for the home page
	app.get('/', function(req, res){
	  if (req.isAuthenticated()) {
		  return res.redirect(default_url_when_signedIn);	  	
	  } else {
		  return res.render(template_home);
	  }
	});
	
	// The redirected-to home page, when the user is signed in.
	app.get(default_url_when_signedIn, this.requireLevel2, function(req, res){
	  res.render(template_home_signedIn);
	});
	
	
	// Login page
	app.get('/login', this.requireLevel0,function(req, res){
	  res.render(template_login, { postAuthDestination : req.query.postAuthDestination || "" });
	});
	
	// Request password reset
	app.get('/request_password_reset', this.requireLevel0, function(req, res){
		res.render(template_request_password_reset);
	});
	app.post('/request_password_reset', this.requireLevel0, this.generate_password_reset);
	
	// Reply from the email
	app.get('/password_reset', this.requireLevel0, this.password_reset);
	app.post('/password_reset', this.requireLevel0, this.process_password_reset);
	
	//app.get('/email_verify', this.requireLevel0, this.email_verify);
	app.get('/email_verify', this.email_verify);
	//app.post('/password_verify', this.requireLevel0, this.process_password_verify);
	app.post('/login', this.requireLevel0, this.authenticate);
	app.get('/register', this.requireLevel0, this.register);
	app.post('/register', this.requireLevel0, this.registrationValidations, this.create);
	app.get('/account', this.requireLevel1, this.account);
	app.post('/account', this.requireLevel1, this.accountValidations, this.update);
	
	
	app.get('/logout', this.logout);



	if (DEBUGGING) {
		console.log('\n\n\n\n');
		console.log('WARNING: The /users URL is activated, and poses a security risk.');
		console.log('         Set DEBUGGING to false to de-activate.')
		console.log('\n\n\n');

		app.get('/users', this.requireLevel1, this.listUsers); // for illustrative purposes only
	}
	
};

exports.start = function(callback){
	

	// Handle 404 gracefully
	// This must happen after all other routes have been added.
	_app.all('*', function(req, res){
	  req.flash('error', "That doesn't seem to be a page.");
	  res.redirect('/');
	});
	
	// Open the database
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
		
		// Start the server
		http.createServer(_app).listen(_app.get('port'), function(){
			console.log('Express server listening on port ' + _app.get('port'));
			return callback();
		});
	});
	
}


/**
 *	Require Level 0 - no authentication
 *	If the user is currently authenticated, redirect to the home page.
 */
exports.requireLevel0 = function requireLevel0(req, res, next){
  if (req.isAuthenticated()) return res.redirect('/');
  next();
};

/**
 *	Require level 1 - authenticated, but not necessarily all details have been entered.
 *	If the user is not authenticated then go to the login page.
 */
exports.requireLevel1 = function requireLevel1(req, res, next){
console.log('requireLevel1')
  if (req.isAuthenticated()) return next();
  req.flash('error', 'Please sign in to continue.');
  var postAuthDestination = req.url;
  res.redirect('/login?postAuthDestination='+postAuthDestination);
};


/**
 *	Require Level 2 - Authenticated, and all required details present.
 *	If the user is not aithenticaed, go to the login page.
 *	If the details are not all entered, go to the account details page.
 */
exports.requireLevel2 = function requireLevel2(req, res, next){
	console.log('requireLevel2', req.user)

	if ( !req.isAuthenticated() || !req.user){
	    req.flash('error', 'Please sign in to continue.');
	    var postAuthDestination = req.url;
	    return res.redirect('/login?postAuthDestination='+postAuthDestination);
	}
	
	// We have a user record
	// Check we have all the required details
	var allMissing = true;
	var someMissing = false;
	if (req.user.firstName === '') {
		someMissing = true;
	} else {
		allMissing = false;
	}
	if (req.user.LastName === '') {
		someMissing = true;
	} else {
		allMissing = false;
	}
		
	if (allMissing) {
		
		// Have no users details yet
		console.log('Missing some user details')
	    req.flash('error', 'Please enter the following details.');			
		res.redirect('/account');
	} else if (someMissing) {
		
		// Have incomplete user details
		console.log('Missing some user details')
	    req.flash('error', 'Please enter the missing details.');
		res.redirect('/account');
	} else {
		
		// All ok
		console.log('Have full user details')
		return next();
	}
};








// Authenticate user
exports.authenticate = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { 
      req.flash('error', info.message);
      return res.redirect(req.body.postAuthDestination ? '/login?postAuthDestination='+req.body.postAuthDestination : '/login');
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
	  
	  // If the request contains a url, jump there, otherwise to the default signed-in page.
	  var whereToGo = req.body.postAuthDestination ? req.body.postAuthDestination : default_url_when_signedIn;
      return res.redirect(whereToGo);
    });
  })(req, res, next);
}

// Get registration page
exports.register = function(req, res){
  res.render(template_register, {user: new User({})});
}

// Log user out and redirect to home page
exports.logout = function(req, res){
  req.logout();
  res.redirect('/');
}

// Account page
exports.account = function(req,res){
  res.render(template_account);
}

// List all users
exports.listUsers = function(req, res, next){
  User.find(function(err,users){
    if(err) return next(err);
//    res.render('tooltwist-auth/index',{
    res.render('auth-local/user_list',{
      users:users
    });
  });
}

// Update user
exports.update = function(req, res, next){
  var user = req.user;
  // remove password attribute from form if not changing
  if (!req.body.password) delete req.body.password;
  // ensure valid current password
  user.validPassword(req.body.currentPassword, function(err, isMatch){
    if(err) return next(err);
    if(isMatch) return updateUser();
    else return failedPasswordConfirmation();
  });
  // Handle correct current password and changes to user
  function updateUser(){
    // use save instead of update to trigger 'save' event for password hashing
	
console.log('REQUEST IS ', req.body)
	if (!user.termsAccepted_v1) user.termsAccepted_v1 = false;
    user.set(req.body);
    user.save(function(err, user){
      
      // Uniqueness and Save Validations
      
      if (err && err.code == 11001){
        var duplicatedAttribute = err.err.split("$")[1].split("_")[0];
        req.flash('error', "That " + duplicatedAttribute + " is already in use.");
        return res.redirect('/account');
      }
      if(err) return next(err);
      
      // User updated successfully, redirecting
      
      req.flash('success', "Account updated successfully.");
      return res.redirect('/account');
    });
  }
  // Handle incorrect current password entry
  function failedPasswordConfirmation(){
    req.flash('error', "Incorrect current password.");
    return res.redirect("/account");
  }
}

// Create user
exports.create = function(req, res, next){
  var newUser = new User(req.body);
  newUser.save(function(err, user){
    
    // Uniqueness and save validations
    
    if (err && err.code == 11000){
      var duplicatedAttribute = err.err.split("$")[1].split("_")[0];
      req.flash('error', "That " + duplicatedAttribute + " is already in use.");
      return res.render('welcome/index.ejs', {user : newUser, errorMessages: req.flash('error')});
    }
    if(err) return next(err);
	
	// New user record created. Send the verification email
console.log('need to send verify email')	
    user.generatePerishableToken(function(err,token){
      if(err) return next(err);
      // Generated reset token, saving to user
      user.update({
        resetPasswordToken : token,
        resetPasswordTokenCreatedAt : Date.now()
      }, function(err){
        if(err) return next(err);
	
console.log('token is ' + token)	
	
	    res.mailer.send('mailer/password_verify', {
	        to: user.email,
	        subject: 'Please verify this contact email for your ToolTwist account.',
	        username: user.username,
	        token: token,
	        urlBase: "http://"+req.headers.host+"/email_verify"
	      }, function(err) {
	        if(err) return next(err);
	        // Sent email instructions, alerting user
			//ZZZ Need better message. Maybe a popup
	        req.flash('success', "You will receive an email to verify your password at "+req.body.email+".");
	        res.redirect('/');
	      });
		});
	});	
	  /*
    // New user created successfully, logging In
    
    req.login(user, function(err) {
      if (err) { return next(err); }
      req.flash('success', "Account created successfully!");
      return res.redirect('/account');
    });
	  */
  });
}

//	Validations for user on initial the registration
//	page, which has the minimal number of fields.
exports.registrationValidations = function(req, res, next) {

	// We'll use email address as the username
	//	  req.assert('username', 'Username is required.').notEmpty();
	req.body.username = req.body.email;

	// Check email and password are provided
	req.assert('email', 'You must provide an email address.').notEmpty();
	req.assert('email', 'Your email address must be valid.').isEmail();
	req.assert('password', 'Your password must be 6 to 20 characters long.').len(6, 20);

	// If there were errors, stay on the registration page.
	var validationErrors = req.validationErrors() || [];
	if (validationErrors.length > 0) {

		validationErrors.forEach(function(e) {
			req.flash('error', e.msg);
		});

		// Stay on the registration page
		return res.render(template_register, {
			user: new User(req.body),
			errorMessages: req.flash('error')
		});
		// return res.render('welcome/index.ejs', {
		// 	user : new User(req.body),
		// 	errorMessages: req.flash('error')
		// });
	}

	// All validations passed.
	next();
}

// Validations for user objects upon user update or create
exports.accountValidations = function(req, res, next) {
	var validationErrors = req.validationErrors() || [];
	
	// Check we have first and last name.
	req.assert('firstName', 'First Name is required.').notEmpty();
	req.assert('lastName', 'Last Name is required.').notEmpty();
	
	//ZZZZZ
	// Check Terms and Conditions are accepted
	
	// If the password is provided, check the confirmation password matches
	if (req.body.password) {
		req.assert('password', 'Your password must be 6 to 20 characters long.').len(6, 20);
	}
	if (req.body.password != req.body.passwordConfirmation) {
		// Passwords don't match
		validationErrors.push({
			msg: "Password and password confirmation did not match."
		});
	}
	
	// If there are errors go back to the account page.
	if (validationErrors.length > 0) {
		validationErrors.forEach(function(e) {
			req.flash('error', e.msg);
		});
		// Create handling if errors present
		// Update handling if errors present
		return res.redirect("/account");
	}

	// All validations passed.
	next();
}

// Process password reset request
exports.generate_password_reset = function(req, res, next){

  // Validations
  req.assert('email', 'You must provide an email address.').notEmpty();
  req.assert('email', 'Your email address must be valid.').isEmail();
  var validationErrors = req.validationErrors() || [];
  if (validationErrors.length > 0){
    validationErrors.forEach(function(e){
      req.flash('error', e.msg);
    });
    return res.redirect('/request_password_reset');
  }
  
  // Passed validations
  User.findOne({email:req.body.email}, function(err, user){
    if(err) return next(err);
    if(!user){
      // Mimic real behavior if someone is attempting to guess passwords
      req.flash('success', "You will receive a link to reset your password at "+req.body.email+".");
      return res.redirect('/');
    }
    user.generatePerishableToken(function(err,token){
      if(err) return next(err);
      // Generated reset token, saving to user
      user.update({
        resetPasswordToken : token,
        resetPasswordTokenCreatedAt : Date.now()
      }, function(err){
        if(err) return next(err);
        // Saved token to user, sending email instructions
        res.mailer.send('mailer/password_reset', {
            to: user.email,
            subject: 'Password Reset Request',
            username: user.username,
            token: token,
            urlBase: "http://"+req.headers.host+"/password_reset"
          }, function(err) {
            if(err) return next(err);
            // Sent email instructions, alerting user
            req.flash('success', "You will receive a link to reset your password at "+req.body.email+".");
            res.redirect('/');
          });
      });
    });
  });
}


// Go to password reset page
exports.password_reset = function(req, res, next){
  res.render(template_password_reset, {token : req.query.token, username : req.query.username});
}


// Verify passport reset and update password
exports.process_password_reset = function(req, res, next){
  User.findOne({username:req.body.username}, function(err, user){
    if(err) return next(err);
    if(!user){
      req.flash('error', "Password reset token invalid.");
      return res.redirect("/");
    }
    var tokenExpiration =  3 // time in hours
    if(req.body.token == user.resetPasswordToken && Date.now() < (user.resetPasswordTokenCreatedAt.getTime() + tokenExpiration * 3600000)){
      // Token approved, on to new password validations
      req.assert('password', 'Your password must be 6 to 20 characters long.').len(6, 20);
      var validationErrors = req.validationErrors() || [];
      if (req.body.password != req.body.passwordConfirmation) validationErrors.push({msg:"Password and password confirmation did not match."});
      if (validationErrors.length > 0){
        validationErrors.forEach(function(e){
          req.flash('error', e.msg);
        });
        return res.render(template_password_reset, {errorMessages: req.flash('error'), token : req.body.token, username : req.body.username});
      }
      // Passed new password validations, updating password
      user.set(req.body);
	user.validatedEmail = true;
      user.save(function(err, user){
        if(err) return next(err);
        // Password updated successfully, logging In
        req.login(user, function(err) {
          if (err) { return next(err); }
          req.flash('success', "Password updated successfully, you are now logged in.");
          return res.redirect('/account');
        });
      });
    } else {
      req.flash('error', "Password reset token has expired.");
      return res.redirect("/");
    }
  });
}

// Link on verification email was pressed.
exports.email_verify = function(req, res, next) {

	console.log("exports.email_verify: username=", req.body.username)
	
	console.log("req.body=", req.body)
	console.log("req.query=", req.query)
	
	
	// Get the user record
	User.findOne({
		username: req.query.username
	}, function(err, user) {
		
		// Check the record exists
		if (err) return next(err);
		if (!user) {
			req.flash('error', "Password reset token invalid.");
			return res.redirect("/");
		}
		
		// Check the toen has not expired
		var tokenExpiration = 333 // time in hours ZZZZZ
		if (
			req.query.token == user.resetPasswordToken
			&&
			Date.now() < (user.resetPasswordTokenCreatedAt.getTime() + tokenExpiration * 3600000)
		) {
			
			/*
			// Token approved, on to new password validations
			req.assert('password', 'Your password must be 6 to 20 characters long.').len(6, 20);
			var validationErrors = req.validationErrors() || [];
			if (req.query.password != req.body.passwordConfirmation) validationErrors.push({
				msg: "Password and password confirmation did not match."
			});
			if (validationErrors.length > 0) {
				validationErrors.forEach(function(e) {
					req.flash('error', e.msg);
				});
				return res.render('tooltwist-auth/password_reset', {
					errorMessages: req.flash('error'),
					token: req.body.token,
					username: req.body.username
				});
			}
			*/
			
			// All good so far
			
			// Passed new password validations, updating password
			user.set(req.body);
console.log("user=", user)
			user.validatedEmail = true;
			user.save(function(err, user) {
				if (err) return next(err);
				// Password updated successfully, logging In
				req.login(user, function(err) {
					if (err) {
						return next(err);
					}
					req.flash('success', "Password updated successfully, you are now logged in.");
				    return res.render(template_account, {errorMessages: req.flash('success'), user:user });
				});
			});
		} else {
			req.flash('error', "Email verification time limit has expired.");
		    return res.render(template_request_password_reset, {errorMessages: req.flash('error')});
		}
	});
};

/*
 *	A function to get the test framework running.
 */
exports.dummyTestFunction = function(){
	return 'abc';
};
