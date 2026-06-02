// components/user-info/user-info.js
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
    },
    favoriteCount: {
      type: Number,
      value: 0
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
      const entitlement = getEntitlementStatus(newVal || null)

      if (newVal) {
        const userId = newVal.userId.slice(-8)
        this.setData(Object.assign({
          userId,
          isVip: newVal.isVip,
          isAdmin: newVal.isAdmin,
          points: this.convertToWan(newVal.points),
          markers: this.convertToWan(newVal.markers),
          friends: this.convertToWan(newVal.friends),
          deleted: this.convertToWan(newVal.deleted),
          showRank: newVal.points > 0
        }, this.mapEntitlementData(entitlement)))
        return
      }

      this.setData(Object.assign({
        userId: '',
        isVip: false,
        isAdmin: false,
        points: 0,
        markers: 0,
        friends: 0,
        deleted: 0,
        showRank: false
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
    toPlaces() {
      if (!checkLoginAndNavigate()) {
        return
      }
      wx.navigateTo({
        url: '/pages/my/places/places',
      })
    },
    convertToWan(num) {
      if (num > 1000000) {
        return (num / 10000).toFixed(0) + "万";
      } else if (num > 10000) {
        return (num / 10000).toFixed(2) + "万";
      }
      return num;
    }
  }
})
