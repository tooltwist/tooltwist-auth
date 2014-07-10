var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , bcrypt = require('bcrypt')
  , SALT_WORK_FACTOR = 10;

var UserSchema = new Schema({
  createdAt : { type: Date, default: Date.now },
  username : { type: String, required: true, index: { unique: true } },
  firstName : { type: String, index: { unique: false } },
  lastName : { type: String, index: { unique: false } },
  email : { type: String, required: true, index: { unique: true } },
  password : { type: String, required: true },
  resetPasswordToken : { type: String, required: false },
  resetPasswordTokenCreatedAt : { type: Date },
  apiKey : { type: String, required: false },
  validatedEmail : { type: Boolean, required: false },
  validatedDetails : { type: Boolean, required: false },
  termsAccepted_v1 : { type: Boolean, required: false },
  noDeengineer_v1 : { type: Boolean, required: false }
});


UserSchema.pre('save', function(next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return next(err);
    // hash the password along with our new salt
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      // override the cleartext password with the hashed one
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.validPassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

UserSchema.methods.generatePerishableToken = function(cb){
  var user = this;
  var timepiece = Date.now().toString(36);
  var preHash = timepiece + user.email;
  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) return cb(err);
    // hash the token along with our new salt
    bcrypt.hash(preHash, salt, function(err, hash) {
      if (err)
		  cb(err);
      else
		  cb(null, hash);
    });
  });
}


UserSchema.methods.generateApiKey = function() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*36|0,v=c=='x'?r:r&0x3|0x8;return v.toString(36);});
	//return 'xxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*36|0,v=c=='x'?r:r&0x3|0x8;return v.toString(36);});
}

module.exports = mongoose.model('User', UserSchema);