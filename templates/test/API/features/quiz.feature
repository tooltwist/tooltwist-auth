Feature: Testing the shopping cart
	In order to take orders
	As an external application calling TEA
	I want to be able to manipulate the shopping cart

	Scenario: Creating a new quiz
		Given a clean quiz database
		When I select the quiz with quiz id 'test-quiz'
		Then the reply should tell me the quiz does not exist

	Scenario: Creating a new quiz
		Given a clean quiz database
		When I select the quiz with quiz id 'test-quiz' and with 'createQuiz' set
		Then the reply should send me a quiz with id 'test-quiz'

	Scenario: Selecting a quiz
		Given I've completed the previous scenario
		When I select the quiz with quiz id 'test-quiz'
		Then the reply should contain a skeleton quiz

	Scenario: Selecting an unknown quiz
		Given I've completed the previous scenario
		When I select the quiz with the quiz id 'I-do-not-exist'
		Then the reply should contain an error

	Scenario: Adding a question
		Given I've completed the previous scenario
		When I select the quiz with quiz id 'test-quiz'
		And I update the text for question 999 to 'abc'
		Then the reply should have question 0 containing 'abc'
		And the reply should contain 1 question

	Scenario: Adding a second question
		Given I've completed the previous scenario
		When I select the quiz with quiz id 'test-quiz'
		And I update the text for question 999 to 'def'
		Then the reply should have question 1 containing 'def'
		And the reply should contain 2 questions

	Scenario: Updating a quiz question
		Given I've completed the previous scenario
		When I select the quiz with quiz id 'test-quiz'
		And I update the text for question 1 to 'How many roosters a required to lay an egg'
		Then the reply should have question 1 containing 'How many roosters a required to lay an egg'
		And the reply should contain 2 questions

	Scenario: Adding a choice
		Given I've completed the previous scenario
		When I select the quiz with quiz id 'test-quiz'
		And I update the text for question 1, choice 999 to 'One rooster'
		Then the reply should have question 1, answer 0 containing 'One rooster'
		And the reply should contain 2 questions
		And the reply should have 1 choice for answer 1

	Scenario: Adding a 2nd choice
		Given I've completed the previous scenario
		When I select the quiz with quiz id 'test-quiz'
		And I update the text for question 1, choice 999 to 'Two roosters'
		Then the reply should have question 1, answer 1 containing 'Two roosters'
		And the reply should contain 2 questions
		And the reply should have 2 choices for answer 1

	Scenario: Adding a 3rd choice
		Given I've completed the previous scenario
		When I select the quiz with quiz id 'test-quiz'
		And I update the text for question 1, choice 2 to 'Three roosters'
		Then the reply should have question 1, answer 2 containing 'Three roosters'
		And the reply should contain 2 questions
		And the reply should have 3 choices for answer 1

	Scenario: Updating choice
		Given I've completed the previous scenario
		When I select the quiz with quiz id 'test-quiz'
		And I update the text for question 1, choice 2 to 'Roosters don't lay eggs'
		Then the reply should have question 1, answer 2 containing 'Roosters don't lay eggs'
		And the reply should contain 2 questions
		And the reply should have 3 choices for answer 1

	Scenario: Setting the correct answer
		Given I've completed the previous scenario
		When I select the quiz with quiz id 'test-quiz'
		And I update the correct answer for question 1 to 2
		Then the reply should have choice 2 as the correct answer for question 1

	Scenario: Selecting the correct answer
		Given I've completed the previous scenario
		When I select the quiz with quiz id 'test-quiz'
		Then the reply should have choice 2 as the correct answer for question 1
