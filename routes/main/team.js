/**
 * チームAPI.<br/>
 * 
 * チーム一覧取得API
 * GET(http://localhost:3000/api/v1/teams/list)
 * チーム取得API
 * GET(http://localhost:3000/api/v1/teams)
 * チーム登録API
 * POST(http://localhost:3000/api/v1/teams)
 * チームメンバー登録API
 * POST(http://localhost:3000/api/v1/teams/users)
 * チーム更新API
 * PUT(http://localhost:3000/api/v1/teams)
 * チームメンバー更新API
 * PUT(http://localhost:3000/api/v1/teams/users)
 * チーム削除API
 * DELETE(http://localhost:3000/api/v1/teams)
 * GET(http://localhost:3000/api/v1/teams/users)
 */
var express = require('express');
var router = express.Router();

// DBアクセス
const db = require('../../db');

// util
const tokenUtil = require('../../app/util/main/tokenUtil.js');
const userUtil = require('../../app/util/main/userUtil.js');
const teamUtil = require('../../app/util/main/teamUtil.js');
const validateUtil = require('../../app/util/validateUtil.js');
const messageUtil = require('../../app/util/messageUtil.js');

/**
 * チーム一覧取得API.<br/>
 * GET(http://localhost:3000/api/v1/teams/list)
 */
