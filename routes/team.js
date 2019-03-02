/**
 * チームAPI.<br/>
 * 
 * GET(http://localhost:3000/api/v1/team/list)
 * GET(http://localhost:3000/api/v1/team)
 * POST(http://localhost:3000/api/v1/team)
 * PUT(http://localhost:3000/api/v1/team)
 * DELETE(http://localhost:3000/api/v1/team)
 * GET(http://localhost:3000/api/v1/team/users)
 * POST(http://localhost:3000/api/v1/team/users)
 */
var express = require('express');
var router = express.Router();

// DBアクセス
const db = require('../db');

// tokenUtil
const tokenUtil = require('../app/util/tokenUtil.js');
// userUtil
const userUtil = require('../app/util/userUtil.js');
// teamUtil
const teamUtil = require('../app/util/teamUtil.js');
// validateUtil
const validateUtil = require('../app/util/validateUtil.js');

/**
 * チームAPI.<br/>
 * GET(http://localhost:3000/api/v1/team/list)
 */
router.get('/list', async function(req, res, next) {
  console.log('GET:v1/team/ execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req);

  // パラメータ取得
  let params = req.query;
  // チームID
  let teamId = params.teamId;
  // validateUtil.validate400(res, teamId, "チームID", "teamId");
  // チーム名
  let teamName = params.teamName;
  // validateUtil.validate400(res, teamName, "チーム名", "teamName");

  // TODO: ユーザが見える範囲のチームのみ返却

  // SQL生成
  let sql = "SELECT * FROM sw_m_team WHERE 1 = 1 ";
  let param = [];
  if (validateUtil.isVal(teamId)) {
    sql = sql + "AND team_id = $1 ";
    param.push(teamId);
  }
  if (validateUtil.isVal(teamName)) {
    sql = sql + "AND team_name LIKE $2 ";
    param.push('%' + teamName + '%');
  }

  let teams = await db.query(sql, param);
  if (!teams.rows || teams.rows.length == 0) {
    // チームが存在しない場合、エラー
    return res.status(500).send( { message: 'チームが存在しません。' } );
  }
  res.send(teams.rows);
});

/**
 * チーム情報取得API.<br/>
 * GET(http://localhost:3000/api/v1/team)
 */
router.get('/', async function(req, res, next) {

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req);

  // パラメータ取得
  let params = req.query;
  // チームID
  let teamId = params.teamId;
  validateUtil.validate400(res, teamId, "チームID", "teamId");

  // TODO: ユーザが見える範囲のチームのみ返却

  // チーム検索
  let teams = await db.query("SELECT * FROM sw_m_team WHERE team_id = $1 ", [teamId]);
  validateUtil.queryValidate500(res, teams, "チーム");

  // チームメンバー検索
  let members = await db.query("SELECT * FROM sw_m_team_member AS smtm INNER JOIN sw_m_user AS smu ON smtm.user_id = smu.user_id WHERE smtm.team_id = $1 ", [teamId]);
  // メンバー0でも返却
  // validateUtil.queryValidate500(res, members, "チームメンバー");

  console.log(teams.rows[0])
  console.log(members.rows[0])

  let resMember = [];
  members.rows.forEach(function(row) {
    resMember.push({userId : row.user_id,
                    userName : row.user_name,
                    administratorAuthority : row.administrator_authority,
                    userAuthority : row.user_authority});
  });

  // 検索結果を返却
  res.send({teamId : teams.rows[0].team_id,
            teamName : teams.rows[0].team_name,
            content : teams.rows[0].content,
            members : resMember
  });
});


/**
 * チーム登録API.<br/>
 * POST(http://localhost:3000/api/v1/team)
 */
