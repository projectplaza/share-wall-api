/**
 * プロジェクトAPI.<br/>
 * 
 * プロジェクト一覧取得API
 * GET(http://localhost:3000/api/v1/projects/list)
 * プロジェクト取得API
 * GET(http://localhost:3000/api/v1/projects)
 * プロジェクト登録API
 * POST(http://localhost:3000/api/v1/projects)
 * プロジェクトユーザ登録API
 * POST(http://localhost:3000/api/v1/projects/users)
 * プロジェクト更新API
 * PUT(http://localhost:3000/api/v1/projects)
 * プロジェクトユーザ更新API
 * PUT(http://localhost:3000/api/v1/projects/users)
 * プロジェクト削除API
 * DELETE(http://localhost:3000/api/v1/projects)
 */
var express = require('express');
var router = express.Router();

// DBアクセス
const db = require('../../db');

// util
const tokenUtil = require('../master/util/tokenUtil.js');
const userUtil = require('../master/util/userUtil.js');
const teamUtil = require('../master/util/teamUtil.js');
const projectUtil = require('../master/util/projectUtil.js');
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
  if (! validateUtil.isEmptyText(teamId, "チームID")) {
    return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
  }
  // チームの権限チェック
  if (! await teamUtil.hasMember(teamId, userId)) {
    return res.status(400).send({message : messageUtil.errMessage003("チームメンバー")}); 
  }
  // 終了フラグ
  let endFlag = params.endFlag;
  // 検索用終了フラグ
  let selectEndFlag = false;
  if (endFlag != undefined && endFlag != "" && endFlag == 1) {
    // 1の場合、終了
    selectEndFlag = true;
  } else {
    // 1以外の場合、進行中
    endFlag = 0;
  }

  // プロジェクトの一覧を取得
  let projects = await db.query(
    `SELECT pj.team_id
          , pj.project_id
          , pj.project_name
          , pj."content"
       FROM sw_m_project pj
      INNER JOIN sw_m_project_member pjm
         ON pj.project_id = pjm.project_id
      WHERE pj.team_id = $1
        AND pj.end_flag = $2
        AND pjm.user_id = $3`
    , [teamId, selectEndFlag, userId]
  );
  if (!projects.rows || projects.rows.length == 0) {
    // プロジェクトが存在しない場合、空のリストを返却
    return res.send([]);
  }

  let resProjects = [];
  projects.rows.forEach( function(row) {
    resProjects.push({
      teamId : row.team_id,
      projectId : row.project_id,
      projectName : row.project_name,
      content : row.content,
      endFlag : endFlag
    })
  });
  res.send(resProjects);
});

/**
 * プロジェクト取得API.<br/>
 * GET(http://localhost:3000/api/v1/projects)
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
  // プロジェクトID
  let projectId = params.projectId;
  if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
  }
  // プロジェクトの権限チェック
  if (! await projectUtil.hasAdmin(teamId, projectId, userId)) {
    return res.status(400).send({message : messageUtil.errMessage003("プロジェクト管理者")}); 
  }

  // プロジェクト検索
  let projects = await db.query(
    `SELECT * 
       FROM sw_m_project 
      WHERE team_id = $1
        AND project_id = $2`
    , [teamId, projectId]
  );
  if (! validateUtil.isQueryResult(projects, "プロジェクト")) {
    return res.status(400).send({message : messageUtil.errMessage002("プロジェクト")});
  }

  projects.rows.map(async function(project) {

    // メンバー取得
    let resultMembers = await findMember(teamId, projectId);

    // 終了フラグ
    let endFlag = 0;
    if (project.end_flag) {
      endFlag = 1;
    }
    // プロジェクト情報を返却
    res.send( {
      projectId : project.project_id,
      projectName : project.project_name,
      content : project.content,
      endFlag : endFlag,
      members : resultMembers
    });
  })
});
/**
 * メンバー情報取得処理
 * @param {*} teamId 
 * @param {*} projectId 
 */
