
const documentUtil = require('./app/documentUtil.js');
const wallUtil = require('./app/wallUtil.js');

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
  getDesignDocumentFolderId: async function(res) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getDesignDocumentFolderId()');

    let folderId = '';

    // フォルダIDを生成
    folderId = this.getRandomStr(res, 15);

    // フォルダIDの重複チェック
    if (await documentUtil.isFolderId(res, folderId)) {
      // 重複した場合、もう一度IDを生成
      folderId = this.getDesignDocumentFolderId(res);
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
  getDesignDocumentDocumentId: async function(res) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getDesignDocumentDocumentId()');

    let documentId = '';

    // ドキュメントIDを生成
    documentId = this.getRandomStr(res, 15);

    // ドキュメントIDの重複チェック
    if (await documentUtil.isDocumentId(res, documentId)) {
      // 重複した場合、もう一度IDを生成
      documentId = this.getDesignDocumentDocumentId();
    }

    // ドキュメントIDを返却
    return documentId;
  },

  /**
   * ウォール用の利用可能なボードIDを生成し返却します。<br>
   * ボードID:システム内で一意なキー
   * @param {*} res レスポンス
   * @return {*} ボードID
   */
  getWallBoardId: async function(res) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getWallBoardId()');

    let boardId = '';

    // ボードIDを生成
    boardId = this.getRandomStr(res, 15);

    // ボードIDの重複チェック
    if (await wallUtil.isBoardId(boardId)) {
      // 重複した場合、もう一度IDを生成
      boardId = this.getWallBoardId(res);
    }

    // ボードIDを返却
    return boardId;
  },

  /**
   * ウォール用の利用可能なパネルIDを生成し返却します。<br>
   * パネルID:システム内で一意なキー
   * @param {*} res レスポンス
   * @param {*} boardId ボードID
   * @return {*} パネルID
   */
  getWallPanelId: async function(res, boardId) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getWallPanelId()');

    let panelId = '';

    // パネルIDを生成
    panelId = this.getRandomStr(res, 15);

    // パネルIDの重複チェック
    if (await wallUtil.isPanelId(boardId, panelId)) {
      // 重複した場合、もう一度IDを生成
      panelId = this.getWallPanelId(res, boardId);
    }

    // パネルIDを返却
    return panelId;
  },

  /**
   * ウォール用の利用可能なタスクIDを生成し返却します。<br>
   * タスクID:ボード内で一意なキー
   * @param {*} res レスポンス
   * @param {*} boardId ボードID
   * @return {*} タスクID
   */
  getWallTaskId: async function(res, boardId) {
    console.log('SHARE-WALL-API-LOG : generatUtil - getWallTaskId()');

    let taskId = '';

    // タスクIDを生成
    taskId = this.getRandomStr(res, 15);

    // タスクIDの重複チェック
    if (await wallUtil.isTaskId(boardId, taskId)) {
      // 重複した場合、もう一度IDを生成
      taskId = this.getWallTaskId(res, boardId);
    }

    // タスクIDを返却
    return taskId;
  }
}
