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
	console.log('newProject ' + name);
	
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
	mkdirp.sync(name + '/views/tooltwist-auth');
	mkdirp.sync(name + '/public');
	mkdirp.sync(name + '/public/css');
	mkdirp.sync(name + '/public/img');
	mkdirp.sync(name + '/public/js');
	
	// Create the default views
	var to = name + '/views/tooltwist-auth/edit.ejs';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/views/edit.ejs"
		var output = fs.readFileSync(from, "utf8");
		fs.writeFileSync(to, output, { encoding: 'utf8' });
	}
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
	var to = name + '/views/tooltwist-auth/reset_password.ejs';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/views/reset_password.ejs"
		var output = fs.readFileSync(from, "utf8");
		fs.writeFileSync(to, output, { encoding: 'utf8' });
	}
	var to = name + '/views/tooltwist-auth/user_list.ejs';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/views/user_list.ejs"
		var output = fs.readFileSync(from, "utf8");
		fs.writeFileSync(to, output, { encoding: 'utf8' });
	}
	var to = name + '/views/tooltwist-auth/500.ejs';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/views/500.ejs"
		var output = fs.readFileSync(from, "utf8");
		fs.writeFileSync(to, output, { encoding: 'utf8' });
	}
	var to = name + '/views/index.ejs';
	if ( !fs.existsSync(to)) {
		var from = __dirname + "/templates/views/index.ejs"
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
}


// Here is the main function
(function main() {
	
	// Check the command line options
	console.log('ops=', ops)
	if (ops.args && ops.args[0] == 'init') {
		console.log('\nInitialise project ' + ops.args[1]);
		var projectName = ops.args[1];
		newProject(projectName);
	}

})(); // end of main()
