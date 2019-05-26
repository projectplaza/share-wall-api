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
 * メンバー一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/board/members/list)
 * メンバー登録API（複数）
 * POST(http://localhost:3000/api/v1/wall/board/members)
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
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
      return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // プロジェクト所属チェック
    if (! await projectUtil.hasMember(teamId, projectId, userId)) {
        return res.status(400).send({message : messageUtil.errMessage003("プロジェクトメンバー")});
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
        "teamId" : row.team_id,
        "projectId" : row.project_id,
        "boardId" : row.board_id,
        "boardName" : row.board_name,
        "order" : row.order_no,
        "content" : row.content,
        "backImage" : row.back_image,
        "backImageName" : row.back_image_name,
        "colorCd" : row.color_cd,
        "openFlag" : row.open_flag,
        "statusCd" : row.status_cd
      });
    });
    res.send(result);
});

/**
 * メンバー一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/board/members/list)
 */
router.get('/members/list', async function(req, res, next) {
    console.log('GET:v2/wall/board/members/list execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータ取得
    let params = req.query;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
      return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // チームメンバーチェック
    if (! await teamUtil.hasMember(teamId, userId)) {
        return res.status(400).send({message : "チームに所属していません。(teamId:" + teamId + ")"});
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
    let members = await db.query(
        `SELECT mu.user_id
              , mu.user_name
              , mu.icon
              , mu.icon_name
           FROM sw_t_wall_board_member tm
           LEFT JOIN sw_m_user mu
             ON tm.user_id = mu.user_id
          WHERE tm.team_id = $1
            AND tm.board_id = $2`,
        [teamId, boardId]);
    if (!members.rows || members.rows.length == 0) {
      // ボードが存在しない場合、空のリストを返却
      return res.send([]);
    }

    let resultMember = [];
    members.rows.forEach(await function(row) {
        resultMember.push({
            "userId": row.user_id,
            "userName": row.user_name,
            "icon": row.icon,
            "icon_name": row.icon_name
      });
    });
    res.send({
        "teamId" : teamId
        , "boardId" : boardId
        , "members" : resultMember
    });
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
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
        return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // プロジェクト所属チェック
    if (! await projectUtil.hasMember(teamId, projectId, userId)) {
        return res.status(400).send({message : messageUtil.errMessage003("プロジェクトメンバー")});
    }
    // ボード名
    let boardName = params.boardName;
    if (! validateUtil.isEmptyText(boardName, "ボード名")) {
        return res.status(400).send({message : messageUtil.errMessage001("ボード名", "boardName")});
    }
    // 説明
    let content = params.content;
    // 背景画像
    let backImage = params.backImage;
    // 背景画像名
    let backImageName = params.backImageName;
    // カラーCD
    let colorCd = params.colorCd;
    // 公開フラグ
    let openFlag = params.openFlag;
    // ステータスCD
    let statusCd = params.statusCd;
    // 機能名
    let functionName = params.functionName;
    if (! validateUtil.isEmptyText(functionName, "機能名")) {
        return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
    }

    // ボードIDを生成
    let boardId = await generatUtil.getWallBoardId(teamId);
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
                content,
                back_image,
                back_image_name,
                color_cd,
                open_flag,
                status_cd,
                create_user,
                create_function,
                create_datetime,
                update_user,
                update_function,
                update_datetime)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $12, $13, $14)`
        , [
            teamId,
            projectId,
            boardId,
            boardName,
            orderNo,
            content,
            backImage,
            backImageName,
            colorCd,
            openFlag,
            statusCd,
            userId,
            functionName,
            insertDate
        ]
    );
  
    // 登録情報を返却
    res.send({
        message : "ボードを登録しました。",
        teamId : teamId,
        projectId : projectId,
        boardId : boardId,
        boardName : boardName,
        orderNo : orderNo,
        content : content,
        backImage : backImage,
        backImageName : backImageName,
        colorCd : colorCd,
        openFlag : openFlag,
        statusCd : statusCd
    });
});

/**
 * メンバー登録API（複数）
 * POST(http://localhost:3000/api/v1/wall/board/members)
 */
router.post('/members', async function(req, res, next) {
    console.log('POST:v2/wall/board/members execution');
  
    // tokenからuserIdを取得
    let userId = await tokenUtil.getUserId(req, res);
  
    // パラメータから登録情報を取得
    let params = req.body;
    // チームID
    let teamId = params.teamId;
    if (! validateUtil.isEmptyText(teamId, "チームID")) {
        return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
    }
    // チーム管理者チェック
    if (! await teamUtil.hasAdmin(teamId, userId)) {
        return res.status(400).send({message : "チームに所属していません。(teamId:" + teamId + ")"});
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
    // メンバー
    let members = params.members;
    if (! validateUtil.isEmptyObject(members, "メンバー")) {
        return res.status(400).send({message : messageUtil.errMessage001("メンバー", "members")});
    }
    // 機能名
    let functionName = params.functionName;
    if (! validateUtil.isEmptyText(functionName, "機能名")) {
        return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
    }

    // メンバー削除
    await db.query(
        `DELETE FROM sw_t_wall_board_member 
          WHERE team_id = $1
            AND board_id = $2`
         , [teamId, boardId]
    );

    // 登録日時
    let insertDate = new Date();

    // メンバー登録
    await Promise.all(
        members.map(async function(member) {

            // メンバーID
            let memberId = member.userId;
            if (! validateUtil.isEmptyText(memberId, "メンバーID")) {
                return res.status(400).send({message : messageUtil.errMessage001("メンバーID", "userId")});
            }

            // メンバー登録
            await db.query(
                `INSERT INTO sw_t_wall_board_member (
                    team_id,
                    board_id,
                    user_id,
                    create_user,
                    create_function,
                    create_datetime)
                 VALUES ($1, $2, $3, $4, $5, $6)`
                , [teamId, boardId, memberId, userId, functionName, insertDate]);
        })
    );    

    // 登録情報を返却
    res.send({
        "message": "ボードメンバーを登録しました。",
        "teamId" : teamId,
        "boardId" : boardId,
        "members" : members
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
    // プロジェクトID
    let projectId = params.projectId;
    if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
        return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
    }
    // プロジェクト所属チェック
    if (! await projectUtil.hasMember(teamId, projectId, userId)) {
        return res.status(400).send({message : messageUtil.errMessage003("プロジェクトメンバー")});
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
            if (! await wallUtil.isBoardId(teamId, boardId)) {
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
            // 説明
            let content = board.content;
            if (! validateUtil.isEmptyText(content, "説明")) {
                content = befBoard.rows[0].content;
            }
            // 背景画像
            let backImage = board.backImage;
            if (! validateUtil.isEmptyText(backImage, "背景画像")) {
                backImage = befBoard.rows[0].back_image;
            }
            // 背景画像名
            let backImageName = board.backImageName;
            if (! validateUtil.isEmptyText(backImageName, "背景画像名")) {
                backImageName = befBoard.rows[0].back_image_name;
            }
            // カラーCD
            let colorCd = board.colorCd;
            if (! validateUtil.isEmptyText(colorCd, "カラーCD")) {
                colorCd = befBoard.rows[0].color_cd;
            }
            // 公開フラグ
            let openFlag = board.openFlag;
            if (! validateUtil.isEmptyBool(openFlag, "公開フラグ")) {
                openFlag = befBoard.rows[0].open_flag;
            }
            // ステータスCD
            let statusCd = board.statusCd;
            if (! validateUtil.isEmptyText(statusCd, "ステータスCD")) {
                statusCd = befBoard.rows[0].status_cd;
            }
            // ボード更新
            await db.query(
                  `UPDATE sw_t_wall_board 
                      SET team_id = $1
                        , project_id = $2
                        , board_id = $3
                        , board_name = $4
                        , order_no = $5
                        , content = $6
                        , back_image = $7
                        , back_image_name = $8
                        , color_cd = $9
                        , open_flag = $10
                        , status_cd = $11
                        , update_user = $12
                        , update_function = $13
                        , update_datetime = $14
                    WHERE team_id = $1
                      AND project_id = $2
                      AND board_id = $3 `
                , [
                    teamId,
                    projectId,
                    boardId,
                    boardName,
                    orderNo,
                    content,
                    backImage,
                    backImageName,
                    colorCd,
                    openFlag,
                    statusCd,
                    userId,
                    functionName,
                    updateDate
                ]);
        
            resultBoards.push({
                'boardId' : boardId,
                'boardName' : boardName,
                'order' : orderNo,
                'content' : content,
                'backImage' : backImage,
                'backImageName' : backImageName,
                'colorCd' : colorCd,
                'openFlag' : openFlag,
                'statusCd' : statusCd
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

    // ボードメンバー削除
    let delMember = await db.query(
        `DELETE FROM sw_t_wall_board_member 
          WHERE team_id = $1 
            AND board_id = $2`
         , [teamId, boardId]
      );
      if (delMember.rowCount == 0) {
        // 失敗でもOK
        // return false;
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
