/**
 * デザインドキュメントAPI.<br/>
 * 
 * フォルダ&ドキュメント一覧取得API
 * GET(http://localhost:3000/api/v1/design_documents/folder/document/list)
 * フォルダ一覧取得API
 * GET(http://localhost:3000/api/v1/design_documents/folder/list)
 * フォルダ新規作成API
 * POST(http://localhost:3000/api/v1/design_documents/folder)
 * フォルダ更新API(名前or順序更新)
 * PUT(http://localhost:3000/api/v1/design_documents/folder)
 * フォルダ削除API
 * DELETE(http://localhost:3000/api/v1/design_documents/folder)
 * ドキュメント一覧取得API
 * GET(http://localhost:3000/api/v1/design_documents/document/list)
 * ドキュメント詳細取得API
 * GET(http://localhost:3000/api/v1/design_documents/document)
 * ドキュメント新規作成API
 * POST(http://localhost:3000/api/v1/design_documents/document)
 * ドキュメント更新API(順序or名前orコンテンツ更新)
 * PUT(http://localhost:3000/api/v1/design_documents/document)
 * ドキュメント削除API
 * DELETE(http://localhost:3000/api/v1/design_documents/document)
 */
var express = require('express');
var router = express.Router();

// DBアクセス
const db = require('../../db');

// util
const tokenUtil = require('../../app/util/main/tokenUtil.js');
const teamUtil = require('../../app/util/main/teamUtil.js');
const projectUtil = require('../../app/util/main/projectUtil.js');
const documentUtil = require('./documentUtil.js');
const generatUtil = require('../../app/util/generatUtil.js');
const validateUtil = require('../../app/util/validateUtil.js');
const messageUtil = require('../../app/util/messageUtil.js');

/**
 * フォルダ&ドキュメント一覧取得API
 * 並び順:フォルダ.順序, ドキュメント.順序 昇順
 * GET(http://localhost:3000/api/v1/design_documents/folder/document/list)
 */
router.get('/folder/document/list', async function(req, res, next) {
  console.log('GET:v1/design_documents/folder/document/list execution');

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
    return res.status(400).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
  }

  // フォルダ一覧を取得
  let folders = await findFolders(teamId, projectId);
  if (folders.rows) {
    // 検索結果が存在しない場合、空のリストを返却
    return res.send([]);
  }

  // フォルダ一覧にドキュメント情報を追記して返却
  await Promise.all(
    // mapの結果的は配列
    // asyncを付けてPromiseとして返却
    folders.map(async function(folder) {

      // ドキュメント一覧を取得
      let documents = await findDocuments(teamId, projectId, folder.folderId);
      return {
        "folderId" : folder.folderId
        , "folderName" : folder.folderName
        , "document" : documents
        , "folderOrder" : folder.folderOrder
      };
    })
  ).then( function(result) {
    // 検索結果
    res.send(result);
  });
});

/**
 * フォルダ一覧取得
 * @param teamId
 * @param projectId
 */
async function findFolders(teamId, projectId) {
  console.log('document - findFolders()');

  // フォルダ検索
  let folders = await db.query(
    `SELECT folder_id
          , folder_name
          , order_no
       FROM sw_t_document_folder
      WHERE team_id = $1
        AND project_id = $2
      ORDER BY order_no`,
    [teamId, projectId]
  );
  if (!folders.rows || folders.rows.length == 0) {
    // フォルダが存在しない場合、空のリストを返却
    return [];
  } else {
    // フォルダが存在する場合
    // 検索結果を加工
    let result = [];
    folders.rows.forEach(async function(row) {
      result.push({
        "folderId" : row.folder_id
        , "folderName" : row.folder_name
        , "folderOrder" : row.order_no
      });
    });
    // フォルダ情報を返却
    return result;
  }
};

/**
 * ドキュメント一覧取得
 * @param teamId
 * @param projectId
 * @param folderId
 */
