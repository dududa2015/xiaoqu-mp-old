import {
  getXpayGoodsList,
  createXpayOrder,
  queryXpayOrder,
  DEFAULT_XPAY_GOODS,
  GOODS_UNIT
} from '../../../apis/xpay-api'
import {
  getUserById,
  getUserInfo
} from '../../../apis/user-api'
import {
  checkIosVersion,
  formatFen,
  formatPayError,
  resolveXpayEnv,
  requestVirtualPayment,
  logXpayChecklist
} from '../../../utils/xpay'
import {
  refresh as refreshEntitlement,
  isMpVip
} from '../../../utils/entitlement'

const BENEFITS = [
  { icon: 'sound-mute', title: '免广告' },
  { icon: 'app', title: '全功能' }
]

function chunkBenefits(list, size) {
  const rows = []
  for (let i = 0; i < list.length; i += size) {
    rows.push({
      id: `row-${i}`,
      items: list.slice(i, i + size)
    })
  }
  return rows
}

const GOODS_DISPLAY = {
  vip_month: {
    badge: '超值推荐',
    originalYuan: '6',
    noteDays: 30,
    priceSuffix: '/月'
  },
  vip_season: {
    badge: '',
    originalYuan: '15',
    noteDays: 90,
    priceSuffix: '/季'
  },
  vip_year: {
    badge: '',
    originalYuan: '49',
    noteDays: 365,
    priceSuffix: '/年'
  }
}

function dailyNote(fen, days) {
  if (!days) {
    return ''
  }
  const yuan = (Number(fen) || 0) / 100
  return `${(yuan / days).toFixed(2)}元/天`
}

function normalizeGoods(list) {
  const source = Array.isArray(list) && list.length ? list : DEFAULT_XPAY_GOODS
  return source.map((item) => {
    const productId = item.productId || item.ProductId
    const goodsPrice = item.goodsPrice || item.GoodsPrice || item.price || 0
    const display = GOODS_DISPLAY[productId] || {}
    const priceText = formatFen(goodsPrice)
    return {
      productId,
      name: item.name || item.Name,
      days: item.days || item.Days || 0,
      goodsPrice,
      unit: GOODS_UNIT[productId] || item.unit || item.Unit || '',
      desc: item.desc || item.Desc || '',
      badge: display.badge || '',
      originalPriceText: display.originalYuan ? `¥${display.originalYuan}元` : '',
      note: dailyNote(goodsPrice, display.noteDays),
      priceText,
      priceLabel: `¥${priceText}${display.priceSuffix || ''}`
    }
  }).filter((item) => item.productId)
}

Page({
  data: {
    goodsList: [],
    selectedIndex: 0,
    paying: false,
    benefitRows: chunkBenefits(BENEFITS, 2),
    agreed: false
  },

  onLoad() {
    logXpayChecklist()
  },

  onShow() {
    this.loadGoods()
    this.refreshSession().catch((error) => {
      console.warn('[xpay] refresh session', error)
    })
  },

  async loadGoods() {
    try {
      const res = await getXpayGoodsList()
      const list = normalizeGoods(res && (res.list || res.goods || res.data || res))
      this.setData({
        goodsList: list.length ? list : normalizeGoods(DEFAULT_XPAY_GOODS)
      })
    } catch (e) {
      this.setData({
        goodsList: normalizeGoods(DEFAULT_XPAY_GOODS)
      })
    }
  },

  onSelect(e) {
    this.setData({
      selectedIndex: Number(e.currentTarget.dataset.index) || 0
    })
  },

  onToggleAgree() {
    this.setData({
      agreed: !this.data.agreed
    })
  },

  onOpenAgreement() {
    wx.navigateTo({
      url: '/pages/my/vip-agreement/vip-agreement'
    })
  },

  async onBuy() {
    if (this.data.paying) {
      return
    }
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先阅读并同意会员服务协议',
        icon: 'none'
      })
      return
    }
    if (!checkIosVersion()) {
      return
    }
    const goods = this.data.goodsList[this.data.selectedIndex]
    if (!goods) {
      wx.showToast({
        title: '请选择套餐',
        icon: 'none'
      })
      return
    }

    this.setData({
      paying: true
    })
    try {
      const env = resolveXpayEnv()
      const payData = await createXpayOrder({
        productId: goods.productId,
        goodsPrice: goods.goodsPrice,
        buyQuantity: 1,
        env
      })
      const payload = payData.payData || payData
      const signData = typeof payload.signData === 'string'
        ? payload.signData
        : typeof payload.SignData === 'string'
          ? payload.SignData
          : ''
      const paySig = payload.paySig || payload.PaySig
      const signature = payload.signature || payload.Signature
      const offerId = payload.offerId || payload.OfferId
      if (!signData || !paySig || !signature) {
        throw new Error('下单失败，请稍后重试')
      }
      console.log('[xpay] create order', {
        env: payload.env === 0 || payload.env === 1 ? payload.env : env,
        platform: wx.getSystemInfoSync().platform,
        envVersion: wx.getAccountInfoSync().miniProgram.envVersion,
        offerId,
        productId: goods.productId,
        outTradeNo: payload.outTradeNo || payload.OutTradeNo,
        signData
      })
      await requestVirtualPayment({
        signData,
        paySig,
        signature,
        mode: payload.mode || payload.Mode || 'short_series_goods',
        offerId,
        env: payload.env === 0 || payload.env === 1 ? payload.env : env
      })
      wx.showToast({
        title: '支付处理中',
        icon: 'none'
      })
      await this.waitForDeliver(payload.outTradeNo || payload.OutTradeNo)
    } catch (error) {
      console.error('[xpay] pay failed', error)
      const msg = formatPayError(error)
      if (msg) {
        wx.showToast({
          title: msg,
          icon: 'none',
          duration: 3000
        })
      }
    } finally {
      this.setData({
        paying: false
      })
    }
  },

  refreshSession() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: async (res) => {
          if (!res.code) {
            reject(new Error('登录失败，请重试'))
            return
          }
          try {
            const userId = wx.getStorageSync('userId') || ''
            const user = await getUserInfo({
              code: res.code,
              userId
            })
            if (user && user.userId) {
              wx.setStorageSync('userId', user.userId)
              wx.setStorageSync('token', user.token)
              wx.setStorageSync('userInfo', user)
              const app = getApp()
              if (app && app.globalData) {
                app.globalData.userInfo = user
              }
            }
            resolve(user)
          } catch (error) {
            reject(error)
          }
        },
        fail: reject
      })
    })
  },

  async waitForDeliver(outTradeNo) {
    const userId = wx.getStorageSync('userId')
    for (let i = 0; i < 8; i++) {
      if (outTradeNo) {
        try {
          await queryXpayOrder({
            outTradeNo,
            order_id: outTradeNo
          })
        } catch (e) {}
      }
      try {
        if (userId) {
          const user = await getUserById({
            code: '',
            userId,
            friendUserId: ''
          })
          if (user) {
            wx.setStorageSync('userInfo', user)
            wx.setStorageSync('userId', user.userId)
          }
        }
      } catch (e) {}
      await refreshEntitlement({
        force: true
      })
      if (isMpVip(wx.getStorageSync('userInfo'))) {
        wx.showToast({
          title: '会员已开通',
          icon: 'success'
        })
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
    wx.showToast({
      title: '到账可能稍有延迟，请稍后在个人中心查看',
      icon: 'none'
    })
  }
})
