var should = require('chai').should(),
    auth = require('../index'),
    testFunction = auth.dummyTestFunction

describe('#dotest', function() {
  it('return abc', function() {
    testFunction().should.equal('abc');
  });
});
