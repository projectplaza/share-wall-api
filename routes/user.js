var express = require('express');
var router = express.Router();

// DBアクセス
const db = require('../db');

/**
 * ユーザAPI.<br/>
 * GET<br/>
 * http://localhost:3000/api/v1/user
 */
router.get('/', async function(req, res, next) {
    console.log('v1/user exection');
    // パラメータ取得
    let params = req.body;
    let userId = params.userId;
    if (userId == undefined || userId == "") {
        res.status(500).send({message : "ユーザIDが入力されていません。"});
    }
    // ユーザ検索
    const { rows } = await db.query('SELECT * FROM sw_m_user WHERE user_id = $1', [userId]);
    if (!rows || rows.length == 0) {
        res.status(500).send({message : "ユーザ情報が見つかりません。"});
       return;
    }
    res.send(rows);
});

/**
 * フレンド取得API.<br/>
 * GET<br/>
 * http://localhost:3000/api/v1/user/friend
 */
/* GET リストデータを返却する. */
router.get('/friend', async function(req, res, next) {
    // パラメータ取得
    let params = req.body;
    let userId = params.userId;
    if (userId == undefined || userId == "") {
      res.status(500).send({message : "ユーザIDが入力されていません。"});
    }
    // フレンド検索
    // TODO フレンド検索
    // まだフレンド機能がないため、ユーザ一覧を取得＆返却
    const { rows } = await db.query('SELECT * FROM sw_m_user');
    if (!rows || rows.length == 0) {
      res.status(500).send({message : "ユーザ情報が見つかりません。"});
      return;
    }
    let resultDatas = [];
    for (let i=0; i < rows.length; i++) {
        resultDatas.push({userId : rows[i].user_id,
                        userName : rows[i].user_name,
                        prof : rows[i].prof});

    }
    res.send(resultDatas);
  });
  
  module.exports = router;
