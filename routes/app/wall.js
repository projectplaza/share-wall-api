/**
 * ウォールAPI.<br/>
 * 
 * ボード一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/board/list)
 * ボード詳細取得API（単体）※実装見送り
 * GET(http://localhost:3000/api/v1/wall/board)
 * ボード登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/board)
 * ボード更新API（複数）
 * PUT(http://localhost:3000/api/v1/wall/board)
 * ボード削除API（単体）
 * DELETE(http://localhost:3000/api/v1/wall/board)
 * 
 * パネル＆タスク一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/panel/task/list)
 * パネル一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/panel/list)
 * パネル詳細取得API（単体）※実装見送り
 * GET(http://localhost:3000/api/v1/wall/panel)
 * パネル登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/panel)
 * パネル更新API（複数）
 * PUT(http://localhost:3000/api/v1/wall/panel)
 * パネル削除API（単体）
 * DELETE(http://localhost:3000/api/v1/wall/panel)
 * 
 * タスク一覧取得API（複数）※実装見送り
 * GET(http://localhost:3000/api/v1/wall/task/list)
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
const tokenUtil = require('../../app/util/main/tokenUtil.js');
const teamUtil = require('../../app/util/main/teamUtil.js');
const projectUtil = require('../../app/util/main/projectUtil.js');
const generatUtil = require('../../app/util/generatUtil.js');
const validateUtil = require('../../app/util/validateUtil.js');
const messageUtil = require('../../app/util/messageUtil.js');

/**
 * ボード一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/board/list)
 */
