/**
 * デザインドキュメントAPI.<br/>
 * 
 * フォルダ一覧取得API
 * GET(http://localhost:3000/api/v1/design_docments/folder/list)
 * フォルダ新規作成API
 * POST(http://localhost:3000/api/v1/design_docments/folder)
 * フォルダ更新API(名前or順序更新)
 * PATCH(http://localhost:3000/api/v1/design_docments/folder)
 * フォルダ削除API
 * DELETE(http://localhost:3000/api/v1/design_docments/folder)
 * ドキュメント一覧取得API
 * GET(http://localhost:3000/api/v1/design_docments/docment/list)
 * ドキュメント詳細取得API
 * GET(http://localhost:3000/api/v1/design_docments/docment)
 * ドキュメント新規作成API
 * POST(http://localhost:3000/api/v1/design_docments/docment)
 * ドキュメント更新API(順序or名前orコンテンツ更新)
 * PATCH(http://localhost:3000/api/v1/design_docments/docment)
 * ドキュメント削除API
 * DELETE(http://localhost:3000/api/v1/design_docments/docment)
 */
var express = require('express');
var router = express.Router();

// DBアクセス
const db = require('../../db');

// util
const tokenUtil = require('../../app/util/tokenUtil.js');
const userUtil = require('../../app/util/userUtil.js');
const teamUtil = require('../../app/util/teamUtil.js');
const projectUtil = require('../../app/util/projectUtil.js');
const docmentUtil = require('../../app/util/docmentUtil.js');
const generatUtil = require('../../app/util/generatUtil.js');
const validateUtil = require('../../app/util/validateUtil.js');

/**
 * フォルダ一覧取得API
 * 並び順:フォルダ.順序 昇順
 * GET(http://localhost:3000/api/v1/design_docments/folder/list)
 */
