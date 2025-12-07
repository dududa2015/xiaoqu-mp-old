import {
  formatTime
} from '../../utils/util'
Component({
  properties: {
    tip: {
      type: String,
      value: '请勿输入门禁密码等敏感信息，违者停用账号'
    },
    // noticeList: {
    //     type: Array,
    //     //这个默认value没有效果？为啥？？？
    //     value: ['请勿输入门禁密码等敏感信息，违者停用账号']
    // }
  },
  lifetimes: {
    created() {
      // console.log('组件被创建');
    },
    attached() {
      // console.log('组件被附加');
    },
    ready() {
      this.showNotices()
    },
    moved() {
      // console.log('组件被移动');
    },
    detached() {
      // console.log('组件被移除');
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    show: true, //默认显示
    noticeList: ['苹果app已上线，欢迎下载 → '], //
    // noticeListAppWithoutVIP: ['免费试用7天，结束后需要订阅 →'], //不是app会员时显示
    noticeListApp: [],
    content: [
      // '请勿标记门禁密码，违者停用账号',
      // '轻触右上角···添加小程序，使用更方便',
      // '已开通抖音：小区楼号分布图，欢迎关注',      
      // 'VIP将终身免费使用并移除所有广告',
      // '管理员免看广告删除违规和错误的标记',
    ],
  },
  lifetimes: {
    attached() {
      
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    initNotice(){
      const userInfo = wx.getStorageSync('userInfo') || {}

      // 1. 基础提示内容（沿用原有逻辑）
      let noticeListApp = []
      if (userInfo.isIOSVip || userInfo.isAndroidVip) {
        noticeListApp = ['请勿标记门禁密码，违者停用账号', '已开通抖音：小区楼号分布图，欢迎关注']
      } else {
        // #if ANDROID
        noticeListApp = ['请勿标记门禁密码，违者停用账号', '已开通抖音：小区楼号分布图，欢迎关注']
        // #else
        noticeListApp = ['免费试用7天，结束后需要订阅 →']
        // #endif        
      }

      // 2. 会员即将到期提示（7 天内，仅 Android 展示）
      // #if ANDROID
      const vipExpiredRaw = userInfo.androidVipExpiredDate
      // #else
      const vipExpiredRaw = null
      // #endif

      if (vipExpiredRaw) {
        const now = new Date()
        const expiredDateObj = new Date(vipExpiredRaw)
        if (expiredDateObj > now) {
          const diffMs = expiredDateObj.getTime() - now.getTime()
          const vipDaysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
          if (vipDaysLeft > 0 && vipDaysLeft <= 7) {
            // 取日期部分（假设为 YYYY-MM-DD HH:mm:ss 或 ISO 格式）
            const dateStr = vipExpiredRaw.toString().slice(0, 10)
            const vipTip = `会员将于 ${dateStr} 到期（剩 ${vipDaysLeft} 天）→`
            // 需求：如果会员快到期，只显示到期提示
            noticeListApp = [vipTip]
          }
        }
      }

      this.setData({
        noticeListApp
      })
    },
    showNotices() {
      let currentDate = new Date();
      //当提示语被关闭时写入缓存，有效期一天
      let noticeExpiredDate = new Date(wx.getStorageSync('noticeExpiredDate'))
      if (currentDate > noticeExpiredDate || isNaN(noticeExpiredDate)) {
        this.setData({
          show: true
        })
      } else {
        this.setData({
          show: false
        })
      }
    },
    onClick() {
      const userInfo = wx.getStorageSync('userInfo')
      if (!userInfo.isIOSVip && !userInfo.isAndroidVip) {
        wx.navigateTo({
          url: '/pages/ios/vip/vip',
        })
      }
    },
    //小程序点击
    onMPNoticeClick() {
      wx.navigateTo({
        url: '/pages/my/app/ios/ios',
      })
    },
    onAppNoticeClick() {
      const userInfo = wx.getStorageSync('userInfo') || {}

      // 根据平台生成登录 / 会员页面路径
      // #if IOS
      const loginUrl = '/pages/ios/login/login'
      const vipUrl = '/pages/ios/vip/vip'
      // #elif ANDROID
      const loginUrl = '/pages/android/login/login'
      const vipUrl = '/pages/android/vip/vip'
      // #endif

      // 1. 未登录：仍然可以引导去登录
      if (!userInfo.openId && !userInfo.appleId) {
        wx.navigateTo({
          url: loginUrl,
        })
        return
      }

      // 2. 已登录：只有“会员即将到期”（7 天内）时才跳转到会员页
      //    其它提示点击不再跳转到会员页
      // #if ANDROID
      const vipExpiredRaw = userInfo.androidVipExpiredDate
      // #else
      const vipExpiredRaw = null
      // #endif

      let needGoVip = false
      if (vipExpiredRaw) {
        const now = new Date()
        const expiredDateObj = new Date(vipExpiredRaw)
        if (expiredDateObj > now) {
          const diffMs = expiredDateObj.getTime() - now.getTime()
          const vipDaysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
          if (vipDaysLeft > 0 && vipDaysLeft <= 7) {
            needGoVip = true
          }
        }
      }

      if (!needGoVip) {
        return
      }

        wx.navigateTo({
        url: vipUrl,
        })
    },
    onClose() {
      this.setData({
        show: false
      })
      let currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + 1);
      wx.setStorageSync('noticeExpiredDate', formatTime(currentDate))
    }
  }
})