router.get('/board/list', async function(req, res, next) {
    console.log('GET:v1/wall/board/list execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータ取得
    let params = req.query;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
      return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // TODO: マスタチェック
    // TODO: 所属チェック
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
      return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // TODO: マスタチェック
    // プロジェクト所属チェック
    if (! await projectUtil.isProjectMember(res, projectId, userId)) {
      return res.status(500).send( { message: 'プロジェクトに所属していません。' } );
    }
  
    // 検索
    let boards = await db.query(
        `SELECT * 
        FROM sw_t_wall_board 
        WHERE team_id = $1 
        AND project_id = $2 
        ORDER BY order_no`,
        [teamId, projectId]);
    if (!boards.rows || boards.rows.length == 0) {
      // ボードが存在しない場合、空のリストを返却
      return res.send([]);
    }

    // 検索結果
    let result = [];
    boards.rows.forEach(function(row) {
      result.push({
        "teamId" : row.team_id
        , "projectId" : row.project_id
        , "boardId" : row.board_id
        , "boardName" : row.board_name
        , "order" : row.order_no
        , "create_user" : row.create_user
        , "create_function" : row.create_function
        , "create_datetime" : row.update_datetime
      });
    });
    res.send(result);
});

/**
 * パネル＆タスク一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/panel/task/list)
 */
router.get('/panel/task/list', async function(req, res, next) {
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
    // TODO: マスタチェック
    // TODO: 所属チェック
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
      return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // TODO: マスタチェック
    // プロジェクト所属チェック
    if (! await projectUtil.isProjectMember(res, projectId, userId)) {
      return res.status(500).send( { message: 'プロジェクトに所属していません。' } );
    }
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // TODO: マスタチェック

    // 検索
    let contents = await db.query(
        `SELECT board.board_id
              , panel.panel_id
              , panel.panel_name
              , panel.order_no AS panel_order
              , task.task_id
              , task.title
              , task.priority
              , task.assign_user
              , task.start_date
              , task.deadline
              , task.order_no AS task_order
           FROM sw_t_wall_board AS board
           LEFT JOIN sw_t_wall_panel AS panel
             ON board.board_id = panel.board_id
           LEFT JOIN sw_t_wall_task AS task
             ON board.board_id = task.board_id
            AND panel.panel_id = task.panel_id
          WHERE board.team_id = $1
            AND project_id = $2
            AND board.board_id = $3
          ORDER BY panel.order_no, task.order_no`,
        [teamId, projectId, boardId]);
    if (!contents.rows || contents.rows.length == 0) {
      // 検索結果が存在しない場合、空のリストを返却
      return res.send([]);
    }
    console.log(contents.rows);

    // 検索結果
    let beforePanel = "";
    let resultPanels = [];
    let resultTasks = [];
    for (let row=1; contents.rows.length > row; row++) {
        // タスク情報を追加
        resultTasks.push({
            "taskId" : contents.rows[row].task_id
            , "title" : contents.rows[row].title
            , "priority" : contents.rows[row].priority
            , "assignUser" : contents.rows[row].assign_user
            , "startDate" : contents.rows[row].start_date
            , "deadline" : contents.rows[row].deadline
            , "taskOrder" : contents.rows[row].task_order
        });

        // パネル判定（現在のパネルID=次のパネルID）
        if (contents.rows.length <= row+1 && contents.rows[row].panel_id.equals(contents.rows[row+1].panel_id)) {
            break;
        } else {
            // パネル情報を追加
            resultPanels.push({
                "boardId" : contents.rows[row].board_id
                , "panelId" : contents.rows[row].panel_id
                , "panelName" : contents.rows[row].panel_name
                , "panelOrder" : contents.rows[row].panel_order
                , "task" : resultTasks
            });
            // タスク情報をリセット
            resultTasks = [];
            break;
        }
    }
    res.send(resultPanels);
});

/**
 * パネル一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/panel/list)
 */
router.get('/panel/list', async function(req, res, next) {
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
    // TODO: マスタチェック
    // TODO: 所属チェック
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
      return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // TODO: マスタチェック
    // プロジェクト所属チェック
    if (! await projectUtil.isProjectMember(res, projectId, userId)) {
      return res.status(500).send( { message: 'プロジェクトに所属していません。' } );
    }
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // TODO: マスタチェック

  
    // 検索
    let panels = await db.query(
        `SELECT board.board_id
              , panel.panel_id
              , panel.panel_name
              , panel.order_no
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
      });
    });
    res.send(result);
});

/**
 * タスク詳細取得API（単体）
 * GET(http://localhost:3000/api/v1/wall/task)
 */
router.get('/task', async function(req, res, next) {
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
    // TODO: マスタチェック
    // TODO: 所属チェック
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
      return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // TODO: マスタチェック
    // プロジェクト所属チェック
    if (! await projectUtil.isProjectMember(res, projectId, userId)) {
      return res.status(500).send( { message: 'プロジェクトに所属していません。' } );
    }
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // TODO: マスタチェック
    // タスクID
    let taskId = params.taskId;
    if (! validateUtil.isEmptyText(taskId, "タスクID")) {
        return res.status(400).send({message : messageUtil.errMessage001("タスクID", "taskId")});
    }
    // TODO: マスタチェック

  
    // 検索
    let task = await db.query(
        `SELECT board.team_id
              , board.project_id
              , board.board_id
              , panel.panel_id
              , task.task_id
              , task.title
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
 * ボード登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/board)
 */
router.post('/board', async function(req, res, next) {
    console.log('POST:v1/wall/board execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータから登録情報を取得
    let params = req.body;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
        return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // TODO: マスタ存在チェック
    // TODO: 所属チェック
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
        return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // TODO: マスタ存在チェック
    // TODO: 所属チェック
    // ボード名
    let boardName = params.boardName;
    if (! validateUtil.isEmptyText(boardName, "ボード名")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボード名", "boardName")});
    }
    // 機能名
    let functionName = params.functionName;
    if (! validateUtil.isEmptyText(functionName, "機能名")) {
        return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
    }

    // ボードIDを生成
    let boardId = await generatUtil.getWallBoardId(res);
    let orderNo = 0;
  
    // 登録日時
    let insertDate = new Date();
  
    // ボード登録
    let newBoard = await db.query(
        `INSERT INTO sw_t_wall_board (
            team_id,
            project_id,
            board_id,
            board_name,
            order_no,
            create_user,
            create_function,
            create_datetime,
            update_user,
            update_function,
            update_datetime)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $6, $7, $8)`
        , [teamId, projectId, boardId, boardName, orderNo, userId, functionName, insertDate]);
  
    // 登録情報を返却
    res.send({
        teamId : teamId,
        projectId : projectId,
        boardId : boardId,
        boardName : boardName,
        orderNo : orderNo,
        createUser : userId,
        createFunction : functionName,
        createDatetime : insertDate
    });
});
  
/**
 * パネル登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/panel)
 */
router.post('/panel', async function(req, res, next) {
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
    // TODO: マスタ存在チェック
    // TODO: 所属チェック
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
        return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // TODO: マスタ存在チェック
    // TODO: 所属チェック
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // TODO: マスタ存在チェック
    // パネル名
    let panelName = params.panelName;
    if (! validateUtil.isEmptyText(panelName, "パネル名")) {
        return res.status(400).send({message : messageUtil.errMessage001("パネル名", "panelName")});
    }
    // 機能名
    let functionName = params.functionName;
    if (! validateUtil.isEmptyText(functionName, "機能名")) {
        return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
    }

    // パネルIDを生成
    // TODO: パネルIDは、ボードID＋p＋連番 としたい！
    let panelId = await generatUtil.getWallPanelId(res);
    let orderNo = 0;
  
    // 登録日時
    let insertDate = new Date();
  
    // パネル登録
    let newPanel = await db.query(
        `INSERT INTO sw_t_wall_panel (
            board_id,
            panel_id,
            panel_name,
            order_no,
            create_user,
            create_function,
            create_datetime,
            update_user,
            update_function,
            update_datetime)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $5, $6, $7)`
        , [boardId, panelId, panelName, orderNo, userId, functionName, insertDate]);
  
    // 登録情報を返却
    res.send({
        boardId : boardId,
        panelId : panelId,
        panelName : panelName,
        orderNo : orderNo,
        createUser : userId,
        createFunction : functionName,
        createDatetime : insertDate
    });
});
  
/**
 * タスク登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/task)
 */
router.post('/task', async function(req, res, next) {
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
    // TODO: マスタ存在チェック
    // TODO: 所属チェック
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
        return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // TODO: マスタ存在チェック
    // TODO: 所属チェック
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // TODO: マスタ存在チェック
    // パネルID
    let panelId = params.panelId;
    if (! validateUtil.isEmptyText(panelId, "パネルID")) {
        return res.status(400).send({message : messageUtil.errMessage001("パネルID", "panelId")});
    }
    // TODO: マスタ存在チェック
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
    let taskId = await generatUtil.getWallPanelId(res);
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
 * ボード更新API（複数）
 * PUT(http://localhost:3000/api/v1/wall/board)
 */
router.put('/board', async function(req, res, next) {
    console.log('PUT:v1/wall/board execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータから登録情報を取得
    let params = req.body;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
        return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // TODO: マスタ存在チェック
    // TODO: 所属チェック
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
        return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // TODO: マスタ存在チェック
    // TODO: 所属チェック
    // ボード情報
    let boards = params.boards;
    if (! validateUtil.isEmptyObject(boards, "ボード情報")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボード情報", "boards")});
    }
    // 機能名
    let functionName = params.functionName;
    if (! validateUtil.isEmptyText(functionName, "機能名")) {
        return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
    }

    // 更新日時
    let updateDate = new Date();

    let resultBoards = [];
    await Promise.all(
        boards.map(async function(board) {
            // ボードID
            let boardId = board.boardId;
            if (! validateUtil.isEmptyText(boardId, "ボードID")) {
                return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
            }
            // TODO: マスタ存在チェック

            // ボードを取得
            let befBoard = await db.query(
                `SELECT *
                   FROM sw_t_wall_board
                  WHERE team_id = $1
                    AND project_id = $2
                    AND board_id = $3`
                  , [teamId, projectId, boardId]);

            // ボード名
            let boardName = board.boardName;
            if (! validateUtil.isEmptyText(boardName, "ボード名")) {
                boardName = befBoard.rows[0].board_name;
            }
            // ボード順序
            let orderNo = board.order;
            if (! validateUtil.isEmptyText(orderNo, "ボード順序")) {
                orderNo = befBoard.rows[0].order_no;
            }
            // ボード更新
            let newBoard = await db.query(
                `UPDATE sw_t_wall_board 
                    SET team_id = $1 
                    , project_id = $2 
                    , board_id = $3 
                    , board_name = $4 
                    , order_no = $5 
                    , update_user = $6 
                    , update_function = $7 
                    , update_datetime = $8 
                WHERE team_id = $1 
                AND project_id = $2 
                AND board_id = $3 `
                , [teamId, projectId, boardId, boardName, orderNo, userId, functionName, updateDate]);
        
            resultBoards.push({
                'boardId' : boardId,
                'boardName' : boardName,
                'order' : orderNo
            });
        })
    );

    // 登録情報を返却
    res.send({
        "message": "ボードの更新に成功しました。",
        "teamId" : teamId,
        "projectId" : projectId,
        "boards" : resultBoards,
        "updateUser" : userId,
        "updateFunction" : functionName,
        "updateDatetime" : updateDate
    });
});
  
/**
 * パネル更新API（複数）
 * PUT(http://localhost:3000/api/v1/wall/panel)
 */
router.put('/panel', async function(req, res, next) {
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
    // TODO: マスタ存在チェック
    // TODO: 所属チェック
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
        return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // TODO: マスタ存在チェック
    // TODO: 所属チェック
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // TODO: マスタ存在チェック
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
            // TODO: マスタ存在チェック（チーム、プロジェクト、ボードに紐づくパネルIDが存在するか）

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
            // パネル更新
            let newBoard = await db.query(
                `UPDATE sw_t_wall_panel 
                    SET board_id = $1 
                    , panel_id = $2 
                    , panel_name = $3 
                    , order_no = $4 
                    , update_user = $5 
                    , update_function = $6 
                    , update_datetime = $7 
                WHERE board_id = $1
                  AND panel_id = $2 `
                , [boardId, panelId, panelName, orderNo, userId, functionName, updateDate]);
        
            resultPanels.push({
                'panelId' : panelId,
                'panelName' : panelName,
                'order' : orderNo
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
 * タスク更新API（複数）
 * PUT(http://localhost:3000/api/v1/wall/task)
 */
router.put('/task', async function(req, res, next) {
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
    // TODO: マスタ存在チェック
    // TODO: 所属チェック
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
        return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // TODO: マスタ存在チェック
    // TODO: 所属チェック
    // ボードID
    let boardId = params.boardId;
    if (! validateUtil.isEmptyText(boardId, "ボードID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボードID", "boardId")});
    }
    // TODO: マスタ存在チェック
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
        tasks.map(async function(task) {
            // タスクID
            let taskId = task.taskId;
            if (! validateUtil.isEmptyText(taskId, "タスクID")) {
                return res.status(400).send({message : messageUtil.errMessage001("タスクID", "taskId")});
            }
            // TODO: マスタ存在チェック（チーム、プロジェクト、ボードに紐づくタスクIDが存在するか）

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

            console.log(befTask)

            // パネルID
            let panelId = task.panelId;
            if (! validateUtil.isEmptyText(panelId, "パネルID")) {
                panelId = befTask.rows[0].panel_id;
            } else {
                // TODO: マスタ存在チェック（チーム、プロジェクト、ボードに紐づくパネルIDが存在するか）
            }
            // タイトル
            let title = task.title;
            if (! validateUtil.isEmptyText(title, "タイトル")) {
                title = befTask.rows[0].title;
            }
            // タイトル
            let title = task.title;
            if (! validateUtil.isEmptyText(title, "タイトル")) {
                title = befTask.rows[0].title;
            }
            // 内容
            let content = task.content;
            if (! validateUtil.isEmptyText(content, "内容")) {
                content = befTask.rows[0].content;
            }
            // 優先度
            let priority = task.priority;
            if (! validateUtil.isEmptyText(priority, "優先度")) {
                priority = befTask.rows[0].priority;
            }
            // 担当者
            let assignUser = task.assignUser;
            if (! validateUtil.isEmptyText(assignUser, "担当者")) {
                assignUser = befTask.rows[0].assign_user;
            }
            // 開始日
            let startDate = task.startDate;
            if (! validateUtil.isEmptyText(startDate, "開始日")) {
                startDate = befTask.rows[0].start_date;
            }
            // 期限日
            let deadline = task.deadline;
            if (! validateUtil.isEmptyText(deadline, "期限日")) {
                deadline = befTask.rows[0].deadline;
            }
            // タスク順序
            let orderNo = task.order;
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
  

  module.exports = router;