async function findDocuments(teamId, projectId, folderId) {
  console.log('document - findDocuments()');

  // ドキュメント検索
  let documents = await db.query(
    `SELECT std.document_id
          , stdc.document_name
          , std.order_no
       FROM sw_t_document std 
      INNER JOIN ( 
            SELECT document_id
                 , MAX(version) AS version 
              FROM sw_t_document_content 
             GROUP BY document_id 
            ) AS ver 
         ON std.document_id = ver.document_id 
       LEFT JOIN sw_t_document_content stdc 
         ON ver.document_id = stdc.document_id 
        AND ver.version = stdc.version 
      WHERE std.team_id = $1 
        AND std.project_id = $2 
        AND std.folder_id = $3 
      ORDER BY std.order_no`
    , [teamId, projectId, folderId]
  );
  if (!documents.rows || documents.rows.length == 0) {
    // ドキュメントが存在しない場合、空のリストを返却
    return [];
  } else {
    // ドキュメントが存在する場合
    // 検索結果を加工
    let result = [];
    documents.rows.forEach(function(row) {
      result.push({
        "documentId" : row.document_id
        , "documentName" : row.document_name
        , "documentOrder" : row.order_no
      });
    });
    // ドキュメント情報を返却
    return result;
  }
};

/**
 * フォルダ一覧取得API
 * 並び順:フォルダ.順序 昇順
 * GET(http://localhost:3000/api/v1/design_documents/folder/list)
 */