async function findMember(teamId, projectId) {
  console.log('project - findMember()');

  // メンバー検索
  let members = await db.query(
    `SELECT * 
       FROM sw_m_project_member AS mtm
      INNER JOIN sw_m_user AS mu
         ON mtm.user_id = mu.user_id
      WHERE mtm.team_id = $1
        AND mtm.project_id = $2`
    , [teamId, projectId]
  );
  if (! validateUtil.isQueryResult(members, "プロジェクトメンバー")) {
      // 検索結果が存在しない場合、空のリストを設定
      return [];
  } else {
      // メンバー情報を設定
      let resultMemberss = [];
      members.rows.forEach(async function(row) {
        // 管理者権限
        let administrator = 0;
        if (row.administrator_authority) {
          administrator = 1;
        }
        resultMemberss.push({
              "userId" : row.user_id
              , "userName" : row.user_name
              , "administrator" : administrator
          });
      });
      return resultMemberss;
  }
  
};

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
  // チームID
  let teamId = params.teamId;
  if (! validateUtil.isEmptyText(teamId, "チームID")) {
    return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
  }
  // チームの権限チェック
  if (! await teamUtil.hasMember(teamId, userId)) {
    return res.status(400).send({message : messageUtil.errMessage003("チームメンバー")}); 
  }

  // プロジェクトID
  let projectId = params.projectId;
  if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
  }
  // プロジェクトIDの利用可能チェック
  if (await projectUtil.isProjectId(projectId)) {
    return res.status(400).send({message : "登録済みのプロジェクトIDです。(projectId:" + projectId + ")"});
  }
  // プロジェクト名
  let projectName = params.projectName;
  if (! validateUtil.isEmptyText(projectName, "プロジェクト名")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクト名", "projectName")});
  }
  // コンテンツ
  let content = params.content;
  // 公開フラグ
  let openFlag = params.openFlag;
  // 終了フラグ
  let endFlag = params.endFlag;
  // 機能名
  let functionName = params.functionName;
  if (! validateUtil.isEmptyText(functionName, "機能名")) {
    return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
  }

  // 登録用公開フラグ
  let selectOpenFlag = false;
  if (openFlag != undefined && openFlag != "" && openFlag == 1) {
    // 1の場合、公開
    selectOpenFlag = true;
  } else {
    // 1以外の場合、非公開
    openFlag = 0;
  }
  // 登録用終了フラグ
  let selectEndFlag = false;
  if (endFlag != undefined && endFlag != "" && endFlag == 1) {
    // 1の場合、終了
    selectEndFlag = true;
  } else {
    // 1以外の場合、進行中
    endFlag = 0;
  }
  // 登録日時
  let insertDate = new Date();

  // プロジェクト登録
  let newProjects = await db.query(
    `INSERT INTO sw_m_project (
      team_id
      , project_id
      , project_name
      , content
      , open_flag
      , end_flag
      , create_user
      , create_function
      , create_datetime
      , update_user
      , update_function
      , update_datetime) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`
    , [
      teamId
      , projectId
      , projectName
      , content
      , selectOpenFlag
      , selectEndFlag
      , userId
      , functionName
      , insertDate
      , userId
      , functionName
      , insertDate]);

  // 登録情報を返却
  res.send({
    message : "プロジェクトの登録に成功しました。",
    teamId : teamId,
    projectId : projectId,
    projectName : projectName,
    content : content,
    openFlag : openFlag,
    endFlag : endFlag,
    createUser : userId,
    createFunction : functionName,
    createDatetime : insertDate,
    updateUser : userId,
    updateFunction : functionName,
    updateDatetime : insertDate
  });
});

/**
 * プロジェクト更新API.<br/>
 * PUT(http://localhost:3000/api/v2/projects)
 */
