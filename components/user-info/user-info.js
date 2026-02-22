// components/user-info/user-info.js
const { checkLoginAndNavigate } = require('../../utils/util.js')

Component({

  /**
   * 组件的属性列表
   */
  properties: {
    userInfo: {
      type: Object,
      value: {},
      observer(newVal, oldVal) {
        if (newVal) {
          let userId = newVal.userId.slice(-8)
          // 会员到期相关
          let vipExpiredDate = ''
          let vipExpiredRaw
          // #if IOS
          vipExpiredRaw = newVal.iosVipExpiredDate
          // #else
          vipExpiredRaw = newVal.androidVipExpiredDate
          // #endif

          vipExpiredDate = this.formatDate(vipExpiredRaw)

          // 是否当前仍在会员有效期内
          const now = new Date()
          const expiredDateObj = vipExpiredRaw ? new Date(vipExpiredRaw) : null
          const showVip = expiredDateObj && expiredDateObj > now

          // 检查是否是终身会员（2099/12/31 00:00:00）
          const lifetimeDate = new Date('2099-12-31 00:00:00')
          const isLifetimeVip = expiredDateObj && expiredDateObj.getTime() === lifetimeDate.getTime()

          // 计算剩余天数（只对未过期的会员算，终身会员不计算）
          let vipDaysLeft = 0
          let vipHoursLeft = 0
          let showHours = false
          let isVipExpiringSoon = false
          if (showVip && expiredDateObj && !isLifetimeVip) {
            const diffMs = expiredDateObj.getTime() - now.getTime()
            // 使用 Math.ceil，保证还有一点点时间也显示为 1 天
            vipDaysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
            // 如果剩余时间在1天以内，计算小时数
            if (vipDaysLeft <= 1) {
              vipHoursLeft = Math.ceil(diffMs / (1000 * 60 * 60))
              showHours = true
            }
            // 阈值：7 天内视为"即将到期"
            if (vipDaysLeft > 0 && vipDaysLeft <= 7) {
              isVipExpiringSoon = true
            }
          }

          this.setData({
            userId,
            isVip: newVal.isVip,
            isAdmin: newVal.isAdmin,
            points: this.convertToWan(newVal.points),
            markers: this.convertToWan(newVal.markers),
            friends: this.convertToWan(newVal.friends),
            deleted: this.convertToWan(newVal.deleted),
            showRank: newVal.points > 0,
            showVip,
            vipExpiredDate,
            vipDaysLeft,
            vipHoursLeft,
            showHours,
            isVipExpiringSoon,
            isLifetimeVip
          })
        } else {
          this.setData({
            userId: '',
            isVip: false,
            isAdmin: false,
            points: 0,
            markers: 0,
            friends: 0,
            deleted: 0,
            showRank: false,
            showVip: false,
            vipExpiredDate: '',
            vipDaysLeft: 0,
            vipHoursLeft: 0,
            showHours: false,
            isVipExpiringSoon: false,
            isLifetimeVip: false
          })
        }
      }
    },
    validCount: {
      type: Number,
      value: 0,
      observer(newVal) {
        console.log('validCount 变化:', newVal)
      }
    },
    pendingAuditCount: {
      type: Number,
      value: 0,
      observer(newVal) {
        console.log('pendingAuditCount 变化:', newVal)
      }
    },
    deletedCount: {
      type: Number,
      value: 0,
      observer(newVal) {
        console.log('deletedCount 变化:', newVal)
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    onChooseAvatar(e) {
      const {
        avatarUrl
      } = e.detail
      this.setData({
        avatarUrl,
      })
    },
    toEdit() {
      if (checkLoginAndNavigate()) {
        wx.navigateTo({
          url: '/pages/my/edit/edit',
        })
      }
    },
    showToast(event) {
      const {
        number,
        type
      } = event.currentTarget.dataset
      let title = ''
      switch (type) {
        case 'score':
          title = `您的积分为${number}`
          break;
        case 'marker':
          title = `您标记了${number}个点`
          break;
        case 'friend':
          title = `您邀请了${number}个朋友`
          break;
        case 'delete':
          title = `您被删除了${number}个标记`
          break;
        default:
          title = '好像出错了'
          break;
      }
      wx.showToast({
        title: title,
        icon: 'none'
      })
    },
    toMarkers(event) {
      let userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        const {
          deleted
        } = event.currentTarget.dataset
        wx.navigateTo({
          url: '/pages/my/markers/markers?deleted=' + deleted,
        })
      } else {
        wx.showModal({
          title: '登录提示',
          content: '需要先登录才能进行操作',
          success(res) {
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
            } else if (res.cancel) {
              console.log('用户点击取消')
            }
          }
        })
      }
    },
    convertToWan(num) {
      if (num > 1000000) {
        return (num / 10000).toFixed(0) + "万";
      } else if (num > 10000) {
        return (num / 10000).toFixed(2) + "万";
      }
      return num;
    },
    formatDate(datetimeStr) {
      if (datetimeStr) {
        const dateObj = new Date(datetimeStr); // 解析为 Date 对象
        // 检查是否是终身会员（2099/12/31 00:00:00）
        const lifetimeDate = new Date('2099-12-31 00:00:00');
        if (dateObj.getTime() === lifetimeDate.getTime()) {
          return '终身会员';
        }
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // 月份从 0 开始，补零
        const day = String(dateObj.getDate()).padStart(2, "0"); // 补零
        const hours = String(dateObj.getHours()).padStart(2, "0"); // 小时，补零
        const minutes = String(dateObj.getMinutes()).padStart(2, "0"); // 分钟，补零
        const seconds = String(dateObj.getSeconds()).padStart(2, "0"); // 秒，补零
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } else {
        return ''
      }
    }
  }
})