router.get('/folder/list', async function(req, res, next) {
  console.log('GET:v1/design_documents/folder/list execution');

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
  if (! await projectUtil.isProjectMember(res, projectId, userId)) {
    return res.status(500).send( { message: 'プロジェクトに所属していません。' } );
  }

  // フォルダリスト取得SQL
  let sql = `
    SELECT * 
    FROM sw_t_document_folder 
    WHERE team_id = $1
    AND project_id = $2 
    ORDER BY order_no
  `;
  // 検索
  let folders = await db.query(sql, [teamId, projectId]);
  if (!folders.rows || folders.rows.length == 0) {
    // フォルダが存在しない場合、空のリストを返却
    return res.send([]);
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
 * GET(http://localhost:3000/api/v1/design_documents/document/list)
 */
router.get('/document/list', async function(req, res, next) {
  console.log('GET:v1/design_documents/document/list execution');

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
  if (! await projectUtil.isProjectMember(res, projectId, userId)) {
    return res.status(500).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
  }
  // フォルダID
  let folderId = params.folderId;
  if (! validateUtil.isEmptyText(folderId, "フォルダID")) {
    return res.status(400).send({message : messageUtil.errMessage001("フォルダID", "folderId")});
  }

  // ドキュメントリスト取得SQL
  let sql = `
    SELECT 
    std.team_id
    , std.project_id
    , std.folder_id
    , std.document_id
    , std.order_no
    , ver.version
    , stdc.document_name
    , stdc.content
    , stdc.create_user
    , stdc.create_function
    , stdc.create_datetime
    FROM sw_t_document std 
    INNER JOIN ( 
      SELECT document_id, MAX(version) AS version 
      FROM sw_t_document_content 
      GROUP BY document_id 
      ) AS ver 
    ON std.document_id = ver.document_id 
    LEFT JOIN sw_t_document_content stdc 
    ON ver.document_id = stdc.document_id 
    and ver.version = stdc.version 
    WHERE std.team_id = $1 
    AND std.project_id = $2 
    AND std.folder_id = $3 
    ORDER BY std.order_no
  `;
  let param = [teamId, projectId, folderId];

  let documents = await db.query(sql, param);
  if (!documents.rows || documents.rows.length == 0) {
    // ドキュメントが存在しない場合、空のリストを返却
    return res.send([]);
  }

  console.log(documents.rows)
  // 検索結果
  let result = [];
  documents.rows.forEach(function(row) {
    result.push({
      "teamId" : row.team_id
      , "projectId" : row.project_id
      , "folderId" : row.folder_id
      , "documentId" : row.document_id
      , "order" : row.order_no
      , "version" : row.version
      , "documentName" : row.document_name
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
 * GET(http://localhost:3000/api/v1/design_documents/document)
 */
router.get('/document', async function(req, res, next) {
  console.log('GET:v1/design_documents/document execution');

  // tokenからuserIdを取得
  let userId = await tokenUtil.getUserId(req, res);

  // パラメータ取得
  let params = req.query;
  // ドキュメントID
  let documentId = params.documentId;
  if (! validateUtil.isEmptyText(documentId, "ドキュメントID")) {
    return res.status(400).send({message : messageUtil.errMessage001("ドキュメントID", "documentId")});
  }

  // SQL
  let sql = `
    SELECT 
    std.document_id
    , ver.version
    , stdc.document_name
    , stdc.content
    , stdc.create_user
    , stdc.create_function
    , stdc.create_datetime
    FROM sw_t_document std 
    INNER JOIN ( 
      SELECT document_id, MAX(version) AS version 
      FROM sw_t_document_content 
      WHERE document_id = $1
      GROUP BY document_id 
      ) AS ver 
    ON std.document_id = ver.document_id 
    LEFT JOIN sw_t_document_content stdc 
    ON ver.document_id = stdc.document_id 
    and ver.version = stdc.version 
    WHERE std.document_id = $1
  `;

  // ドキュメント検索
  let document = await db.query(sql, [documentId]);
  if (! validateUtil.isQueryResult(document, "ドキュメント")) {
    return res.status(400).send({message : messageUtil.errMessage002("ドキュメント")});
  }

  // 検索結果を返却
  res.send({
    "documentId" : document.rows[0].document_id
    , "version" : document.rows[0].version
    , "documentName" : document.rows[0].document_name
    , "content" : document.rows[0].content
    , "createUser" : document.rows[0].create_user
    , "createFunction" : document.rows[0].create_function
    , "createDatetime" : document.rows[0].create_datetime
  });
});

/**
 * フォルダ新規作成API
 * POST(http://localhost:3000/api/v1/design_documents/folder)
 */
router.post('/folder', async function(req, res, next) {
  console.log('POST:v1/design_documents/folder execution');

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
    return res.status(500).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
  }
  // プロジェクトID
  let projectId = params.projectId;
  if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
  }
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
  if (! validateUtil.isEmptyText(folderName, "フォルダ名")) {
    return res.status(400).send({message : messageUtil.errMessage001("フォルダ名", "folderName")});
  }
  // 機能名
  let functionName = params.functionName;
  if (! validateUtil.isEmptyText(functionName, "機能名")) {
    return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
  }

  // フォルダID生成
  let folderId = await generatUtil.getDesignDocumentFolderId();
  // 順序
  let orderNo = 0;
  // 登録日時
  let insertDate = new Date();

  // フォルダ登録SQL
  let insertFolderSql = `
  INSERT INTO sw_t_document_folder 
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
    message : "フォルダの登録に成功しました。",
    teamId : teamId,
    projectId : projectId,
    folderId : folderId,
    folderName : folderName,
    order : orderNo,
    createUser : userId,
    createFunction : functionName,
    createDatetime : insertDate
  });
});

/**
 * ドキュメント新規作成API
 * POST(http://localhost:3000/api/v1/design_documents/document)
 */
router.post('/document', async function(req, res, next) {
  console.log('POST:v1/design_documents/document execution');

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
    return res.status(500).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
  }
  // プロジェクトID
  let projectId = params.projectId;
  if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
  }
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
  if (! validateUtil.isEmptyText(folderId, "フォルダID")) {
    return res.status(400).send({message : messageUtil.errMessage001("フォルダID", "folderId")});
  }
  // フォルダIDのマスタチェック
  if (! await documentUtil.isFolderId(teamId, folderId)) {
    return res.status(500).send({message : "フォルダIDが存在しません。(folderId:" + folderId + ")"});
  }
  // ドキュメント名
  let documentName = params.documentName;
  if (! validateUtil.isEmptyText(documentName, "ドキュメント名")) {
    return res.status(400).send({message : messageUtil.errMessage001("ドキュメント名", "documentName")});
  }

  // コンテンツ
  let content = params.content;
  if (!content) {
    // 存在しない場合、空文字を設定
    content = "";
  }
  // 機能名
  let functionName = params.functionName;
  if (! validateUtil.isEmptyText(functionName, "機能名")) {
    return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
  }

  // ドキュメントID生成
  let documentId = await generatUtil.getDesignDocumentDocumentId(teamId);
  // 順序
  let orderNo = '0';
  // 登録日時
  let insertDate = new Date();

  // ドキュメント登録SQL
  let documentSql = `
  INSERT INTO sw_t_document 
  (team_id, project_id, folder_id, document_id, order_no
    , create_user, create_function, create_datetime, update_user, update_function, update_datetime) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`;

  // ドキュメント登録
  let newdocument = await db.query(
    documentSql
    , [teamId, projectId, folderId, documentId, orderNo, userId, functionName, insertDate, userId, functionName, insertDate]
  );
  if (newdocument.rowCount == 0) {
    return res.status(500).send({message : "ドキュメント登録に失敗しました。(documentId:" + documentId + ")"});
  }

  // バージョン(0)
  let version = 0;

  // コンテンツ登録SQL
  let contentSql = `
  INSERT INTO sw_t_document_content 
  (team_id, document_id, version, document_name, content
    , create_user, create_function, create_datetime) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`;

  // コンテンツ登録
  let newContent = await db.query(
    contentSql
    , [teamId, documentId, version, documentName, content, userId, functionName, insertDate]
  );
  if (newContent.rowCount == 0) {
    return res.status(500).send({message : "ドキュメントコンテンツ登録に失敗しました。(documentId:" + documentId + ")"});
  }

  // 登録情報を返却
  res.send({
    message : "ドキュメントの登録に成功しました。"
    , teamId : teamId
    , projectId : projectId
    , folderId : folderId
    , documentId : documentId
    , order : orderNo
    , version : version
    , documentName : documentName
    , content : content
    , createUser : userId
    , createFunction : functionName
    , createDatetime : insertDate
  });
});

/**
 * フォルダ削除API
 * フォルダの物理削除。
 * フォルダ配下にドキュメントがある場合はドキュメントも物理削除。
 * DELETE(http://localhost:3000/api/v1/design_documents/folder)
 */
router.delete('/folder', async function(req, res, next) {
  console.log('DELETE:v1/design_documents/folder execution');

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
    return res.status(500).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
  }
  // プロジェクトID
  let projectId = params.projectId;
  if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
  }
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
  if (! validateUtil.isEmptyText(folderId, "フォルダID")) {
    return res.status(400).send({message : messageUtil.errMessage001("フォルダID", "folderId")});
  }
  // フォルダIDのマスタチェック
  if (! await documentUtil.isFolderId(teamId, folderId)) {
    return res.status(500).send({message : "フォルダIDが存在しません。(folderId:" + folderId + ")"});
  }

  // フォルダIDの利用状態チェック
  let useFolderId = await db.query(
    `SELECT document_id 
       FROM sw_t_document 
      WHERE team_id = $1 
        AND project_id = $2 
        AND folder_id = $3`
    , [teamId, projectId, folderId]
  );
  if (useFolderId != null && useFolderId.rows != null && useFolderId.rowCount > 0) {
    // ドキュメントで対象のフォルダIDが1件以上利用されている場合、ドキュメントも削除

    await Promise.all(
      useFolderId.rows.map(async function(row) {
        // ドキュメント＆コンテンツ削除処理
        if (! await deleteDocument(teamId, projectId, row.document_id)) {
          res.status(500).send({message : "ドキュメント削除に失敗しました。(documentId:" + row.document_id + ")"});
        }
       })
    );
  }

  // フォルダ削除
  let delFolder = await db.query(
    `DELETE FROM sw_t_document_folder 
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
 * DELETE(http://localhost:3000/api/v1/design_documents/document)
 */
router.delete('/document', async function(req, res, next) {
  console.log('DELETE:v1/design_documents/document execution');

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
    return res.status(500).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
  }
  // プロジェクトID
  let projectId = params.projectId;
  if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
  }
  // プロジェクトIDのマスタチェック
  if (! await projectUtil.isProjectId(res, projectId)) {
    return res.status(500).send({message : "プロジェクトIDが存在しません。(projectId:" + projectId + ")"});
  }
  // プロジェクト所属チェック
  if (! await projectUtil.isProjectMember(res, projectId, userId)) {
    return res.status(500).send({message : "プロジェクトに所属していません。(projectId:" + projectId + ")"});
  }
  // ドキュメントID
  let documentId = params.documentId;
  if (! validateUtil.isEmptyText(documentId, "ドキュメントID")) {
    return res.status(400).send({message : messageUtil.errMessage001("ドキュメントID", "documentId")});
  }
  // ドキュメントIDのマスタチェック
  if (! await documentUtil.isDocumentId(teamId, documentId)) {
    return res.status(500).send({message : "ドキュメントIDが存在しません。(documentId:" + documentId + ")"});
  }

  // ドキュメント＆コンテンツ削除処理
  if (await deleteDocument(teamId, projectId, documentId)) {
    res.send({
      message : "ドキュメントの削除に成功しました。"
      , teamId : teamId
      , projectId : projectId
      , documentId : documentId
    });
  } else {
    res.status(500).send({
      message : "ドキュメント削除に失敗しました。(documentId:" + documentId + ")"
    });
  }
});

async function deleteDocument(teamId, projectId, documentId) {
  console.log('document - deleteDocument()');

  // ドキュメント削除
  let delDocument = await db.query(
    `DELETE FROM sw_t_document 
     WHERE team_id = $1 
     AND project_id = $2 
     AND document_id = $3`
     , [teamId, projectId, documentId]
  );
  if (delDocument.rowCount == 0) {
    return false;
    // return res.status(500).send({message : "ドキュメント削除に失敗しました。(documentId:" + documentId + ")"});
  }

  // コンテンツ全削除
  let delContents = await db.query(
    `DELETE FROM sw_t_document_content 
     WHERE team_id = $1
       AND document_id = $2`
     , [teamId, documentId]
  );
  if (delContents.rowCount == 0) {
    return false;
    // return res.status(500).send({message : "コンテンツ削除に失敗しました。(documentId:" + documentId + ")"});
  }

  return true;
}

/**
 * フォルダ更新API(名前or順序更新)
 * PUT(http://localhost:3000/api/v1/design_documents/folder)
 */
router.put('/folder', async function(req, res, next) {
  console.log('PUT:v1/design_documents/folder execution');

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
    return res.status(500).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
  }
  // プロジェクトID
  let projectId = params.projectId;
  if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
  }
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
  if (! validateUtil.isEmptyText(folderId, "フォルダID")) {
    return res.status(400).send({message : messageUtil.errMessage001("フォルダID", "folderId")});
  }
  // プロジェクトIDのマスタチェック
  if (! await documentUtil.isFolderId(teamId, folderId)) {
    return res.status(500).send({message : "フォルダIDが存在しません。(folderId:" + folderId + ")"});
  }
  // フォルダ名
  let folderName = params.folderName;
  // 順序
  let orderNo = params.order;
  // 機能名
  let functionName = params.functionName;
  if (! validateUtil.isEmptyText(functionName, "機能名")) {
    return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
  }

  // フォルダ検索
  let folder = await db.query(
    `SELECT * 
     FROM sw_t_document_folder
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
  if (validateUtil.isEmptyText(folderName, "フォルダ名")) {
    updateFolderName = folderName;
  }
  // 更新用順序
  let updateOrderNo = folder.rows[0].order_no;
  if (validateUtil.isEmptyText(orderNo, "順序")) {
    updateOrderNo = orderNo;
  }
  // 更新日時
  let updateDate = new Date();

  // フォルダ更新SQL
  let updateFolderSql = `
    UPDATE sw_t_document_folder 
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
    message : "フォルダの更新に成功しました。",
    teamId : teamId,
    projectId : projectId,
    folderId : folderId,
    folderName : updateFolderName,
    order : updateOrderNo,
    updateUser : userId,
    updateFunction : functionName,
    updateDatetime : updateDate
  });
});

/*
 * ドキュメント更新API(順序or名前orコンテンツ更新)
 * ドキュメント名、コンテンツの変更は新しいバージョンでコンテンツを作成。
 * PUT(http://localhost:3000/api/v1/design_documents/document)
 */
router.put('/document', async function(req, res, next) {
  console.log('PUT:v1/design_documents/document execution');

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
    return res.status(500).send({message : "チームIDが存在しません。(teamId:" + teamId + ")"});
  }
  // プロジェクトID
  let projectId = params.projectId;
  if (! validateUtil.isEmptyText(projectId, "プロジェクトID")) {
    return res.status(400).send({message : messageUtil.errMessage001("プロジェクトID", "projectId")});
  }
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
  if (! validateUtil.isEmptyText(folderId, "フォルダID")) {
    return res.status(400).send({message : messageUtil.errMessage001("フォルダID", "folderId")});
  }
  // ドキュメントID
  let documentId = params.documentId;
  if (! validateUtil.isEmptyText(documentId, "ドキュメントID")) {
    return res.status(400).send({message : messageUtil.errMessage001("ドキュメントID", "documentId")});
  }
  // ドキュメントIDのマスタチェック
  if (! await documentUtil.isDocumentId(teamId, documentId)) {
    return res.status(500).send({message : "ドキュメントIDが存在しません。(documentId:" + documentId + ")"});
  }
  // ドキュメント名
  let documentName = params.documentName;
  // コンテンツ
  let content = params.content;
  // 順序
  let orderNo = params.order;
  // 機能名
  let functionName = params.functionName;
  if (! validateUtil.isEmptyText(functionName, "機能名")) {
    return res.status(400).send({message : messageUtil.errMessage001("機能名", "functionName")});
  }

  // 順序を取得
  let serveOrderNo = await db.query(
    `SELECT order_no
       FROM sw_t_document
      WHERE team_id = $1
        AND project_id = $2
        AND document_id = $3`
     , [teamId, projectId, documentId]
  );
  if (serveOrderNo.rowCount == 0) {
    return res.status(500).send({message : "ドキュメント取得に失敗しました。(documentId:" + documentId + ")"});
  }
  // 更新用順序
  let updateOrderNo = serveOrderNo.rows[0].order_no;
  if (validateUtil.isEmptyText(orderNo, "順序")) {
    updateOrderNo = orderNo;
  }
  // 更新日時
  let updateDate = new Date();

  // ドキュメント更新
  let updDocument = await db.query(
    `UPDATE sw_t_document
        SET order_no = $1
          , folder_id = $2
          , update_user = $3
          , update_function = $4
          , update_datetime = $5
      WHERE team_id = $6
        AND project_id = $7
        AND document_id = $8`
    , [updateOrderNo, folderId, userId, functionName, updateDate, teamId, projectId, documentId]
  );
  if (updDocument.rowCount == 0) {
    return res.status(500).send({message : "ドキュメント更新に失敗しました。(documentId:" + documentId + ")"});
  }

  // 最新のコンテンツ情報を取得
  let contentInfo = await db.query(
    `SELECT stdc.document_name, stdc.content, stdc.version
       FROM sw_t_document_content stdc
      INNER JOIN (
            SELECT document_id, MAX(version) AS version
              FROM sw_t_document_content
             WHERE team_id = $1
               AND document_id = $2
             GROUP BY document_id
            ) ver
         ON stdc.document_id = ver.document_id
        AND stdc.version = ver.version`
     , [teamId, documentId]
  );
  if (contentInfo.rowCount == 0) {
    return res.status(500).send({message : "コンテンツ取得に失敗しました。(documentId:" + documentId + ")"});
  }

  // 更新用ドキュメント名
  let updateDocumentName = contentInfo.rows[0].document_name;
  if (validateUtil.isEmptyText(documentName, "ドキュメント名")) {
    updateDocumentName = documentName;
  }
  // 更新用コンテンツ
  let updateContent = contentInfo.rows[0].content;
  if (validateUtil.isEmptyText(content, "内容")) {
    updateContent = content;
  }
  // 更新用バージョン
  let updateVersion = contentInfo.rows[0].version + 1;

  // コンテンツ登録
  let newContent = await db.query(
    `INSERT INTO sw_t_document_content(
            team_id
          , document_id
          , version
          , document_name
          , content
          , create_user
          , create_function
          , create_datetime)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
      , [teamId, documentId, updateVersion, updateDocumentName, updateContent, userId, functionName, updateDate]
  );
  if (newContent.rowCount == 0) {
    return res.status(500).send({message : "コンテンツ登録に失敗しました。(documentId:" + documentId + ")"});
  }

  // 更新情報を返却
  res.send({
    message : "ドキュメントの更新に成功しました。",
    folderId : folderId,
    documentId : documentId,
    documentName : updateDocumentName,
    content : updateContent,
    order : updateOrderNo,
    version : updateVersion,
  });
});

module.exports = router;