router.put('/', async function(req, res, next) {
  console.log('PUT:v1/projects execution');

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
  if (! await projectUtil.hasAdmin(teamId, projectId, userId)) {
    return res.status(400).send({message : messageUtil.errMessage003("プロジェクト管理者")}); 
  }

  // プロジェクト名
  let projectName = params.projectName;
  // コンテンツ
  let content = params.content;
  // 公開フラグ
  let openFlag = params.openFlag;
  // 終了フラグ
  let endFlag = params.endFlag;
  // 機能名
  let functionName = params.functionName;
  if (! validateUtil.isEmptyText(functionName, "機能名")) {
    return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
  }

  // プロジェクト検索
  let project = await db.query(
    `SELECT * 
     FROM sw_m_project
     WHERE team_id = $1
       AND project_id = $2`
     , [teamId, projectId]
  );
  if (project.rowCount == 0) {
    return res.status(500).send({message : "プロジェクト取得に失敗しました。(teamId:" + teamId + "projectId:" + projectId + ")"});
  }

  // 更新用プロジェクト名
  let updateProjectName = project.rows[0].project_name;
  if (validateUtil.isEmptyText(projectName, "プロジェクト名")) {
    updateProjectName = projectName;
  }
  // 更新用コンテンツ
  let updateContent = project.rows[0].content;
  if (validateUtil.isEmptyText(content, "内容")) {
    updateContent = content;
  }
  // 更新用公開フラグ
  let updateOpenFlag = false;
  if (openFlag != undefined && openFlag != "" && openFlag == 1) {
    // 1の場合、公開
    updateOpenFlag = true;
  } else {
    openFlag = 0;
  }
  // 更新用終了フラグ
  let updateEndFlag = false;
  if (endFlag != undefined && endFlag != "" && endFlag == 1) {
    // 1の場合、終了
    updateEndFlag = true;
  } else {
    // 1以外の場合、進行中
    endFlag = 0;
  }
  // 更新日時
  let updateDate = new Date();

  // プロジェクト更新
  let updProject = await db.query(
    `UPDATE sw_m_project
        SET project_name = $1 
          , content = $2 
          , open_flag = $3
          , end_flag = $4
          , update_user = $5 
          , update_function = $6 
          , update_datetime = $7 
      WHERE team_id = $8
        AND project_id = $9`
    , [ updateProjectName
      , updateContent
      , updateOpenFlag
      , updateEndFlag
      , userId
      , functionName
      , updateDate
      , teamId
      , projectId]
  );
  if (updProject.rowCount == 0) {
    return res.status(500).send({message : "プロジェクト更新に失敗しました。(teamId:" + teamId + "projectId:" + projectId + ")"});
  }

  // 更新情報を返却
  res.send({
    message : "プロジェクトの更新に成功しました。",
    teamId : teamId,
    projectId : projectId,
    projectName : updateProjectName,
    content : updateContent,
    openFlag : openFlag,
    endFlag : endFlag,
    updateUser : userId,
    updateFunction : functionName,
    updateDatetime : updateDate
  });
});

/**
 * プロジェクトユーザ更新API.<br/>
 * PUT(http://localhost:3000/api/v2/projects/users)
 */
router.put('/users', async function(req, res, next) {
  console.log('PUT:v1/projects/users execution');

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
  if (! await projectUtil.hasAdmin(teamId, projectId, userId)) {
    return res.status(400).send({message : messageUtil.errMessage003("プロジェクト管理者")});
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
      if (! await userUtil.isUserId(userId)) {
        return res.status(400).send({message : "存在しないユーザIDです。(userId:" + userId + ")"});
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

      // プロジェクト更新
      let updProjectMember = await db.query(
        `UPDATE sw_m_project_member 
            SET administrator_authority = $1 
              , update_user = $2 
              , update_function = $3 
              , update_datetime = $4 
          WHERE project_id = $5
            AND user_id = $6`
        , [
          administratorAuthority
          , userId
          , functionName
          , updateDate
          , projectId
          , targetUserId
        ]
      );
      if (updProjectMember.rowCount == 0) {
        return res.status(500).send({message : "プロジェクトメンバーの更新に失敗しました。(teamId:" + teamId + ", projectId:" + projectId + ", userId:" + targetUserId + ")"});
      }

      resultUsers.push({
        'userId' : targetUserId,
        'administrator' : administrator
      });
    })
  );

  // 更新情報を返却
  res.send({
    message : "プロジェクトメンバーの更新に成功しました。",
    teamId : teamId,
    projectId : projectId,
    users : resultUsers,
    updateUser : userId,
    updateFunction : functionName,
    updateDatetime : updateDate
  });
});

/**
 * プロジェクト削除API.<br/>
 * 論理削除。<br/>
 * DELETE(http://localhost:3000/api/v1/projects)
 */
