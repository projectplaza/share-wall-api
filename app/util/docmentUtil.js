
// DBアクセス
const db = require('../../db');

module.exports = {

  /**
   * マスタに存在するフォルダIDか判定します。
   * @param {*} res レスポンス
   * @param {*} folderId フォルダID
   * @return true:存在する/false:存在しない
   */
  isFolderId: async function(res, folderId) {
    console.log('SHARE-WALL-API-LOG : docmentUtil - isFolderId()');
    // パラメータチェック
    if (folderId == null) {
      res.status(500).send({message : "API ERROR. NOT folderId."});
    }

    // マスタ検索
    let result = await db.query(
      'SELECT count(folder_id) FROM sw_t_docment_folder WHERE folder_id = $1'
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
   * @param {*} docmentId ドキュメントID
   * @return true:存在する/false:存在しない
   */
  isDocmentId: async function(res, docmentId) {
    console.log('SHARE-WALL-API-LOG : docmentUtil - isDocmentId()');
    // パラメータチェック
    if (docmentId == null) {
      res.status(500).send({message : "API ERROR. NOT docmentId."});
    }

    // マスタ検索
    let result = await db.query(
      'SELECT count(docment_id) FROM sw_t_docment WHERE docment_id = $1'
      , [docmentId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  }
}
