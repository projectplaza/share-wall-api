// ./routes/index.js
const login = require('./login');
const test = require('./test');
const user = require('./user');
const team = require('./team');

module.exports = (app) => {
  // ログイン
  app.use('/api', login);
  // テスト
  app.use('/api/v1/tests', test);
  // ユーザプロフィール
  app.use('/api/v1/prof', user);
  // チーム
  app.use('/api/v1/teams', team);
  // etc..
}