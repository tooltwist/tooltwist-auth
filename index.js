
console.log('loaded tooltwist-auth');

var mongoose = require('mongoose')
	, UserModel = require('./models/user')
	, User = mongoose.model('User')
	, passport = require('passport')
	, LocalStrategy = require('passport-local').Strategy
	  ;



exports.initialize = function(app) {
	app.use(passport.initialize());
	app.use(passport.session());
	

	// Set up Authentication
	passport.serializeUser(function(user, done) {
	  done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
	  User.findById(id, function(err, user) {
	    done(err, user);
	  });
	});

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

	if ('development' == app.get('env')) {
	  mongoose.connect('mongodb://localhost/nodedemo');
	} else {
	  // insert db connection for production
	}
	
};

exports.addRoutes = function(app){
	app.get('/login', this.requireLevel0, exports.login);	
	app.get('/reset_password', this.requireLevel0, this.reset_password);
	app.post('/reset_password', this.requireLevel0, this.generate_password_reset);
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
	app.get('/dashboard', this.requireLevel2, this.dashboard);
	app.get('/logout', this.logout);



	app.get('/users', this.requireLevel1, this.list); // for illustrative purposes only
	
};

exports.start = function(callback){
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function() {
		callback();
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
	    res.redirect('/login?postAuthDestination='+postAuthDestination);
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







// Get login page
exports.login = function(req, res){
  res.render('tooltwist-auth/login', { postAuthDestination : req.query.postAuthDestination || "" });
}

// Get dashboard
exports.dashboard = function(req, res){
  res.render('users/dashboard');
}

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
      return res.redirect(req.body.postAuthDestination ? req.body.postAuthDestination : '/dashboard');
    });
  })(req, res, next);
}

// Get registration page
exports.register = function(req, res){
  res.render('tooltwist-auth/register', {user: new User({})});
}

// Log user out and redirect to home page
exports.logout = function(req, res){
  req.logout();
  res.redirect('/');
}

// Account page
exports.account = function(req,res){
  res.render('tooltwist-auth/edit');
}

// List all users
exports.list = function(req, res, next){
  User.find(function(err,users){
    if(err) return next(err);
    res.render('tooltwist-auth/index',{
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
		return res.render('tooltwist-auth/register', {
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

// Get password reset request
exports.reset_password = function(req, res){
  res.render('tooltwist-auth/reset_password');
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
    return res.redirect("/reset_password");
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
  res.render("tooltwist-auth/password_reset", {token : req.query.token, username : req.query.username});
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
        return res.render('tooltwist-auth/password_reset', {errorMessages: req.flash('error'), token : req.body.token, username : req.body.username});
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
          return res.redirect('/edit');
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
//					return res.redirect('tooltwist-auth/edit');
				    return res.render('tooltwist-auth/edit', {errorMessages: req.flash('success'), user:user });
				});
			});
		} else {
			req.flash('error', "Email verification time limit has expired.");
		    return res.render('tooltwist-auth/reset_password', {errorMessages: req.flash('error')});
		}
	});
};

/*
 *	A function to get the test framework running.
 */
exports.dummyTestFunction = function(){
	return 'abc';
};
