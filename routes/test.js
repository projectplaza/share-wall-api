var express = require('express');
var router = express.Router();

/**
 * テストAPI
 */
/* GET リストデータを返却する. */
router.get('/', function(req, res, next) {
  res.send([{test : "GET リストを返却1"},
            {test : "GET リストを返却2"},
            {test : "GET リストを返却3"}]);
});

/* GET データを返却する. */
router.get('/:id', function(req, res, next) {
  res.send({test : "GET 単一データを返却",
            id : req.params.id});
});

/* POST データを登録する. */
router.post('/', function(req, res, next) {
  console.log(req)
  res.send({test : "POST データを登録"});
});

/* PUT データを更新する. */
router.put('/:id', function(req, res, next) {
  console.log(req)
  res.send({test : "PUT データ更新",
            id : req.params.id});
});

/* PATCH データを一部更新する. */
router.patch('/:id', function(req, res, next) {
  console.log(req)
  res.send({test : "PATCH 一部データ更新",
            id : req.params.id});
});

/* DELETE データを更新する. */
router.delete('/:id', function(req, res, next) {
  console.log(req)
  res.send({test : "DELETE データ削除",
            id : req.params.id});
});

module.exports = router;
