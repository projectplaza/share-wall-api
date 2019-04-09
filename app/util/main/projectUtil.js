
// DBアクセス
const db = require('../../../db');

module.exports = {

  /**
   * マスタに存在するプロジェクトIDか判定します。
   * @param {*} res レスポンス
   * @param {*} projectId プロジェクトID
   * @return true:存在する/false:存在しない
   */
  isProjectId: async function(res, projectId) {
    console.log('SHARE-WALL-API-LOG : projectUtil - isProjectId()');

    // パラメータチェック
    if (projectId == null) {
      res.status(500).send({message : "API ERROR. NOT projectId."});
    }

    // マスタ検索
    let result = await db.query(
      'SELECT count(project_id) FROM sw_m_project WHERE project_id = $1'
      , [projectId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  },

  /**
   * プロジェクトに所属するメンバーか判定します。
   * @param {*} res レスポンス
   * @param {*} projectId プロジェクトID
   * @param {*} memberId メンバーID
   * @return true:所属する/false:所属しない
   */
  isProjectMember: async function(res, projectId, memberId) {
    console.log('SHARE-WALL-API-LOG : projectUtil - isProjectMember()');

    // パラメータチェック
    if (projectId == null) {
      res.status(500).send({message : "API ERROR. NOT projectId."});
    }
    if (memberId == null) {
      res.status(500).send({message : "API ERROR. NOT memberId."});
    }

    // マスタ検索
    let result = await db.query(
      `SELECT count(project_id) 
       FROM sw_m_project_member 
       WHERE project_id = $1 
       AND user_id =$2`
      , [projectId, memberId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  },

  /**
   * ユーザがプロジェクトの管理者か判定します。
   * @param {*} teamId チームID
   * @param {*} projectId プロジェクトID
   * @param {*} userId  ユーザID
   * @return true:所属する/false:所属しない
   */
  hasAdmin: async function(teamId, projectId, userId) {
    console.log('SHARE-WALL-API-LOG : projectUtil - hasAdmin()');

    // パラメータチェック
    if (teamId == null) {
      return false;
    }
    if (projectId == null) {
      return false;
    }
    if (userId == null) {
      return false;
    }

    // マスタ検索
    let result = await db.query(
      `SELECT count(mpm.project_id)
         FROM sw_m_team AS mt
        INNER JOIN sw_m_project AS mp
           ON mt.team_id = mp.team_id
        INNER JOIN sw_m_project_member AS mpm
           ON mp.project_id = mpm.project_id
        WHERE mt.team_id = $1
          AND mp.project_id = $2
          AND mpm.user_id = $3
          AND mpm.administrator_authority = true`
      , [teamId, projectId, userId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  },

  /**
   * ユーザがプロジェクトのメンバーか判定します。
   * @param {*} teamId チームID
   * @param {*} projectId プロジェクトID
   * @param {*} userId  ユーザID
   * @return true:所属する/false:所属しない
   */
  hasMember: async function(teamId, projectId, userId) {
    console.log('SHARE-WALL-API-LOG : projectUtil - hasMember()');

    // パラメータチェック
    if (teamId == null) {
      return false;
    }
    if (projectId == null) {
      return false;
    }
    if (userId == null) {
      return false;
    }

    // マスタ検索
    let result = await db.query(
      `SELECT count(mpm.project_id)
         FROM sw_m_team AS mt
        INNER JOIN sw_m_project AS mp
           ON mt.team_id = mp.team_id
        INNER JOIN sw_m_project_member AS mpm
           ON mp.project_id = mpm.project_id
        WHERE mt.team_id = $1
          AND mp.project_id = $2
          AND mpm.user_id = $3`
      , [teamId, projectId, userId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  }

}
