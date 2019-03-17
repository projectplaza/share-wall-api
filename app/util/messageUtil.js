module.exports = {

  /**
   * [logicalName]が設定されていません。([physicalName])
   * @param {*} logicalName 論理名
   * @param {*} physicalName 物理名
   */
  errMessage001: function(logicalName, physicalName) {
    return logicalName + "が設定されていません。(" + physicalName + ")";
  },

  /**
   * [logicalName]が存在しません。
   * @param {*} logicalName 実行結果の論理名
   */
  errMessage002: function(logicalName) {
    return logicalName + "が存在しません。";
  },

  /**
   * [logicalName]の権限がありません。
   * @param {*} logicalName 実行結果の論理名
   */
  errMessage003: function(logicalName) {
    return logicalName + "の権限がありません。";
  },

  /**
   * [logicalName]の桁数が不正です。([num])
   * @param {*} logicalName 実行結果の論理名
   */
  errMessage004: function(logicalName, num) {
    return logicalName + "は" + num + "桁で入力してください。";
  }
}