router.get('/list', async function(req, res, next) {
  console.log('GET:v1/teams/ execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);

  // メンバー、管理者権限を持つチームの一覧を取得
  let teams = await db.query(
    `SELECT tm.team_id, tm.team_name, tm."content"
     FROM sw_m_team tm
     INNER JOIN (
      (SELECT *
       FROM sw_m_team_member
       WHERE user_id = $1
       AND user_authority = true)
      UNION
      (SELECT *
       FROM sw_m_team_member
       WHERE user_id = $1
       AND administrator_authority = true)
      ) AS mytm
     ON tm.team_id = mytm.team_id`
    , [userId]
  );
  if (!teams.rows || teams.rows.length == 0) {
    // チームが存在しない場合、空のリストを返却
    return res.send([]);
  }

  let resTeams = [];
  teams.rows.forEach( function(row) {
    resTeams.push({
      teamId : row.team_id,
      teamName : row.team_name,
      content : row.content})
  });
  res.send(resTeams);
});

/**
 * チーム取得API.<br/>
 * GET(http://localhost:3000/api/v1/teams)
 */
router.get('/', async function(req, res, next) {

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);

  // パラメータ取得
  let params = req.query;
  // チームID
  let teamId = params.teamId;
  if (! validateUtil.isEmptyText(teamId, "チームID")) {
    return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
  }

  // チーム検索
  let teams = await db.query(
    `SELECT tm.team_id, tm.team_name, tm."content"
     FROM sw_m_team tm
     INNER JOIN (
      (SELECT *
       FROM sw_m_team_member
       WHERE user_id = $1
       AND user_authority = true)
      UNION
      (SELECT *
       FROM sw_m_team_member
       WHERE user_id = $1
       AND administrator_authority = true)
    ) AS mytm
    ON tm.team_id = mytm.team_id
    WHERE tm.team_id = $2`
    , [userId, teamId]
  );
  if (! validateUtil.isQueryResult(teams, "チーム")) {
    // 検索結果が存在しない場合、エラー
    return res.status(400).send({message : messageUtil.errMessage002("チーム")});
  }

  // チームメンバー検索
  let members = await db.query(
    `SELECT * 
     FROM sw_m_team_member AS smtm 
     INNER JOIN sw_m_user AS smu 
     ON smtm.user_id = smu.user_id 
     WHERE smtm.team_id = $1 `
    , [teamId]
  );
  // メンバーは0でも返却する
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
 * POST(http://localhost:3000/api/v1/teams)
 */
router.post('/', async function(req, res, next) {
  console.log('POST:v1/teams execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);

  // パラメータから登録情報を取得
  let params = req.body;
  // チームID
  let teamId = params.teamId;
  if (! validateUtil.isEmptyText(teamId, "チームID")) {
    return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
  }
  // チーム名
  let teamName = params.teamName;
  if (! validateUtil.isEmptyText(teamName, "チーム名")) {
    return res.status(400).send({message : messageUtil.errMessage001("チーム名", "teamName")});
  }

  // コンテンツ
  let content = params.content;
  // 機能名
  let functionName = params.functionName;
  if (! validateUtil.isEmptyText(functionName, "機能名")) {
    return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
  }

  // チームIDの利用可能チェック
  if (await teamUtil.isTeamId(res, teamId)) {
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
 * PUT(http://localhost:3000/api/v1/teams)
 */
router.put('/', async function(req, res, next) {
  console.log('PUT:v1/teams execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);

  // パラメータから登録情報を取得
  let params = req.body;
  // チームID
  let teamId = params.teamId;
  if (! validateUtil.isEmptyText(teamId, "チームID")) {
    return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
  }
  // チームIDのマスタ存在チェック
  if (! await teamUtil.isTeamId(res, teamId)) {
    return res.status(400).send({message : messageUtil.errMessage002("チーム")});
  }
  // チームの権限チェック
  if (! await teamUtil.isTeamAuthority(teamId, userId)) {
    return res.status(400).send({message : messageUtil.errMessage003("チーム")}); 
  }
  // チーム名
  let teamName = params.teamName;
  // コンテンツ
  let content = params.content;
  // 機能名
  let functionName = params.functionName;
  if (! validateUtil.isEmptyText(functionName, "機能名")) {
    return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
  }

  // チーム検索
  let team = await db.query(
    `SELECT * 
     FROM sw_m_team
     WHERE team_id = $1`
     , [teamId]
  );
  if (team.rowCount == 0) {
    return res.status(500).send({message : "チーム取得に失敗しました。(teamId:" + teamId + ")"});
  }

  // 更新用チーム名
  let updateTeamName = team.rows[0].team_name;
  if (validateUtil.isEmptyText(teamName, "チーム名")) {
    updateTeamName = teamName;
  }
  // 更新用コンテンツ
  let updateContent = team.rows[0].content;
  if (validateUtil.isEmptyText(content, "内容")) {
    updateContent = content;
  }
  // 更新日時
  let updateDate = new Date();

  // チーム更新
  let updTeam = await db.query(
    `UPDATE sw_m_team 
        SET team_name = $1 
          , content = $2 
          , update_user = $3 
          , update_function = $4 
          , update_datetime = $5 
      WHERE team_id = $6`
    , [
      updateTeamName
      , updateContent
      , userId
      , functionName
      , updateDate
      , teamId
    ]
  );
  if (updTeam.rowCount == 0) {
    return res.status(500).send({message : "チーム更新に失敗しました。(teamId:" + teamId + ")"});
  }

  // 更新情報を返却
  res.send({
    message : "チームの更新に成功しました。",
    teamId : teamId,
    teamName : updateTeamName,
    content : updateContent,
    updateUser : userId,
    updateFunction : functionName,
    updateDatetime : updateDate
  });
});

/**
 * チームメンバー権限更新API.<br/>
 * PUT(http://localhost:3000/api/v1/teams/users)
 */
router.put('/users', async function(req, res, next) {
  console.log('PUT:v1/teams execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);

  // パラメータから登録情報を取得
  let params = req.body;
  // チームID
  let teamId = params.teamId;
  if (! validateUtil.isEmptyText(teamId, "チームID")) {
    return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
  }
  // チームIDのマスタ存在チェック
  if (! await teamUtil.isTeamId(res, teamId)) {
    return res.status(400).send({message : messageUtil.errMessage002("チーム")});
  }
  // チームの権限チェック
  if (! await teamUtil.isTeamAuthority(teamId, userId)) {
    return res.status(400).send({message : messageUtil.errMessage003("チーム")}); 
  }
  // 機能名
  let functionName = params.functionName;
  if (! validateUtil.isEmptyText(functionName, "機能名")) {
    return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
  }
  // ユーザ情報
  let users = params.users;
  if (! validateUtil.isEmptyText(users, "ユーザ情報")) {
    return res.status(400).send({message : messageUtil.errMessage001("ユーザ情報", "users")});
  }
  // 更新日時
  let updateDate = new Date();

  let resultUsers = [];
  await Promise.all(
    users.map(async function(user) {
      // ユーザID
      let targetUserId = user.userId;
      if (! validateUtil.isEmptyText(targetUserId, "ユーザID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ユーザID", "userId")});
      }
      // ユーザの存在チェック
      if (! await userUtil.isUserId(res, userId)) {
        return res.status(500).send({message : "存在しないユーザIDです。(userId:" + userId + ")"});
      }
      // 管理者権限
      let administrator = user.administrator;
      let administratorAuthority = false;
      if (administrator != undefined && administrator != "" && administrator == 1) {
        // 1の場合、管理者
        administratorAuthority = true;
        administrator = 1;
      } else {
        administrator = 0;
      }

      // チーム更新
      let updTeamMember = await db.query(
        `UPDATE sw_m_team_member 
            SET administrator_authority = $1  
              , update_user = $2 
              , update_function = $3 
              , update_datetime = $4 
          WHERE team_id = $5
            AND user_id = $6`
        , [
          administratorAuthority
          , userId
          , functionName
          , updateDate
          , teamId
          , targetUserId
        ]
      );
      if (updTeamMember.rowCount == 0) {
        return res.status(500).send({message : "チームメンバーの更新に失敗しました。(teamId:" + teamId + ", userId:" + userId + ")"});
      }

      resultUsers.push({
        'userId' : targetUserId,
        'administrator' : administrator
      });
    })
  );

  // 更新情報を返却
  res.send({
    message : "チームメンバーの更新に成功しました。",
    teamId : teamId,
    users : resultUsers,
    updateUser : userId,
    updateFunction : functionName,
    updateDatetime : updateDate
  });
});

/**
 * チーム削除API.<br/>
 * 論理削除。<br/>
 * DELETE(http://localhost:3000/api/v1/teams)
 */
router.delete('/', async function(req, res, next) {
  console.log('DELETE:v1/teams execution');
  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);


  // パラメータ取得
  let teamId = req.body.teamId;
  if (! validateUtil.isEmptyText(teamId, "チームID")) {
    return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
  }
  // チームIDのマスタ存在チェック
  if (! await teamUtil.isTeamId(res, teamId)) {
    return res.status(400).send({message : messageUtil.errMessage002("チーム")});
  }
  // チームの権限チェック
  if (! await teamUtil.isTeamAuthority(teamId, userId)) {
    return res.status(400).send({message : messageUtil.errMessage003("チーム")}); 
  }

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
 * チーム メンバー＆権限登録API.<br/>
 * POST(http://localhost:3000/api/v1/teams/users)
 */
router.post('/users', async function(req, res, next) {
  console.log('POST:v1/teams/users execution');
  // tokenからuserIdを取得
  let insertUserId = await tokenUtil.getUserId(req, res);

  // パラメータから登録情報を取得
  let params = req.body;
  let teamId = params.teamId;
  if (! validateUtil.isEmptyText(teamId, "チームID")) {
    return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
  }
  // チームIDのマスタ存在チェック
  if (! await teamUtil.isTeamId(res, teamId)) {
    return res.status(400).send({message : messageUtil.errMessage002("チーム")});
  }
  // 初回登録時、メンバー０人のためチェックしない
  // // チームの権限チェック
  // if (! await teamUtil.isTeamAuthority(teamId, insertUserId)) {
  //   return res.status(400).send({message : messageUtil.errMessage003("チーム")}); 
  // }

  // 機能名
  let functionName = params.functionName;
  if (! validateUtil.isEmptyText(functionName, "機能名")) {
    return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
  }
  // ユーザ情報
  let users = params.users;
  if (! validateUtil.isEmptyText(users, "ユーザ情報")) {
    return res.status(400).send({message : messageUtil.errMessage001("ユーザ情報", "users")});
  }

  let result = [];
  for (let i=0; i<users.length; i++) {
    let rowParam = users[i];
    // ユーザID
    let userId = rowParam.userId;
    if (! validateUtil.isEmptyText(userId, "ユーザID")) {
      return res.status(400).send({message : messageUtil.errMessage001("ユーザID", "userId")});
    }

    // メンバーの存在チェック
    if (! await userUtil.isUserId(res, userId)) {
      return res.status(500).send({message : "存在しないユーザIDです。(userId:" + userId + ")"});
    }

    // メンバー権限
    let userAuthority = rowParam.userAuthority;
    if (! validateUtil.isEmptyBool(userAuthority, "メンバー権限")) {
      return res.status(400).send({message : messageUtil.errMessage001("メンバー権限", "userAuthority")});
    }
    // 管理者権限
    let administratorAuthority = rowParam.administratorAuthority;
    if (! validateUtil.isEmptyBool(administratorAuthority, "管理者権限")) {
      return res.status(400).send({message : messageUtil.errMessage001("管理者権限", "administratorAuthority")});
    }

    // チームメンバーの存在チェック
    if (await isTeamMember(teamId, userId)) {
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
 * @param {*} teamId チームID
 * @param {*} userId ユーザID
 * @return true:存在する/false:存在しない
 */
async function isTeamMember(teamId, userId) {
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
