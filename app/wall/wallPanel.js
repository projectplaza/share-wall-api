/**
 * ウォールAPI.<br/>
 * 
 * パネル＆タスク一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/panel/task/list)
 * パネル一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/panel/list)
 * パネル登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/panel)
 * パネル更新API（複数）
 * PUT(http://localhost:3000/api/v1/wall/panel)
 * パネル削除API（単体）
 * DELETE(http://localhost:3000/api/v1/wall/panel)
 * 
 */
var express = require('express');
var router = express.Router();

// DBアクセス
const db = require('../../db');

// util
const tokenUtil = require('../master/util/tokenUtil.js');
const teamUtil = require('../master/util/teamUtil.js');
const projectUtil = require('../master/util/projectUtil.js');
const wallUtil = require('./wallUtil.js');
const generatUtil = require('../util/generatUtil.js');
const validateUtil = require('../util/validateUtil.js');
const messageUtil = require('../util/messageUtil.js');

/**
 * パネル＆タスク一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/panel/task/list)
 */
router.get('/task/list', async function(req, res, next) {
    console.log('GET:v1/wall/panel/task/list execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);

    // パラメータ取得
    let params = req.query;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
      return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
      return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // プロジェクト所属チェック
    if (! await projectUtil.hasMember(teamId, projectId, userId)) {
      return res.status(400).send({message : messageUtil.errMessage003("プロジェクトメンバー")});
    }
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // ボードIDのマスタチェック
    if (! await wallUtil.isBoardId(teamId, boardId)) {
        return res.status(400).send({message : "ボードIDが存在しません。(boardId:" + boardId + ")"});
    }

    // パネル検索
    let panels = await db.query(
        `SELECT board.board_id
              , panel.panel_id
              , panel.panel_name
              , panel.order_no AS panel_order
              , panel.status_cd
           FROM sw_t_wall_board AS board
          INNER JOIN sw_t_wall_panel AS panel
             ON board.team_id = panel.team_id
            AND board.board_id = panel.board_id
          WHERE board.team_id = $1
            AND board.project_id = $2
            AND board.board_id = $3
          ORDER BY panel.order_no`,
        [teamId, projectId, boardId]);
    if (!panels.rows || panels.rows.length == 0) {
      // 検索結果が存在しない場合、空のリストを返却
      return res.send([]);
    }

    await Promise.all(
        // mapの結果的は配列
        // asyncを付けてPromiseとして返却
            panels.rows.map(async function(panel) {

            // タスク取得
            let resultTasks = await findTask(teamId, projectId, boardId, panel.panel_id);

            // パネル情報を返却
            return {
                "boardId" : panel.board_id
                , "panelId" : panel.panel_id
                , "panelName" : panel.panel_name
                , "panelOrder" : panel.panel_order
                , "statusCd" : panel.status_cd
                , "task" : resultTasks
            };
        })
    ).then( function(resultPanels) {
        // 検索結果
        res.send(resultPanels);
    });
});
/**
 * タスク情報取得処理
 * @param {*} teamId 
 * @param {*} projectId 
 * @param {*} boardId 
 * @param {*} panelId 
 */
async function findTask(teamId, projectId, boardId, panelId) {
    console.log('wall - findTask()');

    // タスク検索
    let tasks = await db.query(
        `SELECT board.board_id
              , panel.panel_id
              , task.task_id
              , task.title
              , task.content
              , task.priority
              , task.deadline
              , task.order_no AS task_order
           FROM sw_t_wall_board AS board
          INNER JOIN sw_t_wall_panel AS panel
             ON board.team_id = panel.team_id
            AND board.board_id = panel.board_id
          INNER JOIN sw_t_wall_task AS task
             ON board.team_id = task.team_id
            AND board.board_id = task.board_id
            AND panel.panel_id = task.panel_id
          WHERE board.team_id = $1
            AND board.project_id = $2
            AND board.board_id = $3
            AND panel.panel_id = $4
            ORDER BY task.order_no`,
        [teamId, projectId, boardId, panelId]);
    if (!tasks.rows || tasks.rows.length == 0) {
        // 検索結果が存在しない場合、空のリストを設定
        return [];
    } else {
        // タスク情報を設定
        let resultTasks = [];
        tasks.rows.forEach(async function(row) {
            resultTasks.push({
                "taskId" : row.task_id
                , "title" : row.title
                , "content" : row.content
                , "priority" : row.priority
                , "assignUsers" : [{
                    "userCd" : "test"
                }]
                , "deadline" : row.deadline
                , "taskOrder" : row.task_order
            });
        });
        return resultTasks;
    }
    
};

/**
 * パネル一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/panel/list)
 */
router.get('/list', async function(req, res, next) {
    console.log('GET:v1/wall/panel/list execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータ取得
    let params = req.query;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
      return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
      return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // プロジェクト所属チェック
    if (! await projectUtil.hasMember(teamId, projectId, userId)) {
      return res.status(400).send({message : messageUtil.errMessage003("プロジェクトメンバー")});
    }
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // ボードIDのマスタチェック
    if (! await wallUtil.isBoardId(teamId, boardId)) {
        return res.status(400).send({message : "ボードIDが存在しません。(boardId:" + boardId + ")"});
    }
  
    // 検索
    let panels = await db.query(
        `SELECT board.board_id
              , panel.panel_id
              , panel.panel_name
              , panel.order_no
              , panel.status_cd
           FROM sw_t_wall_board board
          INNER JOIN sw_t_wall_panel panel
             ON board.board_id = panel.board_id
          WHERE board.team_id = $1
            AND board.project_id = $2
            AND board.board_id = $3
          ORDER BY panel.order_no`,
        [teamId, projectId, boardId]);
    if (!panels.rows || panels.rows.length == 0) {
      // パネルが存在しない場合、空のリストを返却
      return res.send([]);
    }

    // 検索結果
    let result = [];
    panels.rows.forEach(function(row) {
      result.push({
        "boardId" : row.board_id
        , "panelId" : row.panel_id
        , "panelName" : row.panel_name
        , "order" : row.order_no
        , "statusCd" : row.status_cd
      });
    });
    res.send(result);
});
  
/**
 * パネル登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/panel)
 */
router.post('/', async function(req, res, next) {
    console.log('POST:v1/wall/panel execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータから登録情報を取得
    let params = req.body;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
        return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
        return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // プロジェクト所属チェック
    if (! await projectUtil.hasMember(teamId, projectId, userId)) {
      return res.status(400).send({message : messageUtil.errMessage003("プロジェクトメンバー")});
    }
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // ボードIDのマスタチェック
    if (! await wallUtil.isBoardId(teamId, boardId)) {
        return res.status(400).send({message : "ボードIDが存在しません。(boardId:" + boardId + ")"});
    }
    // パネル名
    let panelName = params.panelName;
    if (! validateUtil.isEmptyText(panelName, "パネル名")) {
        return res.status(400).send({message : messageUtil.errMessage001("パネル名", "panelName")});
    }
    // ステータスCD
    let statusCd = params.statusCd;
    // 機能名
    let functionName = params.functionName;
    if (! validateUtil.isEmptyText(functionName, "機能名")) {
        return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
    }

    // パネルIDを生成
    let panelId = await generatUtil.getWallPanelId(teamId, boardId);
  
    // 登録日時
    let insertDate = new Date();
  
    // パネル登録
    let newPanel = await db.query(
        `INSERT INTO sw_t_wall_panel (
            team_id,
            board_id,
            panel_id,
            panel_name,
            status_cd,
            create_user,
            create_function,
            create_datetime,
            update_user,
            update_function,
            update_datetime)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $6, $7, $8)`
        , [teamId, boardId, panelId, panelName, statusCd, userId, functionName, insertDate]);
  
    // 登録情報を返却
    res.send({
        teamId : teamId,
        boardId : boardId,
        panelId : panelId,
        panelName : panelName,
        orderNo : 0,
        statusCd : statusCd,
        createUser : userId,
        createFunction : functionName,
        createDatetime : insertDate
    });
});

/**
 * パネル更新API（複数）
 * PUT(http://localhost:3000/api/v1/wall/panel)
 */
router.put('/', async function(req, res, next) {
    console.log('PUT:v1/wall/panel execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータから登録情報を取得
    let params = req.body;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
        return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
        return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // プロジェクト所属チェック
    if (! await projectUtil.hasMember(teamId, projectId, userId)) {
      return res.status(400).send({message : messageUtil.errMessage003("プロジェクトメンバー")});
    }
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // ボードIDのマスタチェック
    if (! await wallUtil.isBoardId(teamId, boardId)) {
        return res.status(400).send({message : "ボードIDが存在しません。(boardId:" + boardId + ")"});
    }
    // パネル情報
    let panels = params.panels;
    if (! validateUtil.isEmptyObject(panels, "パネル情報")) {
        return res.status(400).send({message : messageUtil.errMessage001("パネル情報", "panels")});
    }
    // 機能名
    let functionName = params.functionName;
    if (! validateUtil.isEmptyText(functionName, "機能名")) {
        return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
    }

    // 更新日時
    let updateDate = new Date();

    let resultPanels = [];
    await Promise.all(
        panels.map(async function(panel) {
            // パネルID
            let panelId = panel.panelId;
            if (! validateUtil.isEmptyText(panelId, "パネルID")) {
                return res.status(400).send({message : messageUtil.errMessage001("パネルID", "panelId")});
            }
            // パネルIDのマスタチェック
            if (! await wallUtil.isPanelId(teamId, boardId, panelId)) {
                return res.status(400).send({message : "パネルIDが存在しません。(panelId:" + panelId + ")"});
            }
  
            // パネルを取得
            let befPanel = await db.query(
                `SELECT *
                   FROM sw_t_wall_board board
                   LEFT JOIN sw_t_wall_panel panel
                     ON board.board_id = panel.board_id
                  WHERE board.team_id = $1
                    AND board.project_id = $2
                    AND board.board_id = $3
                    AND panel.panel_id = $4`
                  , [teamId, projectId, boardId, panelId]);

            // パネル名
            let panelName = panel.panelName;
            if (! validateUtil.isEmptyText(panelName, "パネル名")) {
                panelName = befPanel.rows[0].panel_name;
            }
            // パネル順序
            let orderNo = panel.order;
            if (! validateUtil.isEmptyText(orderNo, "パネル順序")) {
                orderNo = befPanel.rows[0].order_no;
            }
            // ステータスCD
            // パネル順序
            let statusCd = panel.statusCd;
            if (! validateUtil.isEmptyText(statusCd, "ステータスCD")) {
                statusCd = befPanel.rows[0].status_cd;
            }

            // パネル更新
            let newBoard = await db.query(
                `UPDATE sw_t_wall_panel
                    SET board_id = $1
                      , panel_id = $2
                      , panel_name = $3
                      , order_no = $4
                      , status_cd = $5
                      , update_user = $6
                      , update_function = $7
                      , update_datetime = $8
                  WHERE board_id = $1
                    AND panel_id = $2`
                , [boardId, panelId, panelName, orderNo, statusCd, userId, functionName, updateDate]);
        
            resultPanels.push({
                'panelId' : panelId,
                'panelName' : panelName,
                'order' : orderNo,
                'statusCd' : statusCd
            });
        })
    );

    // 登録情報を返却
    res.send({
        "message": "パネルの更新に成功しました。",
        "teamId" : teamId,
        "projectId" : projectId,
        "boardId" : boardId,
        "panels" : resultPanels,
        "updateUser" : userId,
        "updateFunction" : functionName,
        "updateDatetime" : updateDate
    });
});

/**
 * パネル削除API（単体）
 * DELETE(http://localhost:3000/api/v1/wall/panel)
 */
router.delete('/', async function(req, res, next) {
    console.log('DELETE:v1/wall/panel execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータから登録情報を取得
    let params = req.body;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
      return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
      return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // プロジェクト所属チェック
    if (! await projectUtil.hasMember(teamId, projectId, userId)) {
      return res.status(400).send({message : messageUtil.errMessage003("プロジェクトメンバー")});
    }
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
      return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // ボードIDのマスタチェック
    if (! await wallUtil.isBoardId(teamId, boardId)) {
      return res.status(400).send({message : "ボードIDが存在しません。(boardId:" + boardId + ")"});
    }
    // パネルID
    let panelId = params.panelId;
    if (! validateUtil.isEmptyText(panelId, "パネルID")) {
      return res.status(400).send({message : messageUtil.errMessage001("パネルID", "panelId")});
    }
    // パネルIDのマスタチェック
    if (! await wallUtil.isPanelId(teamId, boardId, panelId)) {
      return res.status(400).send({message : "パネルIDが存在しません。(panelId:" + panelId + ")"});
    }
  
    // パネル削除処理
    if (await deletePanel(boardId, panelId)) {
      res.send({
        message : "パネルの削除に成功しました。"
        , teamId : teamId
        , projectId : projectId
        , boardId : boardId
        , panelId : panelId
      });
    } else {
      res.status(500).send({
        message : "パネルの削除に失敗しました。(boardId:" + boardId + ", panelId:" + panelId + ")"
      });
    }
});
/** 
 * パネル削除処理.
 * 関連するパネル、タスクを全て削除
 */
async function deletePanel(boardId, panelId) {
    console.log('wall - deletePanel()');

    // パネル削除
    let delPanel = await db.query(
      `DELETE FROM sw_t_wall_panel 
        WHERE board_id = $1
          AND panel_id = $2`
       , [boardId, panelId]
    );
    if (delPanel.rowCount == 0) {
        // 失敗
        return false;
    }

    // タスク削除
    let delTask = await db.query(
        `DELETE FROM sw_t_wall_task 
          WHERE board_id = $1
            AND panel_id = $2`
         , [boardId, panelId]
    );
    if (delTask.rowCount == 0) {
        // 失敗でもOK
        // return false;
    }

    return true;
};

module.exports = router;
