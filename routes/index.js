// ./routes/index.js
// マスタ
const login = require('../app/main/login');
const user = require('../app/main/user');
const team = require('../app/main/team');
const project = require('../app/main/project');
// 機能
const designDocument = require('../app/app/document');
const wall = require('../app/app/wall');

module.exports = (app) => {
  // ログイン
  app.use('/api', login);
  // ユーザプロフィール
  app.use('/api/v1/prof', user);
  // チーム
  app.use('/api/v1/teams', team);
  // プロジェクト
  app.use('/api/v1/projects', project);

  // デザインドキュメント
  app.use('/api/v1/design_documents', designDocument);
  // ウォール
  app.use('/api/v1/wall', wall);
  // etc..
}