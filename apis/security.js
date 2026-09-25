const { request } = require('../utils/request')

function msgSecurityCheck(params) {
  return request({
    url: '/securityCheck/msgSecurityCheck',
    data: params,
    method: 'GET',
    silent: true
  })
}

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
