var express = require('express');
var app = express();

var router = express.Router();
var jwt = require( 'jsonwebtoken' );

var config = require('../config');
// application variables
app.set('superSecret', config.secret);
//. ユーザー情報（本来は DB などに格納された情報を使う）
var users = [
  { userId: 'user0', password: 'pass0', admin: true },
  { userId: 'user1', password: 'pass1', admin: false },
  { userId: 'user2', password: 'pass2', admin: false },
  { userId: 'user3', password: 'pass3', admin: false }
];

/**
 * ログインAPI
 */
/* POST. */
router.post('/v1/login', function(req, res, next) {
  // チェック処理
  let params = req.body;
  if (params.userId == undefined || params.userId == "") {
    res.status(500).send({message : "ユーザIDが入力されていません。"});
  }
  if (params.password == undefined || params.password == "") {
    res.status(500).send({message : "パスワードが入力されていません。"});
  }

  // ログイン
  for( var i = 0; i < users.length; i ++ ){
    if( users[i].userId == params.userId && users[i].password == params.password ){
      // トークン生成
      var token= jwt.sign( users[i], app.get('superSecret'), {
        expiresIn: '24h'
      });
      res.json( { success: true, message: 'Authentication successfully finished.', token: token } );
      return;
    }
  }
  res.json( { success: false, message: 'Authentication failed.' } );
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

// 認証テスト
//. GET(http://localhost:8080/token/)
router.get( '/', function( req, res ){
  res.json( { message: 'Welcome to API routing.' } );
});

// 認証テスト
//. POST(http://localhost:8080/token/users)
router.post( '/users', function( req, res ){
  res.json( users );
});

module.exports = router;