
/**
 *	Display a page, that does not require signin.
 */
exports.publicPage = function(req, res){
  res.render('example/publicPage');
}

/**
 *	Display a page, that does not require signin.
 */
exports.privatePage = function(req, res){
  res.render('example/privatePage');
}
