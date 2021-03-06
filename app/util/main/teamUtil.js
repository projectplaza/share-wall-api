
// DBアクセス
const db = require('../../../db');

module.exports = {

  /**
   * マスタに存在するチームIDか判定します。
   * @param {*} res レスポンス
   * @param {*} teamId チームID
   * @return true:存在する/false:存在しない
   */
  isTeamId: async function(res, teamId) {
    console.log('SHARE-WALL-API-LOG : teamUtil - isTeamId()');
    // パラメータチェック
    if (teamId == null) {
      res.status(500).send({message : "API ERROR. NOT teamId."});
      return false;
    }

    // マスタ検索
    let result = await db.query(
      `SELECT count(team_id)
       FROM sw_m_team
       WHERE team_id = $1`
      , [teamId]
    );
    console.log(result.rows[0].count)
    if (result == null || result.rows == null || result.rows[0].count == 0) {
      return false;
    }
    return true;
  },

  /**
   * ユーザのチーム権限を判定する。
   * @param {*} teamId チームID
   * @param {*} userId ユーザID
   * @return true:権限あり/false:権限なし
   */
  isTeamAuthority: async function(teamId, userId) {
    console.log('SHARE-WALL-API-LOG : teamUtil - isTeamAuthority()');

    // チームメンバー権限チェック
    let result = await db.query(
      `SELECT user_id
       FROM sw_m_team_member
       WHERE team_id = $1
       AND user_id = $2
       AND user_authority = true
       UNION
       SELECT user_id
       FROM sw_m_team_member
       WHERE team_id = $1
       AND user_id = $2
       AND administrator_authority = true`
      , [teamId, userId]
    );

    if (result == null || result.rows == null || result.rows.length == 0) {
      return false;
    }
    return true;
  }
}
