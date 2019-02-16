module.exports = {

  /**
   * 引数の値のundefined,空文字チェックを行い、
   * 400番のエラーを出力します。
   * @param {*} res 
   * @param {*} val 検証する値
   * @param {*} logicalName 値の論理名
   * @param {*} physicalName 値の物理名
   */
  validate400: function(res, val, logicalName, physicalName) {
    console.log('validateUtil - validate400(' + logicalName + ')');
    // 値の検証
    if (val == undefined || val == "") {
      let errMessage = logicalName + "が設定されていません。(" + physicalName + ")";
      res.status(400).send({message : errMessage});
    }
    return true;
  },

  /**
   * 引数の値のundefined,空文字判定を行う。
   * @param {*} res 
   * @param {*} val 検証する値
   * @returns true:値あり/false:undefinedまたは空文字
   */
  isVal: function(val) {
    console.log('validateUtil - isVal()');
    // 値の検証
    if (val == undefined || val == "") {
      return false;
    }
    return true;
  },

  /**
   * 引数（SQLの実行結果）の取得チェックを行い、
   * 500番のエラーを出力します。
   * @param {*} res 
   * @param {*} queryResult SQLの実行結果
   * @param {*} logicalName 実行結果の論理名
   */
  queryValidate500: function(res, queryResult, logicalName) {
    console.log('validateUtil - queryValidate500(' + logicalName + ')');
    // 実行結果の検証
    if (!queryResult.rows || queryResult.rows.length == 0) {
      let errMessage = logicalName + "が存在しません。";
      res.status(500).send({message : errMessage});
    }
    return true;
  }

}
