// ./routes/index.js
const login = require('./login')
const test = require('./test')

module.exports = (app) => {
  // ログイン
  app.use('/api', login)
  // テスト
  app.use('/api/v1/tests', test)
  // etc..
}