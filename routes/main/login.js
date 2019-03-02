/**
 * ログインAPI.<br/>
 * 
 * POST(http://localhost:3000/api/v1/login)
 * OPTIONS(http://localhost:3000/api/v1/login)
 * POST(http://localhost:3000/api/v1/login/check)
 * 以下、削除予定
 * GET(http://localhost:3000/token/)
 * POST(http://localhost:3000/token/users)
 */
var express = require('express');
var app = express();

// ルーター
const Router = require('express-promise-router');
const router = new Router();
module.exports = router;

// DBアクセス
const db = require('../../db');

// 認証
var jwt = require( 'jsonwebtoken' );
var config = require('../../config');

// application variables
app.set('superSecret', config.secret);

/**
 * ログインAPI.<br/>
 * POST(http://localhost:3000/api/v1/login)
 */
router.post('/v1/login', async function(req, res, next) {
  console.log('v1/login execution');
  // チェック処理
  let params = req.body;
  let userId = params.userId;
  if (userId == undefined || userId == "") {
    res.status(400).send({message : "ユーザIDが入力されていません。(userId:" + userId + ")"});
  }
  if (params.password == undefined || params.password == "") {
    res.status(400).send({message : "パスワードが入力されていません。(password:" + password + ")"});
  }
  // ユーザ検索
  const { rows } = await db.query('SELECT * FROM sw_m_user WHERE user_id = $1', [userId]);
  if (!rows || rows.length == 0) {
    return res.status(400).send( { success: false, message: 'ユーザIDが存在しません。' } );
  }
  // 判定とトークン生成
  for( var i = 0; i < rows.length; i ++ ) {
    if( rows[i].user_id == userId && rows[i].pass_word == params.password ){
      // トークン生成
      var token= jwt.sign( rows[i], app.get('superSecret'), {
        expiresIn: '720h'
      });

      // 登録日時
      let insertDate = new Date();

      // トークンをDBへ登録
      let nowTokens = await db.query('SELECT * FROM sw_t_token WHERE user_id = $1', [userId]);
      if (nowTokens.rows && nowTokens.rows.length > 0) {
      // トークン情報があれば削除
      let delTokens = await db.query('DELETE FROM sw_t_token WHERE user_id = $1', [userId]);
      }
      let newTokens = await db.query(
        `INSERT INTO sw_t_token (token, user_id, create_user, create_function, create_datetime)
         VALUES ($1, $2, $3, $4, $5)`
        , [token, userId, userId, "system", insertDate]
      );

      res.json( { success: true, message: 'Authentication successfully finished.', token: token } );
      return;
    }
  }
  return res.status(500).send( { success: false, message: 'Authentication failed.' } );
});
/**
 * API確認用API.<br/>
 * OPTIONS(http://localhost:3000/api/v1/login)
 */
router.options('/v1/login', async function(req, res, next) {
  res.json( { success: true } );
  return;
});
  
/**
 * 認証フィルタ.<br/>
 * 以降のAPIから認証が入ります。
 */
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
 * トークン確認API.<br/>
 * POST(http://localhost:3000/api/v1/login/check)
 */
router.post('/v1/login/check', async function(req, res, next) {
  console.log('v1/login/check execution');
  // トークン情報を検索
  //. ポスト本体、URLパラメータ、HTTPヘッダいずれかからトークンを取得
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  // ※認証を通過しているのでトークンの有無はチェックしない
  // トークンからユーザIDを取得
  let tokens = await db.query('SELECT * FROM sw_t_token WHERE token = $1', [token]);
  if (!tokens.rows || tokens.rows.length == 0) {
    res.json( { success: false, message: 'No token.' } );
  }
  res.json( { success: true, message: 'True token.' } );
  return;
});

// 認証テスト（※削除予定）
//. GET(http://localhost:3000/token/)
router.get( '/', function( req, res ) {
  res.json( { message: 'Welcome to API routing.' } );
});

// 認証テスト（※削除予定）
//. POST(http://localhost:3000/token/users)
router.post( '/users', async function( req, res ) {
  // ユーザ検索
  const { rows } = await db.query('SELECT * FROM sw_m_user');
  res.send(rows);
});

module.exports = router;