/**
 * プロジェクトAPI.<br/>
 * 
 * プロジェクト一覧取得API
 * GET(http://localhost:3000/api/v1/projects/list)
 * プロジェクト取得API
 * GET(http://localhost:3000/api/v1/projects)
 * POST(http://localhost:3000/api/v1/projects)
 * DELETE(http://localhost:3000/api/v1/projects)
 * POST(http://localhost:3000/api/v1/projects/users)
 */
var express = require('express');
var router = express.Router();

// DBアクセス
const db = require('../../db');

// util
const tokenUtil = require('../../app/util/main/tokenUtil.js');
const userUtil = require('../../app/util/main/userUtil.js');
const teamUtil = require('../../app/util/main/teamUtil.js');
const projectUtil = require('../../app/util/main/projectUtil.js');
const validateUtil = require('../../app/util/validateUtil.js');
const messageUtil = require('../../app/util/messageUtil.js');

/**
 * プロジェクト一覧取得API.<br/>
 * GET(http://localhost:3000/api/v1/projects/list)
 */
router.get('/list', async function(req, res, next) {
  console.log('GET:v1/projects/list execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);

  // パラメータ取得
  let params = req.query;
  // チームID
  let teamId = params.teamId;
  if (! validateUtil.isParamVal(teamId, "チームID")) {
    return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
  }
  // チームの存在チェック
  if (! await teamUtil.isTeamId(res, teamId)) {
    return res.status(400).send({message : messageUtil.errMessage002("チーム")}); 
  }
  // チームの権限チェック
  if (! await teamUtil.isTeamAuthority(teamId, userId)) {
    return res.status(400).send({message : messageUtil.errMessage003("チーム")}); 
  }

  // メンバー、管理者権限を持つプロジェクトの一覧を取得
  let projects = await db.query(
    `SELECT pj.team_id, pj.project_id, pj.project_name, pj."content"
    FROM sw_m_project pj
    INNER JOIN (
      (SELECT project_id, user_id
      FROM sw_m_project_member
      WHERE user_id = $1
      AND user_authority = true)
      UNION
      (SELECT project_id, user_id
      FROM sw_m_project_member
      WHERE user_id = $1
      AND administrator_authority = true)
      ) as mypj
    ON pj.project_id = mypj.project_id
    WHERE pj.team_id = $2`
    , [userId, teamId]
  );
  if (!projects.rows || projects.rows.length == 0) {
    // プロジェクトが存在しない場合、空のリストを返却
    return res.send([]);
  }
  res.send(projects.rows);
});

/**
 * プロジェクト情報取得API.<br/>
 * GET(http://localhost:3000/api/v1/projects)
 */
router.get('/', async function(req, res, next) {

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);

  // パラメータ取得
  let params = req.query;
  // プロジェクトID
  let projectId = params.projectId;
  if (! validateUtil.isParamVal(projectId, "プロジェクトID")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
  }

  // TODO: ユーザが見える範囲のみ返却

  // プロジェクト検索
  let projects = await db.query("SELECT * FROM sw_m_project WHERE project_id = $1 ", [projectId]);
  if (! validateUtil.isQueryResult(document, "ドキュメント")) {
    return res.status(400).send({message : messageUtil.errMessage002("ドキュメント")});
  }

  // プロジェクトメンバー検索
  // メンバー0でも返却
  let members = await db.query("SELECT * FROM sw_m_project_member AS smtm INNER JOIN sw_m_user AS smu ON smtm.user_id = smu.user_id WHERE smtm.project_id = $1 ", [projectId]);

  let resMember = [];
  members.rows.forEach(function(row) {
    resMember.push({userId : row.user_id,
                    userName : row.user_name,
                    administratorAuthority : row.administrator_authority,
                    userAuthority : row.user_authority});
  });

  // 検索結果を返却
  res.send({projectId : projects.rows[0].project_id,
            projectName : projects.rows[0].project_name,
            content : projects.rows[0].content,
            members : resMember
  });
});

/**
 * プロジェクト登録API.<br/>
 * POST(http://localhost:3000/api/v1/projects)
 */
