// ./routes/index.js
const login = require('./login');
const test = require('./test');
const user = require('./user');
const team = require('./team');
const project = require('./project');
// 機能
const designDocument = require('./designDocument/document');

module.exports = (app) => {
  // ログイン
  app.use('/api', login);
  // テスト
  app.use('/api/v1/tests', test);
  // ユーザプロフィール
  app.use('/api/v1/prof', user);
  // チーム
  app.use('/api/v1/teams', team);
  // プロジェクト
  app.use('/api/v1/projects', project);

  // デザインドキュメント
  app.use('/api/v1/design_documents', designDocument);
  // etc..
}