// Module Dependencies and Setup

var express = require('express')
  , example = require('./controllers/example')
  , app = express()
  , auth = require('tooltwist-auth')
  , config = require('./config')
	  ;


auth.initialize(__dirname, express, app);



// Routing
auth.addRoutes(app);




// Example pages
app.get('/example/publicPage', example.publicPage);
app.get('/example/privatePage', auth.requireLevel2, example.privatePage);





// Start Server w/ DB Connection
auth.start(function(){
	// Server started
});

