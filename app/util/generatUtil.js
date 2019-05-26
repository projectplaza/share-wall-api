
const documentUtil = require('../document/documentUtil.js');
const wallUtil = require('../wall/wallUtil.js');

module.exports = {

  /**
   * ランダムな文字列を生成し返却します。
   * @param {*} strLength 文字の長さ
   */
  getRandomStr: function(strLength) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getRandomStr()');

    // パラメータチェック
    if (strLength == null) {
      return null;
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
   * @param teamId チームID
   * @return フォルダID
   */
  getDesignDocumentFolderId: async function(teamId) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getDesignDocumentFolderId()');

    let folderId = '';

    // フォルダIDを生成
    folderId = this.getRandomStr(6);

    // フォルダIDの重複チェック
    if (await documentUtil.isFolderId(teamId, folderId)) {
      // 重複した場合、もう一度IDを生成
      folderId = this.getDesignDocumentFolderId();
    }

    // フォルダIDを返却
    return folderId;
  },

  /**
   * デザインドキュメント用の利用可能なドキュメントIDを生成し返却します。<br>
   * ドキュメントID:システム内で一意なキー
   * @param teamId チームID
   * @return {*} ドキュメントID
   */
  getDesignDocumentDocumentId: async function(teamId) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getDesignDocumentDocumentId()');

    let documentId = '';

    // ドキュメントIDを生成
    documentId = this.getRandomStr(6);

    // ドキュメントIDの重複チェック
    if (await documentUtil.isDocumentId(teamId, documentId)) {
      // 重複した場合、もう一度IDを生成
      documentId = this.getDesignDocumentDocumentId(teamId);
    }

    // ドキュメントIDを返却
    return documentId;
  },

  /**
   * ウォール用の利用可能なボードIDを生成し返却します。<br>
   * ボードID:システム内で一意なキー
   * @return {*} ボードID
   */
  getWallBoardId: async function(teamId) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getWallBoardId()');

    let boardId = '';

    // ボードIDを生成
    boardId = this.getRandomStr(6);

    // ボードIDの重複チェック
    if (await wallUtil.isBoardId(teamId, boardId)) {
      // 重複した場合、もう一度IDを生成
      boardId = this.getWallBoardId(teamId);
    }

    // ボードIDを返却
    return boardId;
  },

  /**
   * ウォール用の利用可能なパネルIDを生成し返却します。<br>
   * パネルID:システム内で一意なキー
   * @param {*} teamId チームID
   * @param {*} boardId ボードID
   * @return {*} パネルID
   */
  getWallPanelId: async function(teamId, boardId) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getWallPanelId()');

    let panelId = '';

    // パネルIDを生成
    panelId = this.getRandomStr(6);

    // パネルIDの重複チェック
    if (await wallUtil.isPanelId(teamId, boardId, panelId)) {
      // 重複した場合、もう一度IDを生成
      panelId = this.getWallPanelId(boardId);
    }

    // パネルIDを返却
    return panelId;
  },

  /**
   * ウォール用の利用可能なタスクIDを生成し返却します。<br>
   * タスクID:ボード内で一意なキー
   * @param {*} teamId チームID
   * @param {*} boardId ボードID
   * @return {*} タスクID
   */
  getWallTaskId: async function(teamId, boardId) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getWallTaskId()');

    let maxId = await wallUtil.getMaxTaskId(teamId, boardId);
    console.log(maxId)

    // 最大値＋１を返却
    return maxId + 1;
  },

  /**
   * ウォール用の利用可能なコメントIDを生成し返却します。<br>
   * コメントID:タスク内で一意なキー
   * @param {*} teamId チームID
   * @param {*} boardId ボードID
   * @param {*} taskId タスクID
   * @return {*} コメントID
   */
  getWallCommentId: async function(teamId, boardId, taskId) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getWallCommentId()');

    let maxId = await wallUtil.getMaxCommentId(teamId, boardId, taskId);
    console.log(maxId)

    // 最大値＋１を返却
    return maxId + 1;
  }
}
