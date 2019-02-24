
// docmentUtil
const docmentUtil = require('./docmentUtil.js');

module.exports = {

  /**
   * ランダムな文字列を生成し返却します。
   * @param {*} res レスポンス
   * @param {*} strLength 文字の長さ
   */
  getRandomStr: function(res, strLength) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getRandomStr()');

    // パラメータチェック
    if (strLength == null) {
      res.status(500).send({message : "API ERROR. NOT strLength."});
    }
    
    // 生成する文字列に含める文字セット
    var c = "abcdefghijklmnopqrstuvwxyz0123456789";

    var cl = c.length;
    var r = "";
    for(var i = 0; i < strLength; i++){
      r += c[Math.floor( Math.random() * cl )];
    }

    return r;
  },

  /**
   * デザインドキュメント用の利用可能なフォルダIDを生成し返却します。<br>
   * フォルダーID:システム内で一意なキー
   * @param {*} res レスポンス
   * @return {*} フォルダID
   */
  getDesignDocmentFolderId: async function(res) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getDesignDocmentFolderId()');

    let folderId = '';

    // フォルダIDを生成
    folderId = this.getRandomStr(res, 15);

    // フォルダIDの重複チェック
    if (await docmentUtil.isFolderId(res, folderId)) {
      // 重複した場合、もう一度IDを生成
      folderId = this.getDesignDocmentFolderId();
    }

    // フォルダIDを返却
    return folderId;
  },

  /**
   * デザインドキュメント用の利用可能なドキュメントIDを生成し返却します。<br>
   * ドキュメントID:システム内で一意なキー
   * @param {*} res レスポンス
   * @return {*} ドキュメントID
   */
  getDesignDocmentDocmentId: async function(res) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getDesignDocmentDocmentId()');

    let docmentId = '';

    // ドキュメントIDを生成
    docmentId = this.getRandomStr(res, 15);

    // ドキュメントIDの重複チェック
    if (await docmentUtil.isDocmentId(res, docmentId)) {
      // 重複した場合、もう一度IDを生成
      docmentId = this.getDesignDocmentDocmentId();
    }

    // フォルダIDを返却
    return docmentId;
  }
}
