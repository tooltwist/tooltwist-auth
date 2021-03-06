#! /usr/bin/env node

var fs = require('fs')
	, mkdirp = require('mkdirp')
	;

// See what the command line options are present
// Definition of command line parameters
var stdio = require('stdio');
var ops = stdio.getopt({
	/*
	'init': {
		key: 'i',
		args: 1,
		description: 'Create a new project with [name].'
	},
	'templates': {
		key: 't',
		args: 0,
		description: 'Skip git pull'
	},
	'repo': {
		key: 'r',
		args: 1,
		description: 'Existing [repository]'
	},
	'branch': {
		key: 'b',
		args: 1,
		description: '[branch] (only when initially downloading repo)'
	},
	'template-dir': {
		key: 't',
		args: 1,
		description: 'Directory containing overridden templates'
	},
	*/
});

function newProject(name) {
	//console.log('newProject ' + name);
	
	// Check the directory doesn't already exist
	var dir = './' + name;
	if (fs.existsSync(to)) {
		console.log('Error: project ' + name + ' already exists.');
//ZZZ		process.exit(1);
	}
	
	// Create the new directories
	mkdirp.sync(name);
	mkdirp.sync(name + '/controllers');
	mkdirp.sync(name + '/views');
	mkdirp.sync(name + '/views/example');
	mkdirp.sync(name + '/views/shared');
	mkdirp.sync(name + '/views/tooltwist-auth');
	mkdirp.sync(name + '/public');
	mkdirp.sync(name + '/public/bootstrap-3.1.1');
	mkdirp.sync(name + '/public/css');
	mkdirp.sync(name + '/public/img');
	mkdirp.sync(name + '/public/js');
	mkdirp.sync(name + '/public/jquery-2.0.3');


	function copy(from, to) {
		if ( !fs.existsSync(to)) {
			//console.log('  ' + to);
			var output = fs.readFileSync(__dirname + '/templates/' + from);
			fs.writeFileSync(to, output, { encoding: 'utf8' });
		}
	}
	
	// Create example controller and views
	copy("controllers/example.js", name + '/controllers/example.js');
	copy("views/example/privatePage.ejs", name + '/views/example/privatePage.ejs');
	copy("views/example/publicPage.ejs", name + '/views/example/publicPage.ejs');
	copy("views/example/aboutUs.ejs", name + '/views/example/aboutUs.ejs');
	
	// Layouts
	copy("views/shared/alert_messages.ejs", name + '/views/shared/alert_messages.ejs');
	copy("views/shared/layout.ejs", name + '/views/shared/layout.ejs');
	copy("views/shared/footer.ejs", name + '/views/shared/footer.ejs');
	copy("views/shared/layout-login.ejs", name + '/views/shared/layout-login.ejs');
	copy("views/shared/navigation.ejs", name + '/views/shared/navigation.ejs');
	
	// CSS
	copy("public/css/main.css", name + '/public/css/main.css');
	
	// Javascript
	copy("public/js/main.js", name + '/public/js/main.js');
	
	// Bootstrap
	copy("public/bootstrap-3.1.1/bootstrap.min.css", name + '/public/bootstrap-3.1.1/bootstrap.min.css');
	copy("public/bootstrap-3.1.1/bootstrap.min.js", name + '/public/bootstrap-3.1.1/bootstrap.min.js');

	// jQuery
	copy("public/jquery-2.0.3/jquery.min.js", name + '/public/jquery-2.0.3/jquery.min.js');
	
	// Images
	copy("public/img/bg1.jpg", name + '/public/img/bg1.jpg');
	copy("public/img/bg2.png", name + '/public/img/bg2.png');
	copy("public/img/ttlogo.png", name + '/public/img/ttlogo.png');
	copy("public/img/ttlogo-small.png", name + '/public/img/ttlogo-small.png');
	copy("public/img/generic-icon.png", name + '/public/img/generic-icon.png');
	copy("public/img/icon-check.png", name + '/public/img/icon-check.png');
	copy("public/img/favicon.ico", name + '/public/img/favicon.ico');
	
	// Create the default views
	var to = name + '/views/tooltwist-auth/account.ejs';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/views/account.ejs"
		var output = fs.readFileSync(from, "utf8");
		fs.writeFileSync(to, output, { encoding: 'utf8' });
	}
	copy('views/contact.ejs', name + '/views/tooltwist-auth/contact.ejs');
	copy('views/contactThanks.ejs', name + '/views/tooltwist-auth/contactThanks.ejs');
	var to = name + '/views/tooltwist-auth/error_500.ejs';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/views/error_500.ejs"
		var output = fs.readFileSync(from, "utf8");
		fs.writeFileSync(to, output, { encoding: 'utf8' });
	}
	copy('views/home.ejs', name + '/views/tooltwist-auth/home.ejs');
	copy('views/home_signedIn.ejs', name + '/views/tooltwist-auth/home_signedIn.ejs');
	var to = name + '/views/tooltwist-auth/login.ejs';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/views/login.ejs"
		var output = fs.readFileSync(from, "utf8");
		fs.writeFileSync(to, output, { encoding: 'utf8' });
	}
	var to = name + '/views/tooltwist-auth/password_reset.ejs';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/views/password_reset.ejs"
		var output = fs.readFileSync(from, "utf8");
		fs.writeFileSync(to, output, { encoding: 'utf8' });
	}
	var to = name + '/views/tooltwist-auth/register.ejs';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/views/register.ejs"
		var output = fs.readFileSync(from, "utf8");
		fs.writeFileSync(to, output, { encoding: 'utf8' });
	}
	var to = name + '/views/tooltwist-auth/request_password_reset.ejs';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/views/request_password_reset.ejs"
		var output = fs.readFileSync(from, "utf8");
		fs.writeFileSync(to, output, { encoding: 'utf8' });
	}
	var to = name + '/views/tooltwist-auth/user_list.ejs';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/views/user_list.ejs"
		var output = fs.readFileSync(from, "utf8");
		fs.writeFileSync(to, output, { encoding: 'utf8' });
	}
	
	// Create the initial project files
	var to = name + '/app.js';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/app.js"
		var output = fs.readFileSync(from, "utf8");
		fs.writeFileSync(to, output, { encoding: 'utf8' });
	}
	var to = name + '/package.json';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/package.json"
		var output = fs.readFileSync(from, "utf8");
		fs.writeFileSync(to, output, { encoding: 'utf8' });
	}
	copy('config.js.example', name + '/config.js.example');
	copy('config.js.example', name + '/config.js');
}

function usage() {
	console.log('');
	console.log('Usage:');
	console.log('  ' + process.argv[1] + ' init <projectName>');
	// console.log('Usage:');
	// console.log('Usage:');
	// console.log('Usage:');
	console.log('');
	process.exit(1);
}

// Here is the main function
(function main() {
	
	// Check the command line options
	//console.log('ops=', ops)
	if (ops.args && ops.args[0] == 'init') {
		//console.log('\nInitialise project ' + ops.args[1]);
		if (ops.args.length != 2) usage();
		var projectName = ops.args[1];
		newProject(projectName);
		console.log('Project directory ' + projectName + ' has been created.')
	}

})(); // end of main()
