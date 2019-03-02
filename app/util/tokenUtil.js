
// DBアクセス
const db = require('../../db');

module.exports = {

  /**
   * リクエスト情報(トークン)からユーザIDを取得＆返却する。
   * @param {*} req リクエスト情報 
   */
  getUserId: async function(req) {
    console.log('tokenUtil - getUserId()');
    // トークンを取得
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    // トークンからユーザIDを取得
    let tokens = await db.query('SELECT * FROM sw_t_token WHERE token = $1', [token]);
    if (!tokens.rows || tokens.rows.length == 0) {
      res.json( { success: false, message: 'No token.' } );
    }

    // ユーザIDを返却
    return tokens.rows[0].user_id;
  }
}
