
// DBアクセス
const db = require('../../db');

module.exports = {

  /**
   * マスタに存在するユーザIDか判定します。
   * @param {*} res 
   * @param {*} userId ユーザID
   */
  isUserId: async function(res, userId) {
    console.log('userUtil - isUserId()');
    // パラメータチェック
    if (userId == null) {
      res.status(500).send({message : "API ERROR. NOT userId."});
    }

    // ユーザを検索
    let users = await db.query('SELECT * FROM sw_m_user WHERE user_id = $1', [userId]);
    if (!users.rows || users.rows.length == 0) {
      return false;
    }
    return true;
  }
}
