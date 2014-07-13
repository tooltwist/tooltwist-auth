var redis = require('redis').createClient();


var cartId = null;

var aTest = function () {
	this.World = require("../support/world.js").World;



	this.Given(/^a clean quiz database$/, function(callback) {

		// Clear out existing quizzes from REDIS
		console.log("Deleting existing quizzes");
		redis.keys("quiz-*", function(err, replies){
			if (err) return callback(err);
		    replies.forEach(function (key, i) {
		        console.log("  deleting key " + key);
		        redis.del(key);
		    });
			callback();
		});

	});

	this.When(/^I call the web service to update a quiz with no id$/, function(callback) {

		// Add the item to the shopping cart
		var quiz = createQuiz();
		// {
		// 		cartId : cartId,
		// 		productId: productId,
		// 		qty: qty
		// };
		this.POST('http://localhost:8080/quiz', quiz, callback, function(json){
//			console.log("Have cart ", cart);
			callback();
		});
	});

	this.Then(/^the reply should contain the quiz id$/, function(callback) {
	  // express the regexp above with the code you wish you had
	  callback.pending();
	});

	this.Then(/^the reply should contain hasBeenUsed is false$/, function(callback) {
	  // express the regexp above with the code you wish you had
	  callback.pending();
	});

	this.Given(/^the quiz from the previous scenario$/, function(callback) {
	  // express the regexp above with the code you wish you had
	  callback.pending();
	});

	this.When(/^I select the quiz with the quiz id$/, function(callback) {
	  // express the regexp above with the code you wish you had
	  callback.pending();
	});

	this.Then(/^the reply should contain the quiz details$/, function(callback) {
	  // express the regexp above with the code you wish you had
	  callback.pending();
	});

	this.When(/^I select the quiz with the wrong quiz$/, function(callback) {
	  // express the regexp above with the code you wish you had
	  callback.pending();
	});

	this.Then(/^the reply should contain an error$/, function(callback) {
	  // express the regexp above with the code you wish you had
	  callback.pending();
	});

	this.When(/^I update the quiz$/, function(callback) {
	  // express the regexp above with the code you wish you had
	  callback.pending();
	});

	this.Then(/^the database should contain the quiz details$/, function(callback) {
	  // express the regexp above with the code you wish you had
	  callback.pending();
	});

	this.When(/^the user submits answers$/, function(callback) {
	  // express the regexp above with the code you wish you had
	  callback.pending();
	});

	this.Then(/^the database should contain the user's answers$/, function(callback) {
	  // express the regexp above with the code you wish you had
	  callback.pending();
	});

};

var createQuiz = function() {

	var quiz = {
		description: 'Ways to skin a cat',
		ownerRepository: 'philcal/quizMe',
		questions: [
			{
				question: "How many feet does a cat have?",
				choices: [
					"3 feet",
					"2 feet",
					"4 feet",
					"none of the above"
				],
				correctAnswer: 3,
				explanation: "Cats are a quadruped, and have two legs at the front and two at the back."
			},
			{
				question: "Do cats always land on their feet?",
				choices: [
					"yes",
					"no",
					"usually yes, unless they've been shot"
				],
				correctAnswer: 2,
				explanation: "Cats will normally land on their feet, except when dropped from a distance too low for them to turn around, or unless they are dead."
			}
		]
	};
	return quiz;	
}

module.exports = aTest;
