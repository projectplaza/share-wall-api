module.exports = {

  /**
   * 引数の文字列に対してundefined,空文字チェックを行う。
   * @param {*} val 検証する文字列
   * @param {*} logicalName 文字列の論理名
   * @return true:文字列あり/false:文字列なし（undefinedまたは空文字）
   */
  isEmptyText: function(val, logicalName) {
    console.log('validateUtil - isEmptyText(' + logicalName + ':' + val + ')');
    // 値の検証
    if (val == undefined || val == "") {
      return false;
    }
    return true;
  },

  /**
   * 引数の数値に対してundefined判定を行う。
   * @param {*} val 検証する数値
   * @returns true:文字列あり/false:文字列なし（undefined）
   */
  isEmptyNumber: function(val, logicalName) {
    console.log('validateUtil - isEmptyNumber(' + logicalName + ':' + val +')');
    // 値の検証
    if (val == undefined || val == null) {
      return false;
    }
    return true;
  },

  /**
   * 引数のBooleanに対してundefinedチェックを行う。
   * @param {*} val 検証するBoolean
   * @param {*} logicalName Booleanの論理名
   * @return true:Bool値あり/false:Bool値なし（undefined）
   */
  isEmptyBool: function(val, logicalName) {
    console.log('validateUtil - isEmptyBool(' + logicalName + ':' + val + ')');
    // 値の検証
    if (val == undefined) {
      return false;
    }
    return true;
  },

  /**
   * 引数のObjectに対してundefined、0件チェックを行う。
   * @param {*} obj 検証するObject
   * @param {*} logicalName Objectの論理名
   * @return true:Objectあり/false:Objectなし
   */
  isEmptyObject: function(obj, logicalName) {
    console.log('validateUtil - isEmptyObject(' + logicalName + ')');
    // 実行結果の検証
    if (obj == undefined || obj.length == 0) {
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
