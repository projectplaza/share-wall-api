
// DBアクセス
const db = require('../../db');

module.exports = {

  /**
   * マスタに存在するボードIDか判定します。
   * @param {*} boardId ボードID
   * @return true:存在する/false:存在しない
   */
  isBoardId: async function(boardId) {
    console.log('SHARE-WALL-API-LOG : wallUtil - isBoardId()');
    // パラメータチェック
    if (boardId == null) {
      return false;
    }

    // マスタ検索
    let result = await db.query(
      `SELECT count(board_id)
       FROM sw_t_wall_board
       WHERE board_id = $1`
      , [boardId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  },

  /**
   * マスタに存在するパネルIDか判定します。
   * @param {*} boardId ボードID
   * @param {*} panelId パネルID
   * @return true:存在する/false:存在しない
   */
  isPanelId: async function(boardId, panelId) {
    console.log('SHARE-WALL-API-LOG : wallUtil - isPanelId()');
    // パラメータチェック
    if (panelId == null) {
      return false;
    }

    // マスタ検索
    let result = await db.query(
      `SELECT count(panel_id)
         FROM sw_t_wall_panel
        WHERE board_id = $1
          AND panel_id = $2`
      , [boardId, panelId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  },

  /**
   * マスタに存在するタスクIDか判定します。
   * @param {*} boardId ボードID
   * @param {*} taskId タスクID
   * @return true:存在する/false:存在しない
   */
  isTaskId: async function(boardId, taskId) {
    console.log('SHARE-WALL-API-LOG : wallUtil - isTaskId()');
    // パラメータチェック
    if (taskId == null) {
      return false;
    }

    // マスタ検索
    let result = await db.query(
      `SELECT count(task_id)
         FROM sw_t_wall_task
        WHERE board_id = $1
          AND task_id = $2`
      , [boardId, taskId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  },

  /**
   * マスタに存在するコメントIDか判定します。
   * @param {*} boardId ボードID
   * @param {*} taskId タスクID
   * @param {*} commentId コメントID
   * @return true:存在する/false:存在しない
   */
  isCommentId: async function(boardId, taskId, commentId) {
    console.log('SHARE-WALL-API-LOG : wallUtil - isCommentId()');
    // パラメータチェック
    if (commentId == null) {
      return false;
    }

    // マスタ検索
    let result = await db.query(
      `SELECT count(comment_id)
         FROM sw_t_wall_comment
        WHERE board_id = $1
          AND task_id = $2
          AND comment_id = $3`
      , [boardId, taskId, commentId]
    );
    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
  },

  /**
   * 最大のタスクIDを取得します。
   */
  getMaxTaskId: async function(boardId) {
    console.log('SHARE-WALL-API-LOG : wallUtil - getMaxTaskId()');
    // パラメータチェック
    if (boardId == null) {
      return false;
    }

    // タスクの最大IDを取得
    let result = await db.query(
      `SELECT max(task_id)
         FROM sw_t_wall_task
        WHERE board_id = $1`
      , [boardId]
    );
    if (result != null && result.rows != null) {
      // 最大ID値を返却
      return result.rows[0].max;
    } else {
      // 取得できない場合は0を返却
      return 0;
    }
  },

  /**
   * 最大のコメントIDを取得します。
   * @param boardId ボードID
   * @param taskId タスクID
   */
  getMaxCommentId: async function(boardId, taskId) {
    console.log('SHARE-WALL-API-LOG : wallUtil - getMaxCommentId()');
    // パラメータチェック
    if (boardId == null || taskId == null) {
      return false;
    }

    // コメントの最大IDを取得
    let result = await db.query(
      `SELECT max(comment_id)
         FROM sw_t_wall_comment
        WHERE board_id = $1
          AND task_id = $2`
      , [boardId, taskId]
    );
    if (result != null && result.rows != null) {
      // 最大ID値を返却
      return result.rows[0].max;
    } else {
      // 取得できない場合は0を返却
      return 0;
    }
  }
}
