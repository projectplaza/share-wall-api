var express = require('express');
var router = express.Router();

/**
 * ログインAPI
 */
/* POST. */
router.post('/', function(req, res, next) {
  console.log(req)
  res.send({token : "トークン"});
});

module.exports = router;