/** 登录态展示和检查。页面在改数据前调用 checkLogin。 */

/** 没登录显示请登录，没昵称显示请设置昵称。 */
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

/** 界面上只显示用户 id 的后 8 位。 */
function displayId(user) {
  if (!user || !user.userId) {
    return '--'
  }
  return String(user.userId).slice(-8)
}

/** 没有 userId 时 toast 并返回 false。 */
function checkLogin() {
  const user = wx.getStorageSync('userInfo')
  if (!user || !user.userId) {
    wx.showToast({ title: '请先登录', icon: 'none' })
    return false
  }
  return true
}

/** 等冷启动登录结束，超时则返回空。 */
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
