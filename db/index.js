const { Pool } = require('pg');

const pool = new Pool({
    user: 'root',
    host: 'udc2019-aws-db.ctdjivyul3eu.ap-northeast-1.rds.amazonaws.com',
    database: 'udc2019_aws_db',
    password: 'rootroot',
    port: 5432
})

module.exports = {
  query: function(text, params) {
    console.log('sql : ' + text);
    console.log('params : ' + params);
    return pool.query(text, params);
  }
}
