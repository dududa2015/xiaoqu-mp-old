/** 内容安全。昵称等文本先过服务端敏感词检查。 */

const { request } = require('../utils/request')

/** 检查一段文本是否可发布。 */
function msgSecurityCheck(params) {
  return request({
    url: '/securityCheck/msgSecurityCheck',
    data: params,
    method: 'GET',
    silent: true
  })
}

/** 校验昵称。不安全时 toast 并返回 false。 */
function checkNickname(content) {
  wx.showLoading({ title: '正在校验', mask: true })
  return msgSecurityCheck({ content }).then((res) => {
    wx.hideLoading()
    if (res && res.isContentSafe === false) {
      wx.showToast({ title: '昵称包含敏感内容，请修改', icon: 'none' })
      return false
    }
    return true
  }).catch((error) => {
    wx.hideLoading()
    throw error
  })
}

module.exports = {
  msgSecurityCheck,
  checkNickname
}
