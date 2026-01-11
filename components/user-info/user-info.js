// components/user-info/user-info.js
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
          // #if IOS
          const vipExpiredRaw = newVal.iosVipExpiredDate
          // #else
          const vipExpiredRaw = newVal.androidVipExpiredDate
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
          let isVipExpiringSoon = false
          if (showVip && expiredDateObj && !isLifetimeVip) {
            const diffMs = expiredDateObj.getTime() - now.getTime()
            // 使用 Math.ceil，保证还有一点点时间也显示为 1 天
            vipDaysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
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
            isVipExpiringSoon,
            isLifetimeVip
          })
        }
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
    onAvatarTap() {
      wx.showToast({
        title: '当前版本：v5.0',
        icon: 'none'
      })
    },
    toEdit() {
      wx.navigateTo({
        url: '/pages/my/edit/edit',
      })
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
      const {
        deleted
      } = event.currentTarget.dataset
      wx.navigateTo({
        url: '/pages/my/markers/markers?deleted=' + deleted,
      })
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