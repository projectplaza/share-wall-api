
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
    }

    // マスタ検索
    let result = await db.query(
      'SELECT count(team_id) FROM sw_m_team WHERE team_id = $1'
      , [teamId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  }

}
