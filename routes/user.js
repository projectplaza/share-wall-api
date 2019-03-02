/**
 * ユーザプロフィール.<br/>
 * GET(http://localhost:3000/api/v1/prof)
 * GET(http://localhost:3000/api/v1/prof/friend)
 */
var express = require('express');
var router = express.Router();

// DBアクセス
const db = require('../db');

/**
 * ユーザAPI.<br/>
 * GET(http://localhost:3000/api/v1/prof)
 */
router.get('/', async function(req, res, next) {
    console.log('v1/prof exection');
    //. ポスト本体、URLパラメータ、HTTPヘッダいずれかからトークンを取得
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // ※認証を通過しているのでトークンの有無はチェックしない
    // トークンからユーザIDを取得
    let tokens = await db.query('SELECT * FROM sw_t_token WHERE token = $1', [token]);
    if (!tokens.rows || tokens.rows.length == 0) {
        res.status(500).send({message : "トークン情報が見つかりません。"});
       return;
    }
    
    // ユーザ検索
    let userId = tokens.rows[0].user_id;
    let users = await db.query('SELECT * FROM sw_m_user WHERE user_id = $1', [userId]);
    if (!users || users.length == 0) {
        res.status(500).send({message : "ユーザ情報が見つかりません。"});
       return;
    }
    let user = users.rows[0];
    res.send({  userId : user.user_id,
                userName : user.user_name,
                prof : user.prof});
});

/**
 * フレンド取得API.<br/>
 * GET(http://localhost:3000/api/v1/prof/friend)
 */
/* GET リストデータを返却する. */
router.get('/friend', async function(req, res, next) {
    console.log('v1/prof exection');
    //. ポスト本体、URLパラメータ、HTTPヘッダいずれかからトークンを取得
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // ※認証を通過しているのでトークンの有無はチェックしない
    // トークンからユーザIDを取得
    let tokens = await db.query('SELECT * FROM sw_t_token WHERE token = $1', [token]);
    if (!tokens.rows || tokens.rows.length == 0) {
        res.status(500).send({message : "トークン情報が見つかりません。"});
        return;
    }
    
    // ユーザID
    let userId = tokens.rows[0].user_id;
    
    // フレンド検索
    // TODO: フレンド検索
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
