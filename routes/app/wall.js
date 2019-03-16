/**
 * ウォールAPI.<br/>
 * 
 * ボード一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/board/list)
 * ボード詳細取得API（単体）
 * GET(http://localhost:3000/api/v1/wall/board)
 * ボード登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/board)
 * ボード更新API（単体）
 * PUT(http://localhost:3000/api/v1/wall/board)
 * ボード順序更新（複数）
 * PUT(http://localhost:3000/api/v1/wall/board/order)
 * ボード削除API（単体）
 * DELETE(http://localhost:3000/api/v1/wall/board)
 * パネル＆タスク一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/panel/task/list)
 * パネル一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/panel/list)
 * パネル詳細取得API（単体）
 * GET(http://localhost:3000/api/v1/wall/panel)
 * パネル登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/panel)
 * パネル更新API（単体）
 * PUT(http://localhost:3000/api/v1/wall/panel)
 * パネル順序更新API（複数）
 * PUT(http://localhost:3000/api/v1/wall/panel/list/order)
 * パネル削除API（単体）
 * DELETE(http://localhost:3000/api/v1/wall/panel)
 * タスク一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/task/list)
 * タスク詳細取得API（単体）
 * GET(http://localhost:3000/api/v1/wall/task)
 * タスク更新API（単体）
 * PUT(http://localhost:3000/api/v1/wall/task)
 * タスク所属パネル＆順序更新API（複数）
 * PUT(http://localhost:3000/api/v1/wall/task/order/panel)
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

/**
 * ボード一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/board/list)
 */
/**
 * ボード詳細取得API（単体）
 * GET(http://localhost:3000/api/v1/wall/board)
 */

/**
 * ボード登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/board)
 *   "teamId" : "チームID",
    "projectId" : "プロジェクトID",
    "boardName": "ボード名",
    "functionName" : "機能名"
 */
router.post('/board', async function(req, res, next) {
    console.log('POST:v1/wall/board execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータから登録情報を取得
    let params = req.body;
    // チームID
    let teamId = params.teamId;
    validateUtil.isEmptyText(res, teamId, "チームID", "teamId");
    // プロジェクトID
    let projectId = params.projectId;
    validateUtil.isEmptyText(res, projectId, "プロジェクトID", "projectId");
    // ボード名
    let boardName = params.boardName;
    validateUtil.isEmptyText(res, boardName, "ボード名", "boardName");
    // 機能名
    let functionName = params.functionName;
    validateUtil.isEmptyText(res, functionName, "機能名", "functionName");

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
  
  


module.exports = router;
