// components/user-info-app/user-info-app.js
const { checkLoginAndNavigate } = require('../../utils/util.js')
const { getEntitlementStatus } = require('../../utils/entitlement.js')

Component({

  /**
   * 组件的属性列表
   */
  properties: {
    userInfo: {
      type: Object,
      value: {},
      observer(newVal) {
        this.applyUserInfo(newVal)
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
    applyUserInfo(newVal) {
      let nickName = ''
      let userId = ''
      let user = newVal

      if (newVal && (newVal.openId || newVal.appleId)) {
        nickName = newVal.nickName || '小区楼号'
        userId = newVal.userId.slice(-8)
      } else {
        user = null
        nickName = '点击登录'
      }

      const entitlement = getEntitlementStatus(user)

      this.setData(Object.assign({
        nickName,
        userId,
        points: this.convertToWan(user ? user.points : 0),
        markers: this.convertToWan(user ? user.markers : 0),
        friends: this.convertToWan(user ? user.friends : 0),
        deleted: this.convertToWan(user ? user.deleted : 0)
      }, this.mapEntitlementData(entitlement)))
    },

    mapEntitlementData(entitlement) {
      return {
        isLifetimeVip: entitlement.isLifetimeVip,
        showVip: entitlement.showVip,
        showBadge: entitlement.showBadge,
        showEntitlementRow: entitlement.showEntitlementRow,
        entitlementLabel: entitlement.label,
        entitlementTheme: entitlement.theme,
        entitlementIsActive: entitlement.isActive,
        entitlementEndDate: entitlement.endDateFormatted,
        entitlementDaysLeft: entitlement.daysLeft,
        entitlementHoursLeft: entitlement.hoursLeft,
        entitlementShowHours: entitlement.showHours,
        entitlementExpiringSoon: entitlement.expiringSoon,
        entitlementStatusText: entitlement.statusText
      }
    },

    toLogin() {
      let userInfo = wx.getStorageSync('userInfo')
      if (userInfo.openId || userInfo.appleId) {
        wx.navigateTo({
          url: '/pages/my/edit/edit',
        })
      } else {
        // #if IOS
        wx.navigateTo({
          url: '/pages/ios/login/login',
        })
        // #elif ANDROID
        wx.navigateTo({
          url: '/pages/android/login/login',
        })
        // #endif
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
      if (!checkLoginAndNavigate()) {
        return
      }
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
      } else {
        return num || 0
      }
    }
  }
})