router.delete('/', async function(req, res, next) {
  console.log('DELETE:v1/projects execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);

  // パラメータ取得
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
  // 管理者チェック
  if (! await projectUtil.hasAdmin(teamId, projectId, userId)) {
    return res.status(400).send({message : messageUtil.errMessage003("プロジェクト管理者")});
  }

  // プロジェクト削除
  let projectResult = await db.query(
    'DELETE FROM sw_m_project WHERE project_id = $1'
    , [projectId]);
  if (projectResult.rowCount <= 0) {
    return res.status(500).send({message : "プロジェクトの削除に失敗しました。(teamId:" + teamId + ", projectId:" + projectId + ")"});
  }  

  // プロジェクトメンバー削除
  let memberResult = await db.query(
    'DELETE FROM sw_m_project_member WHERE project_id = $1'
    , [projectId]);
  if (memberResult.rowCount <= 0) {
    return res.status(500).send({message : "プロジェクトメンバーの削除に失敗しました。(teamId:" + teamId + ", projectId:" + projectId + ")"});
  }  

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
  let userId = await tokenUtil.getUserId(req, res);

  // パラメータから登録情報を取得
  let params = req.body;
  // チームID
  let teamId = params.teamId;
  if (! validateUtil.isEmptyText(teamId, "チームID")) {
    return res.status(400).send({message : messageUtil.errMessage001("チームID", "teamId")});
  }
  // チームの権限チェック
  if (! await teamUtil.hasMember(teamId, userId)) {
    return res.status(400).send({message : messageUtil.errMessage003("チームメンバー")}); 
  }

  // プロジェクトID
  let projectId = params.projectId;
  if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
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
  let insertDate = new Date();

  let resultUsers = [];
  await Promise.all(
    users.map(async function(user) {
      // ユーザID
      let targetUserId = user.userId;
      if (! validateUtil.isEmptyText(targetUserId, "ユーザID")) {
        return res.status(400).send({message : messageUtil.errMessage001("ユーザID", "userId")});
      }
      // ユーザの存在チェック
      if (! await userUtil.isUserId(targetUserId)) {
        return res.status(400).send({message : "存在しないユーザIDです。(userId:" + targetUserId + ")"});
      }
      // ユーザの登録済みチェック
      if (await projectUtil.hasMember(teamId, projectId, targetUserId)) {
        return res.status(400).send({message : "登録済みのユーザIDです。(userId:" + targetUserId + ")"});
      }
      // 管理者権限
      let administrator = user.administrator;

      // 登録処理
      let insertResult = await insertProjectMember(
        teamId
        , projectId
        , targetUserId
        , administrator
        , userId
        , functionName
        , insertDate);
        if (insertResult == null) {
          return res.status(500).send({message : "プロジェクトメンバーの登録に失敗しました。(teamId:" + teamId + ", projectId:" + projectId + ", userId:" + targetUserId + ")"});
        }  

      resultUsers.push(insertResult);
    })
  );
  // 登録情報を返却
  res.send({
    message : "プロジェクトメンバーの登録に成功しました。",
    teamId : teamId,
    projectId : projectId,
    users : resultUsers,
    createUser : userId,
    createFunction : functionName,
    createDatetime : insertDate
  });
});

/**
 * プロジェクトメンバの登録処理
 * @param {*} teamId チームID
 * @param {*} projectId プロジェクトID
 * @param {*} userId ユーザID
 * @param {*} administrator 管理者
 * @param {*} insertUserId 登録ユーザID
 * @param {*} functionName 登録機能名
 * @param {*} insertDate 登録日時
 */
async function insertProjectMember(teamId, projectId, userId, administrator, insertUserId, functionName, insertDate) {
  console.log('project - insertProjectMember()');

  // 管理者
  let administratorAuthority = false;
  if (administrator != undefined && administrator != "" && administrator == 1) {
    // 1の場合、管理者
    administratorAuthority = true;
    administrator = 1;
  } else {
    administrator = 0;
  }

  // プロジェクト メンバー登録
  let result = await db.query(
    `INSERT INTO sw_m_project_member (
      team_id
      , project_id
      , user_id
      , administrator_authority
      , create_user
      , create_function
      , create_datetime
      , update_user
      , update_function
      , update_datetime)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
    , [
      teamId
      , projectId
      , userId
      , administratorAuthority
      , insertUserId
      , functionName
      , insertDate
      , insertUserId
      , functionName
      , insertDate
    ]
  );
  if (result == null || result.rowCount == 0) {
    // 存在しない場合、nullを返却
    return null;
  }

  return {
    userId : userId,
    administrator : administrator
  };
}

module.exports = router;
