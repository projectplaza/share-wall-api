
// DBアクセス
const db = require('../../../db');

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
          AND panel_id = $1`
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
  }
}
