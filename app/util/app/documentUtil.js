
// DBアクセス
const db = require('../../../db');

module.exports = {

  /**
   * マスタに存在するフォルダIDか判定します。
   * @param teamId チームID
   * @param folderId フォルダID
   * @return true:存在する/false:存在しない
   */
  isFolderId: async function(teamId, folderId) {
    console.log('SHARE-WALL-API-LOG : documentUtil - isFolderId()');
    // パラメータチェック
    if (folderId == null) {
      return false;
    }

    // マスタ検索
    let result = await db.query(
      `SELECT count(folder_id)
         FROM sw_t_document_folder
        WHERE team_id = $1
          AND folder_id = $2`
      , [teamId, folderId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  },

  /**
   * マスタに存在するドキュメントIDか判定します。
   * @param teamId チームID
   * @param documentId ドキュメントID
   * @return true:存在する/false:存在しない
   */
  isDocumentId: async function(teamId, documentId) {
    console.log('SHARE-WALL-API-LOG : documentUtil - isDocumentId()');
    // パラメータチェック
    if (documentId == null) {
      return null;
    }

    // マスタ検索
    let result = await db.query(
      `SELECT count(document_id)
         FROM sw_t_document
        WHERE team_id = $1
          AND document_id = $2`
      , [teamId, documentId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  }
}
