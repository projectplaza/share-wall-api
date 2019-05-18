/**
 * ウォールAPI.<br/>
 * 
 * ボード一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/board/list)
 * ボード登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/board)
 * ボード更新API（複数）
 * PUT(http://localhost:3000/api/v1/wall/board)
 * ボード削除API（単体）
 * DELETE(http://localhost:3000/api/v1/wall/board)
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
const wallUtil = require('./wallUtil.js');
const generatUtil = require('../../app/util/generatUtil.js');
const validateUtil = require('../../app/util/validateUtil.js');
const messageUtil = require('../../app/util/messageUtil.js');

/**
 * ボード一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/board/list)
 */
router.get('/list', async function(req, res, next) {
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
 * ボード登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/board)
 */
router.post('/', async function(req, res, next) {
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
 * ボード更新API（複数）
 * PUT(http://localhost:3000/api/v1/wall/board)
 */
router.put('/', async function(req, res, next) {
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
            // ボードIDのマスタチェック
            if (! await wallUtil.isBoardId(boardId)) {
                return res.status(400).send({message : "ボードIDが存在しません。(boardId:" + boardId + ")"});
            }

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
 * ボード削除API（単体）
 * DELETE(http://localhost:3000/api/v1/wall/board)
 */
router.delete('/', async function(req, res, next) {
    console.log('DELETE:v1/wall/board execution');
  
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
  
    // ボード削除処理
    if (await deleteBoard(teamId, projectId, boardId)) {
      res.send({
        message : "ボードの削除に成功しました。"
        , teamId : teamId
        , projectId : projectId
        , boardId : boardId
      });
    } else {
      res.status(500).send({
        message : "ボードの削除に失敗しました。(boardId:" + boardId + ")"
      });
    }
});
/** 
 * ボード削除処理.
 * 関連するボード、パネル、タスクを全て削除
 */
async function deleteBoard(teamId, projectId, boardId) {
    console.log('wall - deleteBoard()');

    // ボード削除
    let delBoard = await db.query(
      `DELETE FROM sw_t_wall_board 
        WHERE team_id = $1 
          AND project_id = $2 
          AND board_id = $3`
       , [teamId, projectId, boardId]
    );
    if (delBoard.rowCount == 0) {
        // 失敗
        return false;
    }

    // パネル削除
    let delPanel = await db.query(
      `DELETE FROM sw_t_wall_panel 
        WHERE board_id = $1`
       , [boardId]
    );
    if (delPanel.rowCount == 0) {
        // 失敗でもOK
        // return false;
    }

    // タスク削除
    let delTask = await db.query(
        `DELETE FROM sw_t_wall_task 
          WHERE board_id = $1`
         , [boardId]
    );
    if (delTask.rowCount == 0) {
        // 失敗でもOK
        // return false;
    }

    return true;
};

module.exports = router;
