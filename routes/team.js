var express = require('express');
var router = express.Router();

/**
 * チームAPI
 */
/* GET リストデータを返却する. */
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

/* GET データを返却する. */
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

/* POST データを登録する. */
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

/* POST 権限データを登録する. */
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

/* PUT データを更新する. */
router.put('/:id', function(req, res, next) {
  console.log(req)
  res.send({test : "PUT データ更新",
            id : req.params.id});
});

/* PATCH データを一部更新する. */
router.patch('/:id', function(req, res, next) {
  console.log(req)
  res.send({test : "PATCH 一部データ更新",
            id : req.params.id});
});

/* DELETE データを更新する. */
router.delete('/:id', function(req, res, next) {
  console.log(req)
  res.send({test : "DELETE データ削除",
            id : req.params.id});
});

module.exports = router;
