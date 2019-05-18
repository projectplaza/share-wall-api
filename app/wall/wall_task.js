/**
 * ウォールAPI.<br/>
 * 
 * タスク詳細取得API（単体）
 * GET(http://localhost:3000/api/v1/wall/task)
 * タスク登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/task)
 * タスク更新API（複数）
 * PUT(http://localhost:3000/api/v1/wall/task)
 * タスク削除API（単体）
 * DELETE(http://localhost:3000/api/v1/wall/task)
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
 * タスク詳細取得API（単体）
 * GET(http://localhost:3000/api/v1/wall/task)
 */
router.get('/', async function(req, res, next) {
    console.log('GET:v1/wall/task execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータ取得
    let params = req.query;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
      return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // チームIDのマスタチェック
    if (! await teamUtil.isTeamId(res, teamId)) {
        return res.status(400).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
    }
    // チーム所属チェック
    if (! await teamUtil.isTeamAuthority(teamId, userId)) {
        return res.status(400).send({message : "チームに所属していません。(teamId:" + teamId + ")"});
    }
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
      return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // プロジェクトIDのマスタチェック
    if (! await projectUtil.isProjectId(res, projectId)) {
        return res.status(400).send({message : "プロジェクトIDが存在しません。(projectId:" + projectId + ")"});
    }
    // プロジェクト所属チェック
    if (! await projectUtil.isProjectMember(res, projectId, userId)) {
        return res.status(400).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
    }
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // ボードIDのマスタチェック
    if (! await wallUtil.isBoardId(boardId)) {
        return res.status(400).send({message : "ボードIDが存在しません。(boardId:" + boardId + ")"});
    }
    // タスクID
    let taskId = params.taskId;
    if (! validateUtil.isEmptyText(taskId, "タスクID")) {
        return res.status(400).send({message : messageUtil.errMessage001("タスクID", "taskId")});
    }
    // タスクIDのマスタチェック
    if (! await wallUtil.isTaskId(boardId, taskId)) {
        return res.status(400).send({message : "タスクIDが存在しません。(taskId:" + taskId + ")"});
    }
      

  
    // 検索
    let task = await db.query(
        `SELECT board.team_id
              , board.project_id
              , board.board_id
              , panel.panel_id
              , task.task_id
              , task.title
              , task.content
              , task.priority
              , task.assign_user
              , ur.user_name assign_user_name
              , task.start_date
              , task.deadline
              , task.order_no
           FROM sw_t_wall_board board
          INNER JOIN sw_t_wall_panel panel
             ON board.board_id = panel.board_id
          INNER JOIN sw_t_wall_task task
             ON board.board_id = task.board_id
            AND panel.panel_id = task.panel_id
           LEFT JOIN sw_m_user ur
             ON task.assign_user = ur.user_id
          WHERE board.team_id = $1
            AND board.project_id = $2
            AND board.board_id = $3
            AND task.task_id = $4`,
        [teamId, projectId, boardId, taskId]);
    if (!task.rows || task.rows.length == 0) {
      // タスクが存在しない場合、空のリストを返却
      return res.send([]);
    }

    // 検索結果
    let result = {
        "teamId" : task.rows[0].team_id
        , "projectId" : task.rows[0].project_id
        , "boardId" : task.rows[0].board_id
        , "panelId" : task.rows[0].panel_id
        , "taskId" : task.rows[0].task_id
        , "title" : task.rows[0].title
        , "content" : task.rows[0].content
        , "priority" : task.rows[0].priority
        , "assignUser" : task.rows[0].assign_user
        , "assignUserName" : task.rows[0].assign_user_name
        , "startDate" : task.rows[0].start_date
        , "deadline" : task.rows[0].deadline
        , "order" : task.rows[0].order_no
    };
    res.send(result);
});

/**
 * タスク登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/task)
 */
router.post('/', async function(req, res, next) {
    console.log('POST:v1/wall/task execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータから登録情報を取得
    let params = req.body;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
        return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // チームIDのマスタチェック
    if (! await teamUtil.isTeamId(res, teamId)) {
        return res.status(400).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
    }
    // チーム所属チェック
    if (! await teamUtil.isTeamAuthority(teamId, userId)) {
        return res.status(400).send({message : "チームに所属していません。(teamId:" + teamId + ")"});
    }
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
        return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // プロジェクトIDのマスタチェック
    if (! await projectUtil.isProjectId(res, projectId)) {
        return res.status(400).send({message : "プロジェクトIDが存在しません。(projectId:" + projectId + ")"});
    }
    // プロジェクト所属チェック
    if (! await projectUtil.isProjectMember(res, projectId, userId)) {
        return res.status(400).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
    }
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // ボードIDのマスタチェック
    if (! await wallUtil.isBoardId(boardId)) {
        return res.status(400).send({message : "ボードIDが存在しません。(boardId:" + boardId + ")"});
    }
    // パネルID
    let panelId = params.panelId;
    if (! validateUtil.isEmptyText(panelId, "パネルID")) {
        return res.status(400).send({message : messageUtil.errMessage001("パネルID", "panelId")});
    }
    // パネルIDのマスタチェック
    if (! await wallUtil.isPanelId(boardId, panelId)) {
        return res.status(400).send({message : "パネルIDが存在しません。(panelId:" + panelId + ")"});
    }
    // タイトル
    let title = params.title;
    if (! validateUtil.isEmptyText(title, "タイトル")) {
        return res.status(400).send({message : messageUtil.errMessage001("タイトル", "title")});
    }
    // 内容
    let content = params.content;
    if (! validateUtil.isEmptyText(content, "内容")) {
        content = "";
    }
    // 優先度
    let priority = params.priority;
    if (! validateUtil.isEmptyText(priority, "優先度")) {
        priority = "";
    }
    // TODO: 文字数チェック　１桁
    if (priority.length > 1) {
        return res.status(400).send({message : messageUtil.errMessage004("優先度", "1")});
    }
    // 担当ユーザID
    let assignUser = params.assignUser;
    if (! validateUtil.isEmptyText(assignUser, "担当ユーザID")) {
        assignUser = "";
    }
    // TODO: マスタ存在チェック
    // 開始日
    let startDate = params.startDate;
    if (! validateUtil.isEmptyText(startDate, "開始日")) {
        startDate = null;
    }
    // 期限日
    let deadline = params.deadline;
    if (! validateUtil.isEmptyText(deadline, "期限日")) {
        deadline = null;
    }
    // TODO: 開始日＜期限日チェック
    // 機能名
    let functionName = params.functionName;
    if (! validateUtil.isEmptyText(functionName, "機能名")) {
        return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
    }

    // タスクIDを生成
    // TODO: タスクIDも、ボードID＋t＋連番 としたい！
    let taskId = await generatUtil.getWallTaskId(res, boardId);
    let orderNo = 0;
  
    // 登録日時
    let insertDate = new Date();
  
    // タスク登録
    let newTask = await db.query(
        `INSERT INTO sw_t_wall_task (
            board_id,
            panel_id,
            task_id,
            title,
            order_no,
            content,
            priority,
            assign_user,
            start_date,
            deadline,
            create_user,
            create_function,
            create_datetime,
            update_user,
            update_function,
            update_datetime)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $11, $12, $13)`
        , [boardId, panelId, taskId, title, orderNo, content, priority, assignUser, startDate, deadline,
             userId, functionName, insertDate]);
            
    // 登録情報を返却
    res.send({
        boardId : boardId,
        panelId : panelId,
        taskId : taskId,
        title : title,
        order : orderNo,
        content : content,
        priority : priority,
        assignUser : assignUser,
        startDate : startDate,
        deadline : deadline,
        createUser : userId,
        createFunction : functionName,
        createDatetime : insertDate
    });
});

/**
 * タスク更新API（複数）
 * PUT(http://localhost:3000/api/v1/wall/task)
 */
router.put('/', async function(req, res, next) {
    console.log('PUT:v1/wall/task execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータから登録情報を取得
    let params = req.body;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
        return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // チームIDのマスタチェック
    if (! await teamUtil.isTeamId(res, teamId)) {
        return res.status(400).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
    }
    // チーム所属チェック
    if (! await teamUtil.isTeamAuthority(teamId, userId)) {
        return res.status(400).send({message : "チームに所属していません。(teamId:" + teamId + ")"});
    }
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
        return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // プロジェクトIDのマスタチェック
    if (! await projectUtil.isProjectId(res, projectId)) {
        return res.status(400).send({message : "プロジェクトIDが存在しません。(projectId:" + projectId + ")"});
    }
    // プロジェクト所属チェック
    if (! await projectUtil.isProjectMember(res, projectId, userId)) {
        return res.status(400).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
    }
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // ボードIDのマスタチェック
    if (! await wallUtil.isBoardId(boardId)) {
        return res.status(400).send({message : "ボードIDが存在しません。(boardId:" + boardId + ")"});
    }
    // タスク情報
    let tasks = params.tasks;
    if (! validateUtil.isEmptyObject(tasks, "タスク情報")) {
        return res.status(400).send({message : messageUtil.errMessage001("タスク情報", "tasks")});
    }
    // 機能名
    let functionName = params.functionName;
    if (! validateUtil.isEmptyText(functionName, "機能名")) {
        return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
    }

    // 更新日時
    let updateDate = new Date();

    let resultTasks = [];
    await Promise.all(
        tasks.map(async function(inputTask) {
            // タスクID
            let taskId = inputTask.taskId;
            if (! validateUtil.isEmptyText(taskId, "タスクID")) {
                return res.status(400).send({message : messageUtil.errMessage001("タスクID", "taskId")});
            }
            // タスクIDのマスタチェック
            if (! await wallUtil.isTaskId(boardId, taskId)) {
                return res.status(400).send({message : "タスクIDが存在しません。(taskId:" + taskId + ")"});
            }

            // タスクを取得
            let befTask = await db.query(
                `SELECT *
                   FROM sw_t_wall_board board
                   LEFT JOIN sw_t_wall_task task
                     ON board.board_id = task.board_id
                  WHERE board.team_id = $1
                    AND board.project_id = $2
                    AND board.board_id = $3
                    AND task.task_id = $4`
                  , [teamId, projectId, boardId, taskId]);

            console.log(befTask.rows)

            // パネルID
            let panelId = inputTask.panelId;
            if (! validateUtil.isEmptyText(panelId, "パネルID")) {
                panelId = befTask.rows[0].panel_id;
            } else {
                // パネルIDのマスタチェック
                if (! await wallUtil.isPanelId(boardId, panelId)) {
                    return res.status(400).send({message : "パネルIDが存在しません。(panelId:" + panelId + ")"});
                }
            }
            // タイトル
            let title = inputTask.title;
            if (! validateUtil.isEmptyText(title, "タイトル")) {
                title = befTask.rows[0].title;
            }
            // 内容
            let content = inputTask.content;
            if (! validateUtil.isEmptyText(content, "内容")) {
                content = befTask.rows[0].content;
            }
            // 優先度
            let priority = inputTask.priority;
            if (! validateUtil.isEmptyText(priority, "優先度")) {
                priority = befTask.rows[0].priority;
            }
            // 担当者
            let assignUser = inputTask.assignUser;
            if (! validateUtil.isEmptyText(assignUser, "担当者")) {
                assignUser = befTask.rows[0].assign_user;
            }
            // 開始日
            let startDate = inputTask.startDate;
            if (! validateUtil.isEmptyText(startDate, "開始日")) {
                startDate = befTask.rows[0].start_date;
            }
            // 期限日
            let deadline = inputTask.deadline;
            if (! validateUtil.isEmptyText(deadline, "期限日")) {
                deadline = befTask.rows[0].deadline;
            }
            // タスク順序
            let orderNo = inputTask.order;
            if (! validateUtil.isEmptyText(orderNo, "タスク順序")) {
                orderNo = befTask.rows[0].order_no;
            }
            // タスク更新
            let newBoard = await db.query(
                `UPDATE sw_t_wall_task 
                    SET board_id = $1 
                    , panel_id = $2 
                    , task_id = $3
                    , title = $4
                    , content = $5 
                    , priority = $6 
                    , assign_user = $7 
                    , start_date = $8 
                    , deadline = $9 
                    , order_no = $10 
                    , update_user = $11 
                    , update_function = $12 
                    , update_datetime = $13 
                WHERE board_id = $1
                  AND task_id = $3 `
                , [
                    boardId
                    , panelId
                    , taskId
                    , title
                    , content
                    , priority
                    , assignUser
                    , startDate
                    , deadline
                    , orderNo
                    , userId
                    , functionName
                    , updateDate
                ]
            );

            resultTasks.push({
                'boardId' : boardId,
                'panelId' : panelId,
                'taskId' : taskId,
                'title' : title,
                'content' : content,
                'priority' : priority,
                'assignUser' : assignUser,
                'startDate' : startDate,
                'deadline' : deadline,
                'order' : orderNo
            });
        })
    );

    // 登録情報を返却
    res.send({
        "message": "タスクの更新に成功しました。",
        "teamId" : teamId,
        "projectId" : projectId,
        "boardId" : boardId,
        "tasks" : resultTasks,
        "updateUser" : userId,
        "updateFunction" : functionName,
        "updateDatetime" : updateDate
    });
});

/**
 * タスク削除API（単体）
 * DELETE(http://localhost:3000/api/v1/wall/task)
 */
router.delete('/', async function(req, res, next) {
    console.log('DELETE:v1/wall/task execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータから登録情報を取得
    let params = req.body;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
      return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // チームIDのマスタチェック
    if (! await teamUtil.isTeamId(res, teamId)) {
      return res.status(400).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
    }
    // チーム所属チェック
    if (! await teamUtil.isTeamAuthority(teamId, userId)) {
        return res.status(400).send({message : "チームに所属していません。(teamId:" + teamId + ")"});
    }
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
      return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // プロジェクトIDのマスタチェック
    if (! await projectUtil.isProjectId(res, projectId)) {
      return res.status(400).send({message : "プロジェクトIDが存在しません。(projectId:" + projectId + ")"});
    }
    // プロジェクト所属チェック
    if (! await projectUtil.isProjectMember(res, projectId, userId)) {
      return res.status(400).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
    }
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
      return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // ボードIDのマスタチェック
    if (! await wallUtil.isBoardId(boardId)) {
      return res.status(400).send({message : "ボードIDが存在しません。(boardId:" + boardId + ")"});
    }
    // タスクID
    let taskId = params.taskId;
    if (! validateUtil.isEmptyText(taskId, "タスクID")) {
      return res.status(400).send({message : messageUtil.errMessage001("タスクID", "taskId")});
    }
    // タスクIDのマスタチェック
    if (! await wallUtil.isTaskId(boardId, taskId)) {
      return res.status(400).send({message : "タスクIDが存在しません。(taskId:" + taskId + ")"});
    }
  
    // タスク削除処理
    if (await deleteTask(boardId, taskId)) {
      res.send({
        message : "タスクの削除に成功しました。"
        , teamId : teamId
        , projectId : projectId
        , boardId : boardId
        , taskId : taskId
      });
    } else {
      res.status(500).send({
        message : "タスクの削除に失敗しました。(boardId:" + boardId + ", taskId:" + taskId + ")"
      });
    }
});
/** 
 * タスク削除処理.
 */
async function deleteTask(boardId, taskId) {
    console.log('wall - deleteTask()');

    // タスク削除
    let delTask = await db.query(
        `DELETE FROM sw_t_wall_task 
          WHERE board_id = $1
            AND task_id = $2`
         , [boardId, taskId]
    );
    if (delTask.rowCount == 0) {
        // 失敗
        return false;
    }

    return true;
};

module.exports = router;
