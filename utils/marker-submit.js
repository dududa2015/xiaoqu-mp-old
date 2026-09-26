/** 提交标记前的坐标、编号和是否可直接通过审核。 */

/** 这些名称可以直接展示，不必进入审核。 */
const AUDITED = [
  '出入口', '入口', '东门', '南门', '西门', '北门', '厕所', '公厕',
  '维修点', '换电站', '外卖柜', '可通行', '围墙', '电梯', '有电梯',
  '小门', '大门', '消防门'
]

const SPECIAL = ['号', '号楼', '幢', '座', '栋', '单元', '层', '房号', '区', '楼宇', '片区', '期']

/** 用经纬度后几位拼一个标记编号。 */
function generateXId(lat, lng) {
  const truncatedLat = Math.floor(Number(lat) * 1000000).toString()
  const truncatedLng = Math.floor(Number(lng) * 1000000).toString()
  return truncatedLat.slice(-8) + truncatedLng.slice(-7)
}

/** 名称像楼号或固定词时可以直接展示，否则先进入审核。 */
function checkString(value) {
  const text = String(value || '')
  if (AUDITED.indexOf(text) !== -1) {
    return true
  }
  const isShortNumeric = /^\d{1,3}$/.test(text)
  const isSingleAlphabetic = /^[A-Za-z]$/.test(text)
  const hasSpecial = SPECIAL.some((item) => text.indexOf(item) !== -1) && /^\d{1,3}[\u4e00-\u9fa5]+$/.test(text)
  const letterSpecial = /^[A-Za-z][\u4e00-\u9fa5]+$/.test(text) && !/\d/.test(text)
  const containsDash = /^(-$|^[A-Za-z]-[A-Za-z]$|^\d{0,3}-\d{0,3}$)/.test(text)
  return isShortNumeric || isSingleAlphabetic || hasSpecial || containsDash || letterSpecial
}

/** 坐标保留 6 位小数。 */
function roundCoord(value) {
  return Math.round(Number(value) * 1000000) / 1000000
}

/** 道路用绿色，围墙用红色并带禁止箭头。 */
function buildPolyline(points, type, xId) {
  return {
    xId,
    points,
    color: type === 8 ? '#dc143c' : '#3CB371',
    width: 5,
    arrowLine: true,
    arrowIconPath: type === 8 ? '/images/forbid.png' : '',
    level: 'abovebuildings'
  }
}

module.exports = {
  generateXId,
  checkString,
  roundCoord,
  buildPolyline
}
