/** 用户接口。登录、昵称、标记统计和注销。 */

const { request } = require('../utils/request')

/** 用 wx.login 的 code 换用户和 token。 */
function getUserInfo(params) {
  return request({
    url: '/users/getUserInfo',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

/** 按用户 id 读资料。 */
function getUserById(params) {
  return request({
    url: '/users/getUserById',
    data: params,
    method: 'GET',
    silent: true,
    quiet: true
  })
}

/** 保存昵称。 */
function updateNickName(data) {
  return request({
    url: '/users/updateNickName',
    data,
    method: 'POST',
    silent: true
  })
}

/** 按月汇总标记数。userId 放在查询串上。 */
function updateUserMarkersAndDeleted(params) {
  const userId = params && params.userId ? params.userId : ''
  return request({
    url: '/users/updateUserMarkersAndDeleted?userId=' + encodeURIComponent(userId),
    data: {},
    method: 'POST',
    silent: true,
    quiet: true
  })
}

/** 注销账号。调用方要自己判断 success。 */
function cancelAccount() {
  return request({
    url: '/users/cancelAccount',
    data: {},
    method: 'POST',
    silent: true
  })
}

module.exports = {
  getUserInfo,
  getUserById,
  updateNickName,
  updateUserMarkersAndDeleted,
  cancelAccount
}
