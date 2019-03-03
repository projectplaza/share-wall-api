module.exports = {

  /**
   * 引数の値のundefined,空文字チェックを行い、
   * 400番のエラーを出力します。
   * @param {*} val 検証する値
   * @param {*} logicalName 値の論理名
   * @return true:値あり/false:値なし
   */
  isParamVal: function(val, logicalName) {
    console.log('validateUtil - isParamVal(' + logicalName + ':' + val + ')');
    // 値の検証
    if (val == undefined || val == "") {
      return false;
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
   * 引数（SQLの実行結果）の取得チェックを行う。
   * @param {*} queryResult SQLの実行結果
   * @param {*} logicalName 実行結果の論理名
   * @return true:結果あり/false:結果なし
   */
  isQueryResult: function(queryResult, logicalName) {
    console.log('validateUtil - isQueryResult(' + logicalName + ')');
    // 実行結果の検証
    if (!queryResult.rows || queryResult.rows.length == 0) {
      return false;
    }
    return true;
  }

}
