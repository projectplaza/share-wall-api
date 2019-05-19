// ./routes/index.js
// マスタ
const login = require('../app/master/login');
const user = require('../app/master/user');
const team = require('../app/master/team');
const project = require('../app/master/project');
// 機能
const designDocument = require('../app/document/document');
const wall_board = require('../app/wall/wallBoard');
const wall_panel = require('../app/wall/wallPanel');
const wall_task = require('../app/wall/wallTask');
const wall_comment = require('../app/wall/wallComment');

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
  // ウォール(ボード)
  app.use('/api/v1/wall/board', wall_board);
  // ウォール(ボード＞パネル)
  app.use('/api/v1/wall/panel', wall_panel);
  // ウォール(ボード＞タスク)
  app.use('/api/v1/wall/task', wall_task);
  // ウォール(ボード＞タスク＞コメント)
  app.use('/api/v1/wall/comment', wall_comment);
  // etc..
}