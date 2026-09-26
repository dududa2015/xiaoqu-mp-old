/** 编辑资料。昵称点进去才出现输入框，注销账号进入单独页面。 */

const { updateNickName } = require('../../apis/user')
const { checkNickname } = require('../../apis/security')

/** 自定义导航尺寸。 */
function navMetrics() {
  const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
  const menu = wx.getMenuButtonBoundingClientRect()
  const statusBarHeight = windowInfo.statusBarHeight || 20
  const bar = menu && menu.height ? (menu.top - statusBarHeight) * 2 + menu.height : 44
  return {
    statusBarHeight,
    navBarHeight: statusBarHeight + bar
  }
}

Page({
  data: Object.assign({
    nickName: '',
    editing: false,
    editingName: '',
    focusInput: false
  }, navMetrics()),

  /** 显示当前昵称。未登录则返回。 */
  onShow() {
    const user = wx.getStorageSync('userInfo')
    const nickName = user && user.nickName && !/^null$/i.test(String(user.nickName).trim())
      ? String(user.nickName).trim()
      : ''
    this.setData({
      nickName,
      editing: false,
      editingName: nickName,
      focusInput: false
    })
  },

  /** 返回我的页面。 */
  onBack() {
    wx.navigateBack()
  },

  /** 进入昵称编辑，并延迟聚焦。 */
  onEdit() {
    const name = this.data.nickName || ''
    this.setData({
      editing: true,
      editingName: name,
      focusInput: false
    })
    setTimeout(() => {
      this.setData({ focusInput: true })
    }, 100)
  },

  /** 记录输入，最长 10 字。 */
  onInput(e) {
    this.setData({
      editingName: e.detail.value || ''
    })
  },

  /** 放弃本次输入。 */
  onCancel() {
    this.setData({ editing: false, focusInput: false })
  },

  /** 先做敏感词检查，没变化则只关闭编辑。 */
  onSave() {
    const name = (this.data.editingName || '').trim()
    if (!name) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (name.length > 10) {
      wx.showToast({ title: '昵称最多10个字符', icon: 'none' })
      return
    }
    if (name === this.data.nickName) {
      this.setData({ editing: false, focusInput: false })
      return
    }
    const userId = wx.getStorageSync('userId')
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    checkNickname(name).then((ok) => {
      if (!ok) {
        return
      }
      return updateNickName({ userId, nickName: name }).then((res) => {
        if (!res) {
          wx.showToast({ title: '保存失败，请重试', icon: 'none' })
          return
        }
        const user = wx.getStorageSync('userInfo') || {}
        user.nickName = name
        user.userId = user.userId || userId
        wx.setStorageSync('userInfo', user)
        const app = getApp()
        if (app.globalData) {
          app.globalData.userInfo = user
        }
        this.setData({ nickName: name, editing: false, focusInput: false })
        wx.showToast({ title: '保存成功', icon: 'success' })
      })
    }).catch(() => {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    })
  },

  /** 进入注销页面。 */
  onCancelAccount() {
    wx.navigateTo({ url: '/pages/account-cancel/cancel' })
  }
})
