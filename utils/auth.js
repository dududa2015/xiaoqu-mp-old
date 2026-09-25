function displayName(user) {
  if (!user || !user.userId) {
    return '请登录'
  }
  const name = user.nickName != null ? String(user.nickName).trim() : ''
  if (!name || /^null$/i.test(name)) {
    return '请设置昵称'
  }
  return name
}

function displayId(user) {
  if (!user || !user.userId) {
    return '--'
  }
  return String(user.userId).slice(-8)
}

function checkLogin() {
  const user = wx.getStorageSync('userInfo')
  if (!user || !user.userId) {
    wx.showToast({ title: '请先登录', icon: 'none' })
    return false
  }
  return true
}

function waitForUserInfo(timeout = 5000) {
  const cached = wx.getStorageSync('userInfo')
  if (cached && cached.userId) {
    return Promise.resolve(cached)
  }
  const app = getApp()
  const ready = app.globalData && app.globalData.userInfoReady
  if (!ready) {
    return Promise.resolve(null)
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeout)
    ready.then((user) => {
      clearTimeout(timer)
      resolve(user && user.userId ? user : null)
    })
  })
}

module.exports = {
  displayName,
  displayId,
  checkLogin,
  waitForUserInfo
}
