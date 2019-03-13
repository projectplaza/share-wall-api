
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
    console.log('SHARE-WALL-API-LOG : teamUtil - isProjectId()');

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
    console.log('SHARE-WALL-API-LOG : teamUtil - isProjectMember()');

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
  }

}
