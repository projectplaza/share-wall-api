/**
 * ウォールAPI.<br/>
 * 
 * コメント一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/comment/list)
 * コメント登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/comment)
 * コメント削除API（単体）
 * DELETE(http://localhost:3000/api/v1/wall/comment)
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
 * コメント一覧取得API（複数）
 * GET(http://localhost:3000/api/v1/wall/comment/list)
 */
router.get('/list', async function(req, res, next) {
    console.log('GET:v1/wall/comment/list execution');
  
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
    // プロジェクトIDのマスタチェック
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
    // タスクID
    let taskId = params.taskId;
    if (! validateUtil.isEmptyText(taskId, "タスクID")) {
        return res.status(400).send({message : messageUtil.errMessage001("タスクID", "taskId")});
    }
    // タスクIDのマスタチェック
    if (! await wallUtil.isTaskId(teamId, boardId, taskId)) {
        return res.status(400).send({message : "タスクIDが存在しません。(taskId:" + taskId + ")"});
    }
    // リミット
    let limit = params.limit;
    if (! validateUtil.isEmptyNumber(limit, "リミット")) {
        // 設定なしの場合は10
        limit = 10;
    }
    // オフセット
    let offset = params.offset;
    if (! validateUtil.isEmptyNumber(offset, "オフセット")) {
        // 設定なしの場合は0
        offset = 0;
    }
  
    // 検索
    let comments = await findComment(boardId, taskId, limit, offset);

    // 検索結果
    let result = {
        "teamId" : teamId
        , "projectId" : projectId
        , "boardId" : boardId
        , "taskId" : taskId
        , "coments" : comments
    };
    res.send(result);
});
/**
 * コメント情報取得処理
 * @param {*} boardId 
 * @param {*} taskId 
 * @param {*} limit 
 * @param {*} offset 
 */
async function findComment(boardId, taskId, limit, offset) {
    console.log('wall - findComment()');
    // コメント検索
    let comments = await db.query(
        `SELECT comment_id,"content"
           FROM sw_t_wall_comment comment
          WHERE comment.board_id = $1
            AND comment.task_id = $2
          ORDER BY comment_id ASC
          LIMIT $3
         OFFSET $4`,
        [boardId, taskId, limit, offset]);
    if (!comments.rows || comments.rows.length == 0) {
        // 検索結果が存在しない場合、空のリストを設定
        return [];
    } else {
        // コメント情報を設定
        let resultComments = [];
        comments.rows.forEach(async function(row) {
            resultComments.push({
                "comentId" : row.comment_id
                , "content" : row.content
            });
        });
        return resultComments;
    }
};

/**
 * コメント登録API（単体）
 * POST(http://localhost:3000/api/v1/wall/comment)
 */
router.post('/', async function(req, res, next) {
    console.log('POST:v1/wall/comment execution');
  
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
    // プロジェクトの権限チェック
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
    // タスクID
    let taskId = params.taskId;
    if (! validateUtil.isEmptyText(taskId, "タスクID")) {
      return res.status(400).send({message : messageUtil.errMessage001("タスクID", "taskId")});
    }
    // タスクIDのマスタチェック
    if (! await wallUtil.isTaskId(teamId, boardId, taskId)) {
      return res.status(400).send({message : "タスクIDが存在しません。(taskId:" + taskId + ")"});
    }
    // コメント内容
    let content = params.content;
    if (! validateUtil.isEmptyText(content, "内容")) {
        return res.status(400).send({message : messageUtil.errMessage001("内容", "content")});
    }
    // 機能名
    let functionName = params.functionName;
    if (! validateUtil.isEmptyText(functionName, "機能名")) {
        return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
    }

    // コメントID（連番）を生成
    let commentId = await generatUtil.getWallCommentId(teamId, boardId, taskId);
    let orderNo = 0;
  
    // 登録日時
    let insertDate = new Date();
  
    // コメント登録
    let newComment = await db.query(
        `INSERT INTO sw_t_wall_comment (
            team_id,
            board_id,
            task_id,
            comment_id,
            content,
            create_user,
            create_function,
            create_datetime,
            update_user,
            update_function,
            update_datetime)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $6, $7, $8)`
        , [teamId, boardId, taskId, commentId, content, 
             userId, functionName, insertDate]);
            
    // 登録情報を返却
    res.send({
        teamId : teamId,
        boardId : boardId,
        taskId : taskId,
        commentId : commentId,
        content : content,
        createUser : userId,
        createFunction : functionName,
        createDatetime : insertDate
    });
});

/**
 * コメント削除API（単体）
 * DELETE(http://localhost:3000/api/v1/wall/comment)
 */
router.delete('/', async function(req, res, next) {
    console.log('DELETE:v1/wall/comment execution');
  
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
    // タスクID
    let taskId = params.taskId;
    if (! validateUtil.isEmptyText(taskId, "タスクID")) {
      return res.status(400).send({message : messageUtil.errMessage001("タスクID", "taskId")});
    }
    // タスクIDのマスタチェック
    if (! await wallUtil.isTaskId(teamId, boardId, taskId)) {
      return res.status(400).send({message : "タスクIDが存在しません。(taskId:" + taskId + ")"});
    }
    // コメントID
    let commentId = params.commentId;
    if (! validateUtil.isEmptyText(commentId, "コメントID")) {
      return res.status(400).send({message : messageUtil.errMessage001("コメントID", "commentId")});
    }
    // コメントIDのマスタチェック
    if (! await wallUtil.isCommentId(boardId, taskId, commentId)) {
      return res.status(400).send({message : "コメントIDが存在しません。(commentId:" + commentId + ")"});
    }
  
    // コメント削除処理
    if (await deleteComment(boardId, taskId, commentId)) {
      res.send({
        message : "コメントの削除に成功しました。"
        , teamId : teamId
        , projectId : projectId
        , boardId : boardId
        , taskId : taskId
        , commentId : commentId
      });
    } else {
      res.status(500).send({
        message : "コメントの削除に失敗しました。(boardId:" + boardId + ", taskId:" + taskId + ", commentId:" + commentId + ")"
      });
    }
});
/** 
 * コメント削除処理.
 */
async function deleteComment(boardId, taskId, commentId) {
    console.log('wall - deleteComment()');

    // コメント削除
    let delComment = await db.query(
        `DELETE FROM sw_t_wall_comment
          WHERE board_id = $1
            AND task_id = $2
            AND comment_id = $3`
         , [boardId, taskId, commentId]
    );
    if (delComment.rowCount == 0) {
        // 失敗
        return false;
    }

    return true;
};

module.exports = router;
