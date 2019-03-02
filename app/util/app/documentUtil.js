
// DBアクセス
const db = require('../../../db');

module.exports = {

  /**
   * マスタに存在するフォルダIDか判定します。
   * @param {*} res レスポンス
   * @param {*} folderId フォルダID
   * @return true:存在する/false:存在しない
   */
  isFolderId: async function(res, folderId) {
    console.log('SHARE-WALL-API-LOG : documentUtil - isFolderId()');
    // パラメータチェック
    if (folderId == null) {
      res.status(500).send({message : "API ERROR. NOT folderId."});
    }

    // マスタ検索
    let result = await db.query(
      'SELECT count(folder_id) FROM sw_t_document_folder WHERE folder_id = $1'
      , [folderId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  },

  /**
   * マスタに存在するドキュメントIDか判定します。
   * @param {*} res レスポンス
   * @param {*} documentId ドキュメントID
   * @return true:存在する/false:存在しない
   */
  isDocumentId: async function(res, documentId) {
    console.log('SHARE-WALL-API-LOG : documentUtil - isDocumentId()');
    // パラメータチェック
    if (documentId == null) {
      res.status(500).send({message : "API ERROR. NOT documentId."});
    }

    // マスタ検索
    let result = await db.query(
      'SELECT count(document_id) FROM sw_t_document WHERE document_id = $1'
      , [documentId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  }
}