router.get('/folder/list', async function(req, res, next) {
  console.log('GET:v1/design_docments/folder/list execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req);

  // パラメータ取得
  let params = req.query;
  // チームID
  let teamId = params.teamId;
  validateUtil.validate400(res, teamId, "チームID", "teamId");
  // プロジェクトID
  let projectId = params.projectId;
  validateUtil.validate400(res, projectId, "プロジェクトID", "projectId");
  // プロジェクト所属チェック
  if (! await projectUtil.isProjectMember(res, projectId, userId)) {
    return res.status(500).send( { message: 'プロジェクトに所属していません。' } );
  }

  // フォルダリスト取得SQL
  let sql = `
    SELECT * 
    FROM sw_t_docment_folder 
    WHERE team_id = $1
    AND project_id = $2 
    ORDER BY order_no
  `;
  // 検索
  let folders = await db.query(sql, [teamId, projectId]);
  if (!folders.rows || folders.rows.length == 0) {
    // フォルダが存在しない場合、エラー
    return res.status(500).send( { message: 'フォルダが存在しません。' } );
  }
  // 検索結果
  let result = [];
  folders.rows.forEach(function(row) {
    result.push({
      "teamId" : row.team_id
      , "projectId" : row.project_id
      , "folderId" : row.folder_id
      , "folderName" : row.folder_name
      , "order" : row.order_no
      , "create_user" : row.createUser
      , "create_function" : row.createFunction
      , "create_datetime" : row.createDatetime
    });
  });
  res.send(result);
});

/**
 * ドキュメント一覧取得API
 * 並び順:ドキュメント.順序 昇順
 * GET(http://localhost:3000/api/v1/design_docments/docment/list)
 */
router.get('/docment/list', async function(req, res, next) {
  console.log('GET:v1/design_docments/docment/list execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req);

  // パラメータ取得
  let params = req.query;
  // チームID
  let teamId = params.teamId;
  validateUtil.validate400(res, teamId, "チームID", "teamId");
  // プロジェクトID
  let projectId = params.projectId;
  validateUtil.validate400(res, projectId, "プロジェクトID", "projectId");
  // プロジェクト所属チェック
  if (! await projectUtil.isProjectMember(res, projectId, userId)) {
    return res.status(500).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
  }
  // フォルダID
  let folderId = params.folderId;
  validateUtil.validate400(res, folderId, "フォルダID", "folderId");

  // ドキュメントリスト取得SQL
  let sql = `
    SELECT 
    std.team_id
    , std.project_id
    , std.folder_id
    , std.docment_id
    , std.order_no
    , ver.version
    , stdc.docment_name
    , stdc.content
    , stdc.create_user
    , stdc.create_function
    , stdc.create_datetime
    FROM sw_t_docment std 
    INNER JOIN ( 
      SELECT docment_id, MAX(version) AS version 
      FROM sw_t_docment_content 
      GROUP BY docment_id 
      ) AS ver 
    ON std.docment_id = ver.docment_id 
    LEFT JOIN sw_t_docment_content stdc 
    ON ver.docment_id = stdc.docment_id 
    and ver.version = stdc.version 
    WHERE std.team_id = $1 
    AND std.project_id = $2 
    AND std.folder_id = $3 
    ORDER BY std.order_no
  `;
  let param = [teamId, projectId, folderId];

  let docments = await db.query(sql, param);
  if (!docments.rows || docments.rows.length == 0) {
    // ドキュメントが存在しない場合、エラー
    return res.status(500).send( { message: 'ドキュメントが存在しません。' } );
  }

  console.log(docments.rows)
  // 検索結果
  let result = [];
  docments.rows.forEach(function(row) {
    result.push({
      "teamId" : row.team_id
      , "projectId" : row.project_id
      , "folderId" : row.folder_id
      , "docmentId" : row.docment_id
      , "order" : row.order_no
      , "version" : row.version
      , "docmentName" : row.docment_name
      , "content" : row.content
      , "createUser" : row.create_user
      , "createFunction" : row.create_function
      , "createDatetime" : row.create_datetime
    });
  });
  res.send(result);
});

/**
 * ドキュメント詳細取得API
 * GET(http://localhost:3000/api/v1/design_docments/docment)
 */
router.get('/docment', async function(req, res, next) {
  console.log('GET:v1/design_docments/docment execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req);

  // パラメータ取得
  let params = req.query;
  // ドキュメントID
  let docmentId = params.docmentId;
  validateUtil.validate400(res, docmentId, "ドキュメントID", "docmentId");

  // SQL
  let sql = `
    SELECT 
    std.docment_id
    , ver.version
    , stdc.docment_name
    , stdc.content
    , stdc.create_user
    , stdc.create_function
    , stdc.create_datetime
    FROM sw_t_docment std 
    INNER JOIN ( 
      SELECT docment_id, MAX(version) AS version 
      FROM sw_t_docment_content 
      WHERE docment_id = $1
      GROUP BY docment_id 
      ) AS ver 
    ON std.docment_id = ver.docment_id 
    LEFT JOIN sw_t_docment_content stdc 
    ON ver.docment_id = stdc.docment_id 
    and ver.version = stdc.version 
    WHERE std.docment_id = $1
  `;

  // ドキュメント検索
  let docment = await db.query(sql, [docmentId]);
  validateUtil.queryValidate500(res, docment, "ドキュメント");

  // 検索結果を返却
  res.send({
    "docmentId" : docment.rows[0].docment_id
    , "version" : docment.rows[0].version
    , "docmentName" : docment.rows[0].docment_name
    , "content" : docment.rows[0].content
    , "createUser" : docment.rows[0].create_user
    , "createFunction" : docment.rows[0].create_function
    , "createDatetime" : docment.rows[0].create_datetime
  });
});

/**
 * フォルダ新規作成API
 * POST(http://localhost:3000/api/v1/design_docments/folder)
 */
router.post('/folder', async function(req, res, next) {
  console.log('POST:v1/design_docments/folder execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req);

  // パラメータから登録情報を取得
  let params = req.body;
  // チームID
  let teamId = params.teamId;
  validateUtil.validate400(res, teamId, "チームID", "teamId");
  // チームIDのマスタチェック
  if (! await teamUtil.isTeamId(res, teamId)) {
    return res.status(500).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
  }
  // プロジェクトID
  let projectId = params.projectId;
  validateUtil.validate400(res, projectId, "プロジェクトID", "projectId");
  // プロジェクトIDのマスタチェック
  if (! await projectUtil.isProjectId(res, projectId)) {
    return res.status(500).send({message : "プロジェクトIDが存在しません。(projectId:" + projectId + ")"});
  }
  // プロジェクト所属チェック
  if (! await projectUtil.isProjectMember(res, projectId, userId)) {
    return res.status(500).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
  }
  // フォルダ名
  let folderName = params.folderName;
  validateUtil.validate400(res, folderName, "フォルダ名", "folderName");
  // 機能名
  let functionName = params.functionName;
  validateUtil.validate400(res, functionName, "機能名", "functionName");

  // フォルダID生成
  let folderId = await generatUtil.getDesignDocmentFolderId();
  // 順序
  let orderNo = '0';
  // 登録日時
  let insertDate = new Date();

  // フォルダ登録SQL
  let insertFolderSql = `
  INSERT INTO sw_t_docment_folder 
  (team_id, project_id, folder_id, folder_name, order_no
    , create_user, create_function, create_datetime, update_user, update_function, update_datetime) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

  // フォルダ登録
  let newFolder = await db.query(
    insertFolderSql
    , [teamId, projectId, folderId, folderName, orderNo, userId, functionName, insertDate, userId, functionName, insertDate]
  );
  if (newFolder.rowCount == 0) {
    return res.status(500).send({message : "フィルダ登録に失敗しました。(folderId:" + folderId + ")"});
  }

  // 登録情報を返却
  res.send({
    teamId : teamId,
    projectId : projectId,
    folderId : folderId,
    folderName : folderName,
    orderNo : orderNo,
    createUser : userId,
    createFunction : functionName,
    createDatetime : insertDate
  });
});

/**
 * ドキュメント新規作成API
 * POST(http://localhost:3000/api/v1/design_docments/docment)
 */
router.post('/docment', async function(req, res, next) {
  console.log('POST:v1/design_docments/docment execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req);

  // パラメータから登録情報を取得
  let params = req.body;
  // チームID
  let teamId = params.teamId;
  validateUtil.validate400(res, teamId, "チームID", "teamId");
  // チームIDのマスタチェック
  if (! await teamUtil.isTeamId(res, teamId)) {
    return res.status(500).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
  }
  // プロジェクトID
  let projectId = params.projectId;
  validateUtil.validate400(res, projectId, "プロジェクトID", "projectId");
  // プロジェクトIDのマスタチェック
  if (! await projectUtil.isProjectId(res, projectId)) {
    return res.status(500).send({message : "プロジェクトIDが存在しません。(projectId:" + projectId + ")"});
  }
  // プロジェクト所属チェック
  if (! await projectUtil.isProjectMember(res, projectId, userId)) {
    return res.status(500).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
  }
  // フォルダID
  let folderId = params.folderId;
  validateUtil.validate400(res, folderId, "フォルダID", "folderId");
  // フォルダIDのマスタチェック
  if (! await docmentUtil.isFolderId(res, folderId)) {
    return res.status(500).send({message : "フォルダIDが存在しません。(folderId:" + folderId + ")"});
  }
  // ドキュメント名
  let docmentName = params.docmentName;
  validateUtil.validate400(res, docmentName, "ドキュメント名", "docmentName");
  // コンテンツ
  let content = params.content;
  if (!content) {
    // 存在しない場合、空文字を設定
    content = "";
  }
  // 機能名
  let functionName = params.functionName;
  validateUtil.validate400(res, functionName, "機能名", "functionName");

  // ドキュメントID生成
  let docmentId = await generatUtil.getDesignDocmentDocmentId();
  // 順序
  let orderNo = '0';
  // 登録日時
  let insertDate = new Date();

  // ドキュメント登録SQL
  let docmentSql = `
  INSERT INTO sw_t_docment 
  (team_id, project_id, folder_id, docment_id, order_no
    , create_user, create_function, create_datetime, update_user, update_function, update_datetime) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

  // ドキュメント登録
  let newdocment = await db.query(
    docmentSql
    , [teamId, projectId, folderId, docmentId, orderNo, userId, functionName, insertDate, userId, functionName, insertDate]
  );
  if (newdocment.rowCount == 0) {
    return res.status(500).send({message : "ドキュメント登録に失敗しました。(docmentId:" + docmentId + ")"});
  }

  // バージョン(0)
  let version = '0';

  // コンテンツ登録SQL
  let contentSql = `
  INSERT INTO sw_t_docment_content 
  (docment_id, version, docment_name, content
    , create_user, create_function, create_datetime) 
  VALUES ($1, $2, $3, $4, $5, $6, $7)`;

  // コンテンツ登録
  let newContent = await db.query(
    contentSql
    , [docmentId, version, docmentName, content, userId, functionName, insertDate]
  );
  if (newContent.rowCount == 0) {
    return res.status(500).send({message : "ドキュメントコンテンツ登録に失敗しました。(docmentId:" + docmentId + ")"});
  }

  // 登録情報を返却
  res.send({
    message : "ドキュメントの登録に成功しました。"
    , teamId : teamId
    , projectId : projectId
    , folderId : folderId
    , docmentId : docmentId
    , orderNo : orderNo
    , version : version
    , docmentName : docmentName
    , content : content
    , createUser : userId
    , createFunction : functionName
    , createDatetime : insertDate
  });
});

/**
 * フォルダ削除API
 * フォルダの物理削除。
 * フォルダ配下にドキュメントがある場合はエラー。
 * DELETE(http://localhost:3000/api/v1/design_docments/folder)
 */
router.delete('/folder', async function(req, res, next) {
  console.log('DELETE:v1/design_docments/folder execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req);

  // パラメータから登録情報を取得
  let params = req.body;
  // チームID
  let teamId = params.teamId;
  validateUtil.validate400(res, teamId, "チームID", "teamId");
  // チームIDのマスタチェック
  if (! await teamUtil.isTeamId(res, teamId)) {
    return res.status(500).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
  }
  // プロジェクトID
  let projectId = params.projectId;
  validateUtil.validate400(res, projectId, "プロジェクトID", "projectId");
  // プロジェクトIDのマスタチェック
  if (! await projectUtil.isProjectId(res, projectId)) {
    return res.status(500).send({message : "プロジェクトIDが存在しません。(projectId:" + projectId + ")"});
  }
  // プロジェクト所属チェック
  if (! await projectUtil.isProjectMember(res, projectId, userId)) {
    return res.status(500).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
  }
  // フォルダID
  let folderId = params.folderId;
  validateUtil.validate400(res, folderId, "フォルダID", "folderId");
  // フォルダIDのマスタチェック
  if (! await docmentUtil.isFolderId(res, folderId)) {
    return res.status(500).send({message : "フォルダIDが存在しません。(folderId:" + folderId + ")"});
  }

  // フォルダIDの利用状態チェック
  let useFolderId = await db.query(
    `SELECT count(folder_id) 
     FROM sw_t_docment 
     WHERE team_id = $1 
     AND project_id = $2 
     AND folder_id = $3`
    , [teamId, projectId, folderId]
  );
  if (useFolderId != null && useFolderId.rows != null && useFolderId.rows[0].count > 0) {
    // ドキュメントで対象のフォルダIDが1件以上利用されている場合、エラー
    return res.status(500).send({message : "ドキュメントが利用中のため削除できません。"});
  }

  // フォルダ削除
  let delFolder = await db.query(
    `DELETE FROM sw_t_docment_folder 
     WHERE team_id = $1 
     AND project_id = $2 
     AND folder_id = $3`
     , [teamId, projectId, folderId]
  );
  if (delFolder.rowCount == 0) {
    return res.status(500).send({message : "フォルダ削除に失敗しました。(folderId:" + folderId + ")"});
  }

  res.send({
    message : "フォルダの削除に成功しました。"
    , teamId : teamId
    , projectId : projectId
    , folderId : folderId
  });
});

/**
 * ドキュメント削除API
 * ドキュメント、コンテンツの物理削除。
 * DELETE(http://localhost:3000/api/v1/design_docments/docment)
 */
router.delete('/docment', async function(req, res, next) {
  console.log('DELETE:v1/design_docments/docment execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req);

  // パラメータから登録情報を取得
  let params = req.body;
  // チームID
  let teamId = params.teamId;
  validateUtil.validate400(res, teamId, "チームID", "teamId");
  // チームIDのマスタチェック
  if (! await teamUtil.isTeamId(res, teamId)) {
    return res.status(500).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
  }
  // プロジェクトID
  let projectId = params.projectId;
  validateUtil.validate400(res, projectId, "プロジェクトID", "projectId");
  // プロジェクトIDのマスタチェック
  if (! await projectUtil.isProjectId(res, projectId)) {
    return res.status(500).send({message : "プロジェクトIDが存在しません。(projectId:" + projectId + ")"});
  }
  // プロジェクト所属チェック
  if (! await projectUtil.isProjectMember(res, projectId, userId)) {
    return res.status(500).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
  }
  // ドキュメントID
  let docmentId = params.docmentId;
  validateUtil.validate400(res, docmentId, "ドキュメントID", "docmentId");
  // ドキュメントIDのマスタチェック
  if (! await docmentUtil.isDocmentId(res, docmentId)) {
    return res.status(500).send({message : "ドキュメントIDが存在しません。(docmentId:" + docmentId + ")"});
  }

  // ドキュメント削除
  let delDocment = await db.query(
    `DELETE FROM sw_t_docment 
     WHERE team_id = $1 
     AND project_id = $2 
     AND docment_id = $3`
     , [teamId, projectId, docmentId]
  );
  if (delDocment.rowCount == 0) {
    return res.status(500).send({message : "ドキュメント削除に失敗しました。(docmentId:" + docmentId + ")"});
  }

  // コンテンツ全削除
  let delContents = await db.query(
    `DELETE FROM sw_t_docment_content 
     WHERE docment_id = $1`
     , [docmentId]
  );
  if (delContents.rowCount == 0) {
    return res.status(500).send({message : "コンテンツ削除に失敗しました。(docmentId:" + docmentId + ")"});
  }

  res.send({
    message : "ドキュメントの削除に成功しました。"
    , teamId : teamId
    , projectId : projectId
    , docmentId : docmentId
  });
});

/**
 * フォルダ更新API(名前or順序更新)
 * PATCH(http://localhost:3000/api/v1/design_docments/folder)
 */
router.patch('/folder', async function(req, res, next) {
  console.log('PATCH:v1/design_docments/folder execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req);

  // パラメータから登録情報を取得
  let params = req.body;
  // チームID
  let teamId = params.teamId;
  validateUtil.validate400(res, teamId, "チームID", "teamId");
  // チームIDのマスタチェック
  if (! await teamUtil.isTeamId(res, teamId)) {
    return res.status(500).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
  }
  // プロジェクトID
  let projectId = params.projectId;
  validateUtil.validate400(res, projectId, "プロジェクトID", "projectId");
  // プロジェクトIDのマスタチェック
  if (! await projectUtil.isProjectId(res, projectId)) {
    return res.status(500).send({message : "プロジェクトIDが存在しません。(projectId:" + projectId + ")"});
  }
  // プロジェクト所属チェック
  if (! await projectUtil.isProjectMember(res, projectId, userId)) {
    return res.status(500).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
  }
  // フォルダID
  let folderId = params.folderId;
  validateUtil.validate400(res, folderId, "フォルダID", "folderId");
  // プロジェクトIDのマスタチェック
  if (! await docmentUtil.isFolderId(res, folderId)) {
    return res.status(500).send({message : "フォルダIDが存在しません。(folderId:" + folderId + ")"});
  }
  // フォルダ名
  let folderName = params.folderName;
  // 順序
  let orderNo = params.order;
  // 機能名
  let functionName = params.functionName;
  validateUtil.validate400(res, functionName, "機能名", "functionName");

  // フォルダ検索
  let folder = await db.query(
    `SELECT * 
     FROM sw_t_docment_folder
     WHERE team_id = $1 
     AND project_id = $2 
     AND folder_id = $3 `
     , [teamId, projectId, folderId]
  );
  if (folder.rowCount == 0) {
    return res.status(500).send({message : "フィルダ取得に失敗しました。(folderId:" + folderId + ")"});
  }

  // 更新用フォルダ名
  let updateFolderName = folder.rows[0].folder_name;
  if (validateUtil.isVal(folderName)) {
    updateFolderName = folderName;
  }
  // 更新用順序
  let updateOrderNo = folder.rows[0].order_no;
  if (validateUtil.isVal(orderNo)) {
    updateOrderNo = orderNo;
  }
  // 更新日時
  let updateDate = new Date();

  // フォルダ更新SQL
  let updateFolderSql = `
    UPDATE sw_t_docment_folder 
    SET folder_name = $1 
    , order_no = $2 
    , update_user = $3 
    , update_function = $4 
    , update_datetime = $5 
    WHERE team_id = $6 
    AND project_id = $7 
    AND folder_id = $8 
  `;

  // フォルダ更新
  let updFolder = await db.query(
    updateFolderSql
    , [updateFolderName, updateOrderNo, userId, functionName, updateDate, teamId, projectId, folderId]
  );
  if (updFolder.rowCount == 0) {
    return res.status(500).send({message : "フィルダ更新に失敗しました。(folderId:" + folderId + ")"});
  }

  // 更新情報を返却
  res.send({
    teamId : teamId,
    projectId : projectId,
    folderId : folderId,
    folderName : updateFolderName,
    orderNo : updateOrderNo,
    updateUser : userId,
    updateFunction : functionName,
    updateDatetime : updateDate
  });
});

/*
 * ドキュメント更新API(順序or名前orコンテンツ更新)
 * ドキュメント名、コンテンツの変更は新しいバージョンでコンテンツを作成。
 * PATCH(http://localhost:3000/api/v1/design_docments/docment)
 */
router.patch('/docment', async function(req, res, next) {
  console.log('PATCH:v1/design_docments/docment execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req);

  // パラメータから登録情報を取得
  let params = req.body;
  // チームID
  let teamId = params.teamId;
  validateUtil.validate400(res, teamId, "チームID", "teamId");
  // チームIDのマスタチェック
  if (! await teamUtil.isTeamId(res, teamId)) {
    return res.status(500).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
  }
  // プロジェクトID
  let projectId = params.projectId;
  validateUtil.validate400(res, projectId, "プロジェクトID", "projectId");
  // プロジェクトIDのマスタチェック
  if (! await projectUtil.isProjectId(res, projectId)) {
    return res.status(500).send({message : "プロジェクトIDが存在しません。(projectId:" + projectId + ")"});
  }
  // プロジェクト所属チェック
  if (! await projectUtil.isProjectMember(res, projectId, userId)) {
    return res.status(500).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
  }
  // ドキュメントID
  let docmentId = params.docmentId;
  validateUtil.validate400(res, docmentId, "ドキュメントID", "docmentId");
  // ドキュメントIDのマスタチェック
  if (! await docmentUtil.isDocmentId(res, docmentId)) {
    return res.status(500).send({message : "ドキュメントIDが存在しません。(docmentId:" + docmentId + ")"});
  }
  // ドキュメント名
  let docmentName = params.docmentName;
  // コンテンツ
  let content = params.content;
  // 順序
  let orderNo = params.order;
  // 機能名
  let functionName = params.functionName;
  validateUtil.validate400(res, functionName, "機能名", "functionName");

  // ドキュメント情報を取得
  let docmentInfo = await db.query(
    `SELECT * 
     FROM sw_t_docment
     WHERE team_id = $1 
     AND project_id = $2 
     AND docment_id = $3 `
     , [teamId, projectId, docmentId]
  );
  if (docmentInfo.rowCount == 0) {
    return res.status(500).send({message : "ドキュメント取得に失敗しました。(docmentId:" + docmentId + ")"});
  }

  // 更新用順序
  let updateOrderNo = docmentInfo.rows[0].order_no;
  if (validateUtil.isVal(orderNo)) {
    updateOrderNo = orderNo;
  }
  // 更新日時
  let updateDate = new Date();

  // ドキュメント更新SQL
  let updateDocmentSql = `
    UPDATE sw_t_docment 
    SET order_no = $1 
    , update_user = $2 
    , update_function = $3 
    , update_datetime = $4 
    WHERE team_id = $5 
    AND project_id = $6 
    AND docment_id = $7 
  `;

  // ドキュメント更新
  let updDocment = await db.query(
    updateDocmentSql
    , [updateOrderNo, userId, functionName, updateDate, teamId, projectId, docmentId]
  );
  if (updDocment.rowCount == 0) {
    return res.status(500).send({message : "ドキュメント更新に失敗しました。(docmentId:" + docmentId + ")"});
  }

  // 最新のコンテンツ情報を取得
  let contentInfo = await db.query(
    `SELECT * 
    FROM sw_t_docment_content stdc 
    INNER JOIN (
      SELECT docment_id, MAX(version) AS version 
      FROM sw_t_docment_content
      WHERE docment_id = $1 
      GROUP BY docment_id
    ) ver
    ON stdc.docment_id = ver.docment_id 
    AND stdc.version = ver.version `
     , [docmentId]
  );
  if (contentInfo.rowCount == 0) {
    return res.status(500).send({message : "コンテンツ取得に失敗しました。(docmentId:" + docmentId + ")"});
  }

  // 更新用ドキュメント名
  let updateDocmentName = contentInfo.rows[0].docment_name;
  if (validateUtil.isVal(docmentName)) {
    updateDocmentName = docmentName;
  }
  // 更新用コンテンツ
  let updateContent = contentInfo.rows[0].content;
  if (validateUtil.isVal(content)) {
    updateContent = content;
  }
  // 更新用バージョン
  let updateVersion = contentInfo.rows[0].version + 1;

  // コンテンツ登録SQL
  let insertContentSql = `
  INSERT INTO sw_t_docment_content 
  (docment_id, version, docment_name, content
    , create_user, create_function, create_datetime) 
  VALUES ($1, $2, $3, $4, $5, $6, $7)`;

  // コンテンツ登録
  let newContent = await db.query(
    insertContentSql
    , [docmentId, updateVersion, updateDocmentName, updateContent, userId, functionName, updateDate]
  );
  if (newContent.rowCount == 0) {
    return res.status(500).send({message : "コンテンツ登録に失敗しました。(docmentId:" + docmentId + ")"});
  }

  // 更新情報を返却
  res.send({
    teamId : teamId,
    projectId : projectId,
    docmentId : docmentId,
    orderNo : updateOrderNo,
    version : updateVersion,
    docmentName : updateDocmentName,
    updateUser : userId,
    updateFunction : functionName,
    updateDatetime : updateDate
  });
});

module.exports = router;