router.post('/', async function(req, res, next) {
  console.log('POST:v1/team execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req);

  // パラメータから登録情報を取得
  let params = req.body;
  // チームID
  let teamId = params.teamId;
  validateUtil.validate400(res, teamId, "チームID", "teamId");
  // チーム名
  let teamName = params.teamName;
  validateUtil.validate400(res, teamName, "チーム名", "teamName");
  // コンテンツ
  let content = params.content;
  // 機能名
  let functionName = params.functionName;
  validateUtil.validate400(res, functionName, "機能名", "functionName");

  // チームIDの利用可能チェック
  if (await teamUtil.isTeamId(teamId)) {
    return res.status(500).send({message : "登録済みのチームIDです。(teamId:" + teamId + ")"});
  }

  // 登録日時
  let insertDate = new Date();

  // チーム登録
  let newTeams = await db.query(
    'INSERT INTO sw_m_team (team_id, team_name, content, create_user, create_function, create_datetime, update_user, update_function, update_datetime) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)'
    , [teamId, teamName, content, userId, functionName, insertDate, userId, functionName, insertDate]);

  // 登録情報を返却
  res.send({teamId : teamId,
            teamName : teamName,
            content : content,
            createUser : userId,
            createFunction : functionName,
            createDatetime : insertDate,
            updateUser : userId,
            updateFunction : functionName,
            updateDatetime : insertDate
  });
});

/**
 * チーム更新API.<br/>
 * PUT(http://localhost:3000/api/v1/team)
 */
router.put('/', function(req, res, next) {
  console.log(req)
  // TODO: 更新処理
  res.send({test : "PUT データ更新(未実装)",
            id : req.body.teamId});
});

/**
 * チーム情報を一部更新API（※いらない？とりあえず未実装のまま放置。）.<br/>
 * PUT(http://localhost:3000/api/v1/team)
 */
router.put('/', function(req, res, next) {
  console.log(req)
  // TODO: 一部更新処理（優先度：低）
  res.send({test : "PUT 一部データ更新(未実装)",
            id : req.body.id});
});

/**
 * チーム削除API.<br/>
 * 論理削除。<br/>
 * DELETE(http://localhost:3000/api/v1/team)
 */
router.delete('/', async function(req, res, next) {
  console.log('DELETE:v1/team execution');

  // パラメータ取得
  let teamId = req.body.teamId;
  validateUtil.validate400(res, teamId, "チームID", "teamId");

  // TODO: チームの存在チェック
  // チーム削除
  let teamResult = await db.query(
    'DELETE FROM sw_m_team WHERE team_id = $1'
    , [teamId]);
  console.log(teamResult.rowCount);

  // チームメンバー削除
  let memberResult = await db.query(
    'DELETE FROM sw_m_team_member WHERE team_id = $1'
    , [teamId]);
  console.log(memberResult.rowCount);

  res.send({message : "チームの削除に成功しました。"
    ,teamId : teamId});
});

/**
 * チーム メンバー＆権限取得API.<br/>
 * GET(http://localhost:3000/api/v1/team/users)
 */

/**
 * チーム メンバー＆権限登録API.<br/>
 * POST(http://localhost:3000/api/v1/team/users)
 */
router.post('/users', async function(req, res, next) {
  console.log('POST:v1/team/users execution');
  // tokenからuserIdを取得
  let insertUserId = await tokenUtil.getUserId(req);

  // パラメータから登録情報を取得
  let params = req.body;
  let teamId = params.teamId;
  validateUtil.validate400(res, teamId, "チームID", "teamId");

  // チームの存在チェック
  if (! await teamUtil.isTeamId(teamId)) {
    return res.status(500).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
  }

  // 機能名
  let functionName = params.functionName;
  validateUtil.validate400(res, functionName, "機能名", "functionName");
  // ユーザ情報
  let users = params.users;
  validateUtil.validate400(res, users, "ユーザ情報", "users");

  let result = [];
  for (let i=0; i<users.length; i++) {
    let rowParam = users[i];
    // ユーザID
    let userId = rowParam.userId;
    validateUtil.validate400(res, userId, "ユーザID", "userId");

    // メンバーの存在チェック
   if (! await userUtil.isUserId(res, userId)) {
    return res.status(500).send({message : "存在しないユーザIDです。(userId:" + userId + ")"});
   }

    // メンバー権限
    let userAuthority = rowParam.userAuthority;
    validateUtil.validate400(res, userAuthority, "メンバー権限", "userAuthority");
    // 管理者権限
    let administratorAuthority = rowParam.administratorAuthority;
    validateUtil.validate400(res, administratorAuthority, "管理者権限", "administratorAuthority");

    // チームメンバーの存在チェック
    if (await isTeamMember(res, teamId, userId)) {
      return res.status(500).send({message : "登録済みのデータです。(teamId:" + teamId + ", userId:" + userId + ")"});
    }

    // 登録処理
    let insertResult = await insertTeamMember(teamId, userId, userAuthority, administratorAuthority, insertUserId, functionName);
    result.push(insertResult);
  }
  res.send(result);
});

/**
 * チームメンバの存在判定
 * @param {*} res
 * @param {*} teamId チームID
 * @param {*} userId ユーザID
 * @return true:存在する/false:存在しない
 */
async function isTeamMember(res, teamId, userId) {
  console.log('team - isTeamMember()');

  // チームメンバー検索
  let result = await db.query(
    'SELECT count(team_id) FROM sw_m_team_member WHERE team_id = $1 AND user_id =$2'
    , [teamId, userId]);

    if (result != null && result.rows != null && result.rows[0].count > 0) {
      return true;
    }
    return false;
}

/**
 * チームメンバの登録処理
 * @param {*} teamId ユーザID
 * @param {*} userId チームID
 * @param {*} userAuthority ユーザ権限
 * @param {*} administratorAuthority 管理者権限
 * @param {*} insertUserId 登録ユーザID
 * @param {*} functionName 登録機能名
 */
async function insertTeamMember(teamId, userId, userAuthority, administratorAuthority, insertUserId, functionName) {
  console.log('team - insertTeamMember()');
  // 登録日時
  let insertDate = new Date();

  // チーム メンバー登録
  let result = await db.query(
    'INSERT INTO sw_m_team_member (team_id, user_id, user_authority, administrator_authority, create_user, create_function, create_datetime, update_user, update_function, update_datetime) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)'
    , [teamId, userId, userAuthority, administratorAuthority, insertUserId, functionName, insertDate, insertUserId, functionName, insertDate]);

  if (result == null || result.rowCount == 0) {
    // 存在しない場合、エラー
    return res.status(500).send({message : "登録に失敗しました。(teamId:" + teamId + ", userId:" + userId + ")"});
  }
  console.log(result);

  return {userId : userId,
    teamId : teamId,
    userAuthority : userAuthority,
    administratorAuthority : administratorAuthority,
    createUser : userId,
    createFunction : functionName,
    createDatetime : insertDate,
    updateUser : userId,
    updateFunction : functionName,
    updateDatetime : insertDate
  };
}

module.exports = router;
