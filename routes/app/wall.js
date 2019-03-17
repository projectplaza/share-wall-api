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
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
      return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
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
        console.log(row)
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
    // TODO: パネルIDは、ボードID＋連番 としたい！
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

module.exports = router;
