
// DBアクセス
const db = require('../../../db');

module.exports = {

  /**
   * マスタに存在するチームIDか判定します。
   * @param {*} teamId チームID
   * @return true:存在する/false:存在しない
   */
  isTeamId: async function(teamId) {
    console.log('SHARE-WALL-API-LOG : teamUtil - isTeamId()');
    // パラメータチェック
    if (teamId == null) {
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
   * ユーザがチームの管理者か判定します。
   * @param {*} teamId チームID
   * @param {*} userId  ユーザID
   * @return true:管理者/false:管理者でない
   */
  hasAdmin: async function(teamId, userId) {
    console.log('SHARE-WALL-API-LOG : teamUtil - hasAdmin()');

    // パラメータチェック
    if (teamId == null) {
      return false;
    }
    if (userId == null) {
      return false;
    }

    // マスタ検索
    let result = await db.query(
      `SELECT count(mtm.team_id)
         FROM sw_m_team AS mt
        INNER JOIN sw_m_team_member AS mtm
           ON mt.team_id = mtm.team_id
        WHERE mt.team_id = $1
          AND mtm.user_id = $2
          AND mtm.administrator_authority = true`
      , [teamId, userId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  },

  /**
   * ユーザがチームのメンバーか判定します。
   * @param {*} teamId チームID
   * @param {*} userId  ユーザID
   * @return true:メンバー/false:メンバーでない
   */
  hasMember: async function(teamId, userId) {
    console.log('SHARE-WALL-API-LOG : teamUtil - hasMember()');

    // パラメータチェック
    if (teamId == null) {
      return false;
    }
    if (userId == null) {
      return false;
    }

    // マスタ検索
    let result = await db.query(
      `SELECT count(mtm.team_id)
         FROM sw_m_team AS mt
        INNER JOIN sw_m_team_member AS mtm
           ON mt.team_id = mtm.team_id
        WHERE mt.team_id = $1
          AND mtm.user_id = $2`
      , [teamId, userId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  }

}
