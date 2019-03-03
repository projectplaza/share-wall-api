/**
 * ウォールAPI.<br/>
 * 
 * ウォール一覧取得API
 * GET(http://localhost:3000/api/v1/wall/list)
 * ウォール新規作成API
 * POST(http://localhost:3000/api/v1/wall)
 * ウォール更新API
 * PUT(http://localhost:3000/api/v1/wall)
 * ウォール削除API
 * DELETE(http://localhost:3000/api/v1/wall)
 * ボード一覧取得API
 * GET(http://localhost:3000/api/v1/wall/board/list)
 * ボード新規作成API
 * POST(http://localhost:3000/api/v1/wall/board)
 * ボード更新API
 * PUT(http://localhost:3000/api/v1/wall/board)
 * ボード削除API
 * DELETE(http://localhost:3000/api/v1/wall/board)
 */
var express = require('express');
var router = express.Router();

// DBアクセス
const db = require('../../db');

// util
const tokenUtil = require('../../app/util/main/tokenUtil.js');
const teamUtil = require('../../app/util/main/teamUtil.js');
const projectUtil = require('../../app/util/main/projectUtil.js');
const generatUtil = require('../../app/util/generatUtil.js');
const validateUtil = require('../../app/util/validateUtil.js');

module.exports = router;
