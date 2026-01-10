import {
  updateNickName
} from '../../../apis/user-api'
import {
  msgSecCheck
} from '../../../utils/util'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    nickName: '',
    isEditing: false, // 是否正在编辑
    editingName: '' // 编辑中的昵称
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        nickName: userInfo.nickName
      })
    }
  },
  onNickNameReview(e) {
    console.log(e)
    if (e.detail.pass) {
      console.log(this.data.nickName)
    }
  },
  // 开始编辑昵称
  startEditNickName() {
    this.setData({
      isEditing: true,
      editingName: this.data.nickName || ''
    })
    // 聚焦输入框
    setTimeout(() => {
      this.setData({
        focusInput: true
      })
    }, 100)
  },
  // 输入框值变化
  onNickNameInput(e) {
    const value = e.detail.value || ''
    this.setData({
      editingName: value
    })
  },
  // 取消编辑
  cancelEdit() {
    this.setData({
      isEditing: false,
      editingName: '',
      focusInput: false
    })
  },
  // 保存昵称
  saveNickName() {
    const name = (this.data.editingName || '').trim()
    
    // 检查是否输入了昵称
    if (!name) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 检查昵称长度
    if (name.length > 10) {
      wx.showToast({
        title: '昵称最多10个字符',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 如果昵称没有变化，直接关闭编辑
    if (name === this.data.nickName) {
      this.setData({
        isEditing: false,
        editingName: '',
        focusInput: false
      })
      return
    }
    
    // 执行保存
    this.onSave(name)
  },
  //保存昵称
  onSave(name) {
    const param = {
      userId: wx.getStorageSync('userId'),
      nickName: name
    }
    
    // 内容安全检查
    msgSecCheck(name).then(res => {
      if (res) {
        // 内容安全通过，保存昵称
        updateNickName(param).then(res => {
          if (res) {
            // 保存成功，更新本地缓存
            let userInfo = wx.getStorageSync('userInfo')
            if (userInfo) {
              userInfo.nickName = name
              wx.setStorageSync('userInfo', userInfo)
            }
            
            wx.showToast({
              title: '保存成功',
              icon: 'success',
              mask: true,
              duration: 2000
            })
            
            this.setData({
              nickName: name,
              isEditing: false,
              editingName: '',
              focusInput: false
            })
          } else {
            wx.showToast({
              title: '保存失败，请重试',
              icon: 'none',
              mask: true,
              duration: 2000
            })
            // 保存失败时保持编辑状态，让用户可以重试
          }
        }).catch(err => {
          console.error('保存昵称失败:', err)
          wx.showToast({
            title: '保存失败，请重试',
            icon: 'none',
            mask: true,
            duration: 2000
          })
        })
      } else {
        // 内容安全检查未通过
        wx.showToast({
          title: '昵称包含敏感内容，请修改',
          icon: 'none',
          mask: true,
          duration: 2000
        })
        // 保持编辑状态，让用户可以修改
      }
    }).catch(err => {
      console.error('内容安全检查失败:', err)
      wx.showToast({
        title: '检查失败，请重试',
        icon: 'none',
        mask: true,
        duration: 2000
      })
    })
  },
  toLogin() {
    wx.showModal({
      content: '确认要切换当前账号吗？',
      complete: (res) => {
        if (res.confirm) {
          // #if IOS
          wx.navigateTo({
            url: '/pages/ios/login/login',
          })
          // #else
          wx.navigateTo({
            url: '/pages/android/login/login',
          })
          // #endif          
        }
      }
    })
  },
  onLogout() {
    wx.showModal({
      title: '',
      content: '确认要注销吗？',
      complete: (res) => {
        if (res.confirm) {
          wx.clearStorage({
            success: function () {
              wx.showModal({
                content: '注销成功',
                showCancel: false,
                complete: (res) => {
                  if (res.confirm) {
                    wx.switchTab({
                      url: '/pages/my/index/index',
                    })
                  }
                }
              })
            },
            fail: function (res) {
              console.log('清除本地存储失败:', res.errMsg);
            },
            complete: function () {
              console.log('清除本地存储操作结束');
            }
          });
        }
      }
    })
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})