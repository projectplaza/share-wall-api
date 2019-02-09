/**
 * チームAPI.<br/>
 * 
 * GET(http://localhost:3000/api/v1/team)
 * GET(http://localhost:3000/api/v1/team/{チームID})
 * POST(http://localhost:3000/api/v1/team/{チームID})
 * PUT(http://localhost:3000/api/v1/team/{チームID})
 * DELETE(http://localhost:3000/api/v1/team/{チームID})
 * GET(http://localhost:3000/api/v1/team/{チームID}/users)
 * POST(http://localhost:3000/api/v1/team/{チームID}/users)
 */
var express = require('express');
var router = express.Router();

/**
 * チームAPI.<br/>
 * GET(http://localhost:3000/api/v1/team)
 */
router.get('/', function(req, res, next) {
  // パラメータ取得
  let params = req.body;
  let teamId = params.teamId;
  let teamName = params.teamName;
  if (params.teamId == undefined || params.userId == "") {
    teamId = "チームID";
  }
  if (params.teamName == undefined || params.userName == "") {
    teamName = "チーム名";
  }

  // TODO: 検索

  res.send([{teamId : teamId, teamName : teamName},
            {teamId : teamId, teamName : teamName},
            {teamId : teamId, teamName : teamName}]);
});

/**
 * チーム情報取得API.<br/>
 * GET(http://localhost:3000/api/v1/team/{チームID})
 */
router.get('/:teamId', function(req, res, next) {
  // チェック処理
  // teamId がない場合はリスト取得が動作するためチェックなし
  let params = req.params;
  let teamId = params.teamId;
  
  // TODO: 検索

  res.send({teamId : teamId,
            teamName : "チーム名",
            content : "内容",
            users : [{userId : "ユーザID", userName : "ユーザ名", administratorAuthority : true, leaderPermission : true, memberPermission : true},
                     {userId : "ユーザID", userName : "ユーザ名", administratorAuthority : true, leaderPermission : true, memberPermission : true}]
  });
});

/**
 * チーム登録API.<br/>
 * POST(http://localhost:3000/api/v1/team/{チームID})
 */
router.post('/:teamId', function(req, res, next) {
  // チェック処理
  let teamId = req.params.teamId;
  let params = req.body;
  let teamName = params.teamName;
  let content = params.content;
  if (teamId == undefined || teamId == "") {
    res.status(500).send({message : "チームIDが設定されていません。(teamId)"});
  }
  if (teamName == undefined || teamName == "") {
    res.status(500).send({message : "チーム名が設定されていません。(teamName)"});
  }

  // TODO: 登録

  res.send({teamId : teamId,
            teamName : teamName,
            content : content
  });
});

/**
 * チーム更新API.<br/>
 * PUT(http://localhost:3000/api/v1/team/{チームID})
 */
router.put('/:teamId', function(req, res, next) {
  console.log(req)
  res.send({test : "PUT データ更新",
            id : req.params.teamId});
});

/**
 * チーム情報を一部更新API（※いらない？とりあえず未実装のまま放置。）.<br/>
 * PATCH(http://localhost:3000/api/v1/team/{チームID})
 */
router.patch('/:id', function(req, res, next) {
  console.log(req)
  res.send({test : "PATCH 一部データ更新",
            id : req.params.id});
});

/**
 * チーム削除API.<br/>
 * 論理削除。<br/>
 * DELETE(http://localhost:3000/api/v1/team/{チームID})
 */
router.delete('/:teamId', function(req, res, next) {
  console.log(req)
  res.send({test : "DELETE データ削除",
            id : req.params.teamId});
});

/**
 * チーム メンバー＆権限取得API.<br/>
 * GET(http://localhost:3000/api/v1/team/{チームID}/users)
 */

/**
 * チーム メンバー＆権限登録API.<br/>
 * POST(http://localhost:3000/api/v1/team/{チームID}/users)
 */
router.post('/:teamId/users', function(req, res, next) {
  // チェック処理
  let teamId = req.params.teamId;
  let paramsList = req.body;
  let result = [];
  for (let i=0; i<paramsList.length; i++) {
    let params = paramsList[i];
    let userId = params.userId;
    let administratorAuthority = params.administratorAuthority;
    let leaderPermission = params.leaderPermission;
    let memberPermission = params.memberPermission;
    if (teamId == undefined || teamId == "") {
      res.status(500).send({message : "チームIDが設定されていません。(teamId)"});
    }
    if (userId == undefined || userId == "") {
      res.status(500).send({message : "ユーザIDが設定されていません。(userId)"});
    }
    if (administratorAuthority == undefined) {
      res.status(500).send({message : "管理者権限が設定されていません。(administratorAuthority)"});
    }
    if (leaderPermission == undefined) {
      res.status(500).send({message : "リーダー権限が設定されていません。(leaderPermission)"});
    }
    if (memberPermission == undefined) {
      res.status(500).send({message : "メンバー権限が設定されていません。(memberPermission)"});
    }

    result.push({userId : userId,
      administratorAuthority : administratorAuthority,
      leaderPermission : leaderPermission,
      memberPermission : memberPermission
    });

  }

  // TODO: 登録処理。DELETE & INSERT

  res.send(result);
});

module.exports = router;
