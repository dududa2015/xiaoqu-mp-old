import {
  createAppOrder
} from '../../../apis/wechatpay-apis'
import {
  getUserById
} from '../../../apis/user-api'
const { checkLoginAndNavigate } = require('../../../utils/util.js')

const STATIC_PRODUCT_LIST = [{
  productId: 'month-auto',
  productIdentifier: 'com.louhao.xiaoqu.month.auto',
  name: '连续包月',
  localizedTitle: '连续包月',
  description: '连续包月会员（自动续费）',
  price: 6,
  priceText: '6.00',
  originalPrice: 9,
  originalPriceText: '9.00',
  note: '每月自动续费',
  recommend: '推荐',
  checked: true
}, {
  productId: 'season-auto',
  productIdentifier: 'com.louhao.xiaoqu.season.auto',
  name: '连续包季',
  localizedTitle: '连续包季',
  description: '连续包季会员（自动续费）',
  price: 15,
  priceText: '15.00',
  originalPrice: 27,
  originalPriceText: '27.00',
  note: '每3个月自动续费',
  recommend: '',
  checked: false
}, {
  productId: 'year-auto',
  productIdentifier: 'com.louhao.xiaoqu.year.auto',
  name: '连续包年',
  localizedTitle: '连续包年',
  description: '连续包年会员（自动续费）',
  price: 49.9,
  priceText: '49.90',
  originalPrice: 108,
  originalPriceText: '108.00',
  note: '每12个月自动续费',
  recommend: '',
  checked: false
}]

const getPurchaseButtonText = (product) => {
  if (!product) {
    return '确认协议并开通'
  }
  const price = product.priceText || product.price
  return `确认协议并以￥${price}元开通`
}

Page({
  data: {
    rightsList: [{
      name: '免广告',
      icon: '🚫'
    }, {
      name: '个人地图',
      icon: '🗺️'
    }, {
      name: '跟随导航',
      icon: '🧭'
    }, {
      name: '3D地图',
      icon: '🌐'
    }, {
      name: '定位图标',
      icon: '📍'
    }],
    productList: STATIC_PRODUCT_LIST,
    currentProduct: STATIC_PRODUCT_LIST[0],
    purchaseButtonText: getPurchaseButtonText(STATIC_PRODUCT_LIST[0]),
    agreedRenew: false,
    paying: false
  },

  onLoad() {
    if (!checkLoginAndNavigate('redirectTo')) {
      return
    }
  },

  onVipChange(event) {
    const index = event.currentTarget.dataset.index
    const currentProduct = this.data.productList[index]
    const productList = this.data.productList.map((item, i) => {
      item.checked = i === index
      return item
    })

    this.setData({
      productList,
      currentProduct,
      purchaseButtonText: getPurchaseButtonText(currentProduct)
    })
  },

  onAgreedRenewChange(event) {
    this.setData({
      agreedRenew: event.detail.checked
    })
  },

  async onPurchase() {
    if (!this.data.agreedRenew) {
      wx.showToast({
        title: '请先阅读并同意自动续费协议',
        icon: 'none'
      })
      return
    }

    if (!this.data.currentProduct) {
      wx.showToast({
        title: '请先选择产品',
        icon: 'none'
      })
      return
    }

    if (this.data.paying) {
      return
    }

    this.setData({
      paying: true
    })

    try {
      const param = {
        userId: wx.getStorageSync('userId'),
        Amount: this.data.currentProduct.price * 100,
        ProductId: this.data.currentProduct.productIdentifier,
        Description: this.data.currentProduct.description,
      }

      wx.showLoading({
        title: '正在创建订单...',
        mask: true
      })

      const data = await createAppOrder(param)
      wx.hideLoading()
      this.requestPayment(data)
    } catch (error) {
      console.error('创建订单失败:', error)
      wx.hideLoading()
      this.setData({
        paying: false
      })
      wx.showToast({
        title: error.message || '创建订单失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
  },

  requestPayment(data) {
    if (!data || !data.prepayId) {
      this.setData({
        paying: false
      })
      wx.showToast({
        title: '订单创建失败',
        icon: 'none'
      })
      return
    }

    wx.miniapp.requestPayment({
      mchId: '1112580418',
      prepayId: data.prepayId,
      nonceStr: data.nonceStr,
      package: 'Sign=WXPay',
      timeStamp: data.timeStamp,
      sign: data.paySign,
      success: () => {
        this.setData({
          paying: false
        })
        this.checkUserInfoAfterPayment()
      },
      fail: (res) => {
        console.error('wx.miniapp.requestPayment res:', res)
        this.setData({
          paying: false
        })
        if (res.errMsg && res.errMsg.includes('cancel')) {
          wx.showToast({
            title: '已取消支付',
            icon: 'none'
          })
        } else {
          const errorMsg = res.errMsg || '支付失败'
          wx.showToast({
            title: errorMsg.includes('fail') ? '支付失败，请重试' : errorMsg,
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
  },

  checkUserInfoAfterPayment() {
    const maxAttempts = 10
    const interval = 2000
    let attempts = 0

    wx.showLoading({
      title: '支付成功，正在确认...',
      mask: true
    })

    const jumpToHome = (message) => {
      wx.hideLoading()
      wx.showToast({
        title: message,
        icon: 'success',
        duration: 2000
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/my/index/index',
        })
      }, 2000)
    }

    const checkUserInfo = () => {
      attempts++
      const userId = wx.getStorageSync('userId')
      if (!userId) {
        if (attempts >= maxAttempts) {
          jumpToHome('支付成功，会员权益可能稍后到账')
          return
        }
        setTimeout(checkUserInfo, interval)
        return
      }

      getUserById({
        code: '',
        userId,
        friendUserId: ''
      }).then(res => {
        if (res) {
          const oldUserInfo = wx.getStorageSync('userInfo')
          const oldVipDate = oldUserInfo ? oldUserInfo.androidVipExpiredDate : null
          const newVipDate = res.androidVipExpiredDate

          if (newVipDate && newVipDate !== oldVipDate) {
            wx.setStorageSync('userInfo', res)
            jumpToHome('开通成功')
          } else if (attempts >= maxAttempts) {
            wx.setStorageSync('userInfo', res)
            jumpToHome('支付成功，会员权益可能稍后到账')
          } else {
            setTimeout(checkUserInfo, interval)
          }
        } else if (attempts >= maxAttempts) {
          jumpToHome('支付成功，会员权益可能稍后到账')
        } else {
          setTimeout(checkUserInfo, interval)
        }
      }).catch(() => {
        if (attempts >= maxAttempts) {
          jumpToHome('支付成功，会员权益可能稍后到账')
        } else {
          setTimeout(checkUserInfo, interval)
        }
      })
    }

    setTimeout(checkUserInfo, 1000)
  },

  toUseAgreement() {
    wx.navigateTo({
      url: '/pages/android/vip-agreement/vip-agreement',
    })
  },

  toDaikouAgreement() {
    wx.navigateTo({
      url: '/pages/android/vip-daikou-agreement/vip-daikou-agreement',
    })
  }
})
