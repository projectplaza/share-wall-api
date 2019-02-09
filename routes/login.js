var express = require('express');
var app = express();

// ルーター
const Router = require('express-promise-router');
const router = new Router();
module.exports = router;

// DBアクセス
const db = require('../db');

// 認証
var jwt = require( 'jsonwebtoken' );
var config = require('../config');

// application variables
app.set('superSecret', config.secret);

/**
 * ログインAPI
 */
/* POST. */
router.post('/v1/login', async function(req, res, next) {
  console.log('v1/login execution');
  // チェック処理
  let params = req.body;
  if (params.userId == undefined || params.userId == "") {
    res.status(500).send({message : "ユーザIDが入力されていません。"});
  }
  if (params.password == undefined || params.password == "") {
    res.status(500).send({message : "パスワードが入力されていません。"});
  }
  // ユーザ検索
  const { rows } = await db.query('SELECT * FROM sw_m_user WHERE user_id = $1', [params.userId]);
  if (!rows || rows.length == 0) {
    res.json( { success: false, message: 'No Data.' } );
    return;
  }
  // 判定とトークン生成
  for( var i = 0; i < rows.length; i ++ ) {
    if( rows[i].user_id == params.userId && rows[i].pass_word == params.password ){
      // トークン生成
      var token= jwt.sign( rows[i], app.get('superSecret'), {
        expiresIn: '720h'
      });
      res.json( { success: true, message: 'Authentication successfully finished.', token: token } );
      return;
    }
  }
  res.json( { success: false, message: 'Authentication failed.' } );
  return;
});
router.options('/v1/login', async function(req, res, next) {
  res.json( { success: true } );
  return;
});
  

//. 認証フィルタ
router.use( function( req, res, next ){
  //. ポスト本体、URLパラメータ、HTTPヘッダいずれかにトークンがセットされているか調べる
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if( !token ){
    //. トークンが設定されていなかった場合は無条件に 403 エラー
    return res.status(403).send( { success: false, message: 'No token provided.' } );
  }

  //. 設定されていたトークンの値の正当性を確認
  jwt.verify( token, app.get('superSecret'), function( err, decoded ){
    if( err ){
      //. 正当な値ではなかった場合はエラーメッセージを返す
      return res.json( { success: false, message: 'Invalid token.' } );
    }

    //. 正当な値が設定されていた場合は処理を続ける
    req.decoded = decoded;
    next();
  });
});

/**
 * トークン確認API
 */
/* POST. */
router.post('/v1/login/check', function(req, res, next) {
  console.log('v1/login/check execution');
  // トークンチェックは共通処理にて実施済み
  res.json( { success: true, message: 'Authentication successfully.' } );
  return;
});

// 認証テスト（※削除予定）
//. GET(http://localhost:8080/token/)
router.get( '/', function( req, res ) {
  res.json( { message: 'Welcome to API routing.' } );
});

// 認証テスト（※削除予定）
//. POST(http://localhost:8080/token/users)
router.post( '/users', async function( req, res ) {
  // ユーザ検索
  const { rows } = await db.query('SELECT * FROM sw_m_user');
  res.send(rows);
});

module.exports = router;