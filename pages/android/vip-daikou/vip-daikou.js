import {
  createContractOrder
} from '../../../apis/wechatpay-papay-apis'
import {
  getProductList
} from '../../../apis/product-api'
import {
  getUserById
} from '../../../apis/user-api'
const { checkLoginAndNavigate } = require('../../../utils/util.js')

const PAPAY_PRODUCT_IDENTIFIERS = [
  'com.louhao.xiaoqu.month',
  'com.louhao.xiaoqu.season',
  'com.louhao.xiaoqu.year'
]

function buildPriceLabel(productIdentifier, price) {
  const amount = Number(price || 0)
  if (productIdentifier.endsWith('.month')) {
    return `¥${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}/月`
  }
  if (productIdentifier.endsWith('.season')) {
    return `¥${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}/季`
  }
  if (productIdentifier.endsWith('.year')) {
    return `¥${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}/年`
  }
  return `¥${amount.toFixed(2)}`
}

function getWechatOpenId() {
  const userInfo = wx.getStorageSync('userInfo') || {}
  return (userInfo.appOpenId || userInfo.openId || '').trim()
}

function checkWechatInstalled() {
  return new Promise((resolve) => {
    if (!wx.miniapp || typeof wx.miniapp.hasWechatInstall !== 'function') {
      resolve(true)
      return
    }

    wx.miniapp.hasWechatInstall({
      success: (res) => {
        resolve(!!res.hasWechatInstall)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

Page({
  data: {
    rightsList: [{
      name: '免广告',
      icon: 'sound-mute-filled'
    }, {
      name: '个人地图',
      icon: 'map-information-2'
    }, {
      name: '跟随导航',
      icon: 'map-navigation-filled'
    }, {
      name: '3D地图',
      icon: 'map-3d-filled'
    }, {
      name: '定位图标',
      icon: 'location-filled'
    }],
    productList: [],
    currentProduct: null,
    agreedRenew: false,
    paying: false,
    waitingSignResult: false,
    loading: false
  },

  onLoad() {
    if (!checkLoginAndNavigate('redirectTo')) {
      return
    }
    this.loadProductList()
  },

  onShow(options) {
    if (!this.data.waitingSignResult) {
      return
    }

    this.clearLaunchWatchdog()

    const extraData = options && options.referrerInfo && options.referrerInfo.extraData
    if (extraData && extraData.return_code === 'FAIL') {
      this.resetSigningState(true, extraData.return_msg || '签约已取消')
      return
    }

    this.setData({
      waitingSignResult: false,
      paying: false
    })
    this.checkUserInfoAfterPayment()
  },

  onHide() {
    this._didLeaveAppForWechat = true
    this.clearLaunchWatchdog()
  },

  onUnload() {
    this.clearLaunchWatchdog()
  },

  clearLaunchWatchdog() {
    if (this._launchWatchdogTimer) {
      clearTimeout(this._launchWatchdogTimer)
      this._launchWatchdogTimer = null
    }
  },

  resetSigningState(showToast, message) {
    this.clearLaunchWatchdog()
    this._didLeaveAppForWechat = false
    this.setData({
      waitingSignResult: false,
      paying: false
    })
    if (showToast && message) {
      wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000
      })
    }
  },

  async loadProductList() {
    if (this.data.loading) {
      return
    }

    this.setData({
      loading: true
    })

    try {
      const res = await getProductList()
      const sourceList = Array.isArray(res) ? res : []
      const filteredList = sourceList.filter(item =>
        PAPAY_PRODUCT_IDENTIFIERS.includes(item.productIdentifier)
      ).sort((a, b) => {
        return PAPAY_PRODUCT_IDENTIFIERS.indexOf(a.productIdentifier) -
          PAPAY_PRODUCT_IDENTIFIERS.indexOf(b.productIdentifier)
      })

      if (!filteredList.length) {
        wx.showToast({
          title: '暂无订阅产品',
          icon: 'none'
        })
        return
      }

      const productList = filteredList.map((product, index) => {
        const price = Number(product.price || 0)
        const originalPrice = Number(product.originalPrice || 0)

        return {
          productId: product.productId,
          productIdentifier: product.productIdentifier,
          name: product.name,
          localizedTitle: product.name,
          description: product.name,
          price,
          priceText: price.toFixed(2),
          priceLabel: buildPriceLabel(product.productIdentifier, price),
          originalPrice: originalPrice > 0 ? originalPrice : null,
          originalPriceText: originalPrice > 0 ? originalPrice.toFixed(2) : null,
          note: product.note || '',
          recommend: product.recommend || '',
          checked: index === 0
        }
      })

      this.setData({
        productList,
        currentProduct: productList[0]
      })
    } catch (error) {
      console.error('获取订阅产品失败:', error)
      wx.showToast({
        title: '加载产品失败',
        icon: 'none'
      })
    } finally {
      this.setData({
        loading: false
      })
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
      currentProduct
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
      const hasWechat = await checkWechatInstalled()
      if (!hasWechat) {
        this.setData({
          paying: false
        })
        wx.showToast({
          title: '请先安装微信后再订阅',
          icon: 'none',
          duration: 2000
        })
        return
      }

      const openId = getWechatOpenId()
      if (!openId) {
        this.setData({
          paying: false
        })
        wx.showModal({
          title: '需要微信登录',
          content: '开通自动续费需使用微信登录 App，请先完成微信授权登录。',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({
                url: '/pages/android/login/login',
              })
            }
          }
        })
        return
      }

      const param = {
        userId: wx.getStorageSync('userId'),
        productId: this.data.currentProduct.productIdentifier,
        openId,
      }
      console.log('创建签约', param)
      wx.showLoading({
        title: '正在创建签约...',
        mask: true
      })

      const data = await createContractOrder(param)
      wx.hideLoading()
      this.launchWechatSigning(data)
    } catch (error) {
      console.error('创建签约失败:', error)
      wx.hideLoading()
      this.setData({
        paying: false
      })
      wx.showToast({
        title: error.message || '创建签约失败，请重试',
        icon: 'none',
        duration: 2000
      })
    }
  },

  launchWechatSigning(data) {
    const preEntrustwebId = data && (data.preEntrustwebId || data.PreEntrustwebId)
    const miniprogramUsername = data && (data.miniprogramUsername || data.MiniprogramUsername)
    const miniprogramPath = data && (data.miniprogramPath || data.MiniprogramPath)
    if (!preEntrustwebId) {
      this.resetSigningState(true, '签约参数获取失败')
      return
    }

    const launchData = {
      preEntrustwebId,
      miniprogramUsername,
      miniprogramPath
    }

    if (miniprogramUsername && miniprogramPath) {
      console.log('委托代扣签约调起: WXLaunchMiniProgram', miniprogramUsername, miniprogramPath)
      this.launchSigningMiniProgram(launchData)
      return
    }

    console.log('委托代扣签约调起: openBusinessWebview', preEntrustwebId)
    this.launchSigningOpenBusinessWebview(launchData)
  },

  launchSigningOpenBusinessWebview(data) {
    if (!wx.miniapp || typeof wx.miniapp.openBusinessWebview !== 'function') {
      this.resetSigningState(true, '当前版本不支持微信签约，请更新 App')
      return
    }

    this._didLeaveAppForWechat = false
    this.clearLaunchWatchdog()
    this.setData({
      waitingSignResult: true
    })

    wx.miniapp.openBusinessWebview({
      preEntrustwebId: data.preEntrustwebId,
      success: () => {
        this._launchWatchdogTimer = setTimeout(() => {
          if (!this._didLeaveAppForWechat && this.data.waitingSignResult) {
            this.resetSigningState(true, '无法打开微信，请先安装微信')
          }
        }, 2500)
      },
      fail: (res) => {
        console.error('openBusinessWebview fail:', res)
        this.resetSigningState(true, '无法拉起微信签约，请确认已安装微信')
      }
    })
  },

  launchSigningMiniProgram(data) {
    this._didLeaveAppForWechat = false
    this.clearLaunchWatchdog()
    this.setData({
      waitingSignResult: true
    })
    wx.miniapp.launchMiniProgram({
      userName: data.miniprogramUsername,
      path: data.miniprogramPath,
      miniprogramType: 0,
      success: () => {
        this._launchWatchdogTimer = setTimeout(() => {
          if (!this._didLeaveAppForWechat && this.data.waitingSignResult) {
            this.resetSigningState(true, '无法打开微信，请先安装微信')
          }
        }, 2500)
      },
      fail: (res) => {
        console.error('launchMiniProgram fail:', res)
        this.resetSigningState(true, '无法拉起微信签约，请确认已安装微信')
      }
    })
  },

  checkUserInfoAfterPayment() {
    const maxAttempts = 10
    const interval = 2000
    let attempts = 0

    wx.showLoading({
      title: '正在确认签约结果...',
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
          jumpToHome('签约成功，会员权益可能稍后到账')
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
            if (res) {
              wx.setStorageSync('userInfo', res)
            }
            jumpToHome('签约处理中，请稍后在会员管理查看')
          } else {
            setTimeout(checkUserInfo, interval)
          }
        } else if (attempts >= maxAttempts) {
          jumpToHome('签约成功，会员权益可能稍后到账')
        } else {
          setTimeout(checkUserInfo, interval)
        }
      }).catch(() => {
        if (attempts >= maxAttempts) {
          jumpToHome('签约成功，会员权益可能稍后到账')
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
  },

  toFaq() {
    wx.navigateTo({
      url: '/pages/help/question/question',
    })
  }
})