router.post('/', async function(req, res, next) {
  console.log('POST:v1/projects execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);

  // パラメータから登録情報を取得
  let params = req.body;
  // プロジェクトID
  let projectId = params.projectId;
  if (! validateUtil.isParamVal(projectId, "プロジェクトID")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
  }
  // プロジェクト名
  let projectName = params.projectName;
  if (! validateUtil.isParamVal(projectName, "プロジェクト名")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクト名", "projectName")});
  }

  // コンテンツ
  let content = params.content;
  // 機能名
  let functionName = params.functionName;
  if (! validateUtil.isParamVal(functionName, "機能名")) {
    return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
  }

  // プロジェクトIDの利用可能チェック
  if (await projectUtil.isProjectId(res, projectId)) {
    return res.status(500).send({message : "登録済みのプロジェクトIDです。(projectId:" + projectId + ")"});
  }

  // 登録日時
  let insertDate = new Date();

  // プロジェクト登録
  let newProjects = await db.query(
    'INSERT INTO sw_m_project (project_id, project_name, content, create_user, create_function, create_datetime, update_user, update_function, update_datetime) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)'
    , [projectId, projectName, content, userId, functionName, insertDate, userId, functionName, insertDate]);

  // 登録情報を返却
  res.send({projectId : projectId,
            projectName : projectName,
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
 * プロジェクト削除API.<br/>
 * 論理削除。<br/>
 * DELETE(http://localhost:3000/api/v1/projects)
 */
router.delete('/', async function(req, res, next) {
  console.log('DELETE:v1/projects execution');

  // パラメータ取得
  let projectId = req.body.projectId;
  if (! validateUtil.isParamVal(projectId, "プロジェクトID")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
  }

  // TODO: プロジェクトの存在チェック
  // プロジェクト削除
  let projectResult = await db.query(
    'DELETE FROM sw_m_project WHERE project_id = $1'
    , [projectId]);
  console.log(projectResult.rowCount);

  // プロジェクトメンバー削除
  let memberResult = await db.query(
    'DELETE FROM sw_m_project_member WHERE project_id = $1'
    , [projectId]);
  console.log(memberResult.rowCount);

  res.send({message : "プロジェクトの削除に成功しました。"
    ,projectId : projectId});
});

/**
 * プロジェクト メンバー＆権限登録API.<br/>
 * POST(http://localhost:3000/api/v1/projects/users)
 */
router.post('/users', async function(req, res, next) {
  console.log('POST:v1/projects/users execution');
  // tokenからuserIdを取得
  let insertUserId = await tokenUtil.getUserId(req, res);

  // パラメータから登録情報を取得
  let params = req.body;
  let projectId = params.projectId;
  if (! validateUtil.isParamVal(projectId, "プロジェクトID")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
  }

  // プロジェクトの存在チェック
  if (! await projectUtil.isProjectId(res, projectId)) {
    return res.status(500).send({message : "プロジェクトIDが存在しません。(projectId:" + projectId + ")"});
  }

  // 機能名
  let functionName = params.functionName;
  if (! validateUtil.isParamVal(functionName, "機能名")) {
    return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
  }
  // ユーザ情報
  let users = params.users;
  if (! validateUtil.isParamVal(users, "ユーザ情報")) {
    return res.status(400).send({message : messageUtil.errMessage001("ユーザ情報", "users")});
  }


  let result = [];
  for (let i=0; i<users.length; i++) {
    let rowParam = users[i];
    // ユーザID
    let userId = rowParam.userId;
    if (! validateUtil.isParamVal(userId, "ユーザID")) {
      return res.status(400).send({message : messageUtil.errMessage001("ユーザID", "userId")});
    }
  

    // メンバーの存在チェック
   if (! await userUtil.isUserId(res, userId)) {
    return res.status(500).send({message : "存在しないユーザIDです。(userId:" + userId + ")"});
   }

    // メンバー権限
    let userAuthority = rowParam.userAuthority;
    if (! validateUtil.isParamVal(userAuthority, "メンバー権限")) {
      return res.status(400).send({message : messageUtil.errMessage001("メンバー権限", "userAuthority")});
    }
  
    // 管理者権限
    let administratorAuthority = rowParam.administratorAuthority;
    if (! validateUtil.isParamVal(administratorAuthority, "管理者権限")) {
      return res.status(400).send({message : messageUtil.errMessage001("管理者権限", "administratorAuthority")});
    }

    // プロジェクトメンバーの存在チェック
    if (await projectUtil.isProjectMember(projectId, userId)) {
      return res.status(500).send({message : "登録済みのデータです。(projectId:" + projectId + ", userId:" + userId + ")"});
    }

    // 登録処理
    let insertResult = await insertProjectMember(projectId, userId, userAuthority, administratorAuthority, insertUserId, functionName);
    result.push(insertResult);
  }
  res.send(result);
});

/**
 * プロジェクトメンバの登録処理
 * @param {*} projectId プロジェクトID
 * @param {*} userId ユーザID
 * @param {*} userAuthority ユーザ権限
 * @param {*} administratorAuthority 管理者権限
 * @param {*} insertUserId 登録ユーザID
 * @param {*} functionName 登録機能名
 */
async function insertProjectMember(projectId, userId, userAuthority, administratorAuthority, insertUserId, functionName) {
  console.log('project - insertProjectMember()');
  // 登録日時
  let insertDate = new Date();

  // プロジェクト メンバー登録
  let result = await db.query(
    'INSERT INTO sw_m_project_member (project_id, user_id, user_authority, administrator_authority, create_user, create_function, create_datetime, update_user, update_function, update_datetime) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)'
    , [projectId, userId, userAuthority, administratorAuthority, insertUserId, functionName, insertDate, insertUserId, functionName, insertDate]);

  if (result == null || result.rowCount == 0) {
    // 存在しない場合、エラー
    return res.status(500).send({message : "登録に失敗しました。(projectId:" + projectId + ", userId:" + userId + ")"});
  }
  console.log(result);

  return {userId : userId,
    projectId : projectId,
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
