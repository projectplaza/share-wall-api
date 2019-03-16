/**
 * プロジェクトAPI.<br/>
 * 
 * GET(http://localhost:3000/api/v1/project/list)
 * GET(http://localhost:3000/api/v1/project)
 * POST(http://localhost:3000/api/v1/project)
 * DELETE(http://localhost:3000/api/v1/project)
 * POST(http://localhost:3000/api/v1/project/users)
 */
var express = require('express');
var router = express.Router();

// DBアクセス
const db = require('../../db');

// tokenUtil
const tokenUtil = require('../../app/util/main/tokenUtil.js');
// userUtil
const userUtil = require('../../app/util/main/userUtil.js');
// projectUtil
const projectUtil = require('../../app/util/main/projectUtil.js');
// validateUtil
const validateUtil = require('../../app/util/validateUtil.js');

/**
 * プロジェクト一覧取得API.<br/>
 * GET(http://localhost:3000/api/v1/project/list)
 */
router.get('/list', async function(req, res, next) {
  console.log('GET:v1/project/ execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);

  // パラメータ取得（存在すれば検索条件として利用する）
  let params = req.query;
  // プロジェクトID
  let projectId = params.projectId;
  // プロジェクト名
  let projectName = params.projectName;

  // TODO: ユーザが見える範囲のみ返却

  // SQL生成
  let sql = "SELECT * FROM sw_m_project WHERE 1 = 1 ";
  let param = [];
  if (validateUtil.isVal(projectId)) {
    sql = sql + "AND project_id = $1 ";
    param.push(projectId);
  }
  if (validateUtil.isVal(projectName)) {
    sql = sql + "AND project_name LIKE $2 ";
    param.push('%' + projectName + '%');
  }

  let projects = await db.query(sql, param);
  if (!projects.rows || projects.rows.length == 0) {
    // プロジェクトが存在しない場合、エラー
    return res.status(500).send( { message: 'プロジェクトが存在しません。' } );
  }
  res.send(projects.rows);
});

/**
 * プロジェクト情報取得API.<br/>
 * GET(http://localhost:3000/api/v1/project)
 */
router.get('/', async function(req, res, next) {

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);

  // パラメータ取得
  let params = req.query;
  // プロジェクトID
  let projectId = params.projectId;
  validateUtil.validate400(res, projectId, "プロジェクトID", "projectId");

  // TODO: ユーザが見える範囲のみ返却

  // プロジェクト検索
  let projects = await db.query("SELECT * FROM sw_m_project WHERE project_id = $1 ", [projectId]);
  validateUtil.queryValidate500(res, projects, "プロジェクト");

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
 * POST(http://localhost:3000/api/v1/project)
 */
router.post('/', async function(req, res, next) {
  console.log('POST:v1/project execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);

  // パラメータから登録情報を取得
  let params = req.body;
  // プロジェクトID
  let projectId = params.projectId;
  validateUtil.validate400(res, projectId, "プロジェクトID", "projectId");
  // プロジェクト名
  let projectName = params.projectName;
  validateUtil.validate400(res, projectName, "プロジェクト名", "projectName");
  // コンテンツ
  let content = params.content;
  // 機能名
  let functionName = params.functionName;
  validateUtil.validate400(res, functionName, "機能名", "functionName");

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
 * DELETE(http://localhost:3000/api/v1/project)
 */
router.delete('/', async function(req, res, next) {
  console.log('DELETE:v1/project execution');

  // パラメータ取得
  let projectId = req.body.projectId;
  validateUtil.validate400(res, projectId, "プロジェクトID", "projectId");

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
 * POST(http://localhost:3000/api/v1/project/users)
 */
router.post('/users', async function(req, res, next) {
  console.log('POST:v1/project/users execution');
  // tokenからuserIdを取得
  let insertUserId = await tokenUtil.getUserId(req, res);

  // パラメータから登録情報を取得
  let params = req.body;
  let projectId = params.projectId;
  validateUtil.validate400(res, projectId, "プロジェクトID", "projectId");

  // プロジェクトの存在チェック
  if (! await projectUtil.isProjectId(res, projectId)) {
    return res.status(500).send({message : "プロジェクトIDが存在しません。(projectId:" + projectId + ")"});
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
