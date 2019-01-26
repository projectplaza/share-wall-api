var express = require('express');
var router = express.Router();

/**
 * ログインAPI
 */
/* POST. */
router.post('/', function(req, res, next) {
  // チェック処理
  let params = req.body;
  if (params.userId == undefined || params.userId == "") {
    res.status(500).send({message : "ユーザIDが入力されていません。"});
  }
  if (params.password == undefined || params.password == "") {
    res.status(500).send({message : "パスワードが入力されていません。"});
  }
  // if (false) {
  //   res.status(500).send({error : "IDかパスワードが間違っています。"});
  // }

  // トークン取得
  console.log(req)
  res.send({token : "key"});
});

module.exports = router;