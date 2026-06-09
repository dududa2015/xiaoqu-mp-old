import {
  cancelContract,
  createContractOrder,
  getSubscription
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

function resolveSubscriptionProductId(subscription) {
  if (!subscription) {
    return ''
  }
  return (
    subscription.productId ||
    subscription.ProductId ||
    subscription.productIdentifier ||
    subscription.ProductIdentifier ||
    ''
  ).trim()
}

function resolvePlanPeriodKey(value) {
  const text = (value || '').toLowerCase()
  if (!text) {
    return ''
  }
  if (text.includes('month') || text.includes('月度') || text.includes('包月')) {
    return 'month'
  }
  if (text.includes('season') || text.includes('季度') || text.includes('包季')) {
    return 'season'
  }
  if (text.includes('year') || text.includes('年度') || text.includes('包年')) {
    return 'year'
  }
  return ''
}

function isSameSubscriptionPlan(product, subscription) {
  if (!product || !subscription) {
    return false
  }

  const subscriptionProductId = resolveSubscriptionProductId(subscription)
  if (subscriptionProductId) {
    if (
      product.productIdentifier === subscriptionProductId ||
      String(product.productId) === subscriptionProductId
    ) {
      return true
    }

    const productKey = resolvePlanPeriodKey(product.productIdentifier)
    const subscriptionKey = resolvePlanPeriodKey(subscriptionProductId)
    if (productKey && subscriptionKey) {
      return productKey === subscriptionKey
    }
  }

  const planName = (subscription.planName || '').trim()
  if (!planName) {
    return false
  }

  if (product.name === planName || product.localizedTitle === planName) {
    return true
  }

  const productKey = resolvePlanPeriodKey(product.productIdentifier || product.name)
  const planKey = resolvePlanPeriodKey(planName)
  return !!(productKey && planKey && productKey === planKey)
}

function buildSubscribeButtonText({
  paying,
  alreadySubscribed,
  selectedIsCurrentPlan
}) {
  if (paying) {
    return alreadySubscribed && !selectedIsCurrentPlan ? '更换中...' : '支付中...'
  }
  if (!alreadySubscribed) {
    return '立即订阅'
  }
  if (selectedIsCurrentPlan) {
    return '当前方案'
  }
  return '更换为此方案'
}

function buildSubscriptionHint({
  alreadySubscribed,
  subscriptionPlanName,
  isChangeMode
}) {
  if (!alreadySubscribed) {
    return ''
  }
  if (isChangeMode) {
    return `当前为「${subscriptionPlanName}」，选择其他方案后可一键更换，当前会员权益不受影响。`
  }
  return `当前已开通「${subscriptionPlanName}」自动续费。如需更换方案，请选择其他套餐。`
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
    loading: false,
    alreadySubscribed: false,
    subscriptionPlanName: '',
    currentProductIdentifier: '',
    selectedIsCurrentPlan: false,
    isChangeMode: false,
    subscriptionHint: '',
    subscribeButtonText: '立即订阅'
  },

  onLoad(options) {
    if (!checkLoginAndNavigate('redirectTo')) {
      return
    }
    this.setData({
      isChangeMode: options && options.from === 'change'
    })
    this.loadProductList()
    this.loadSubscription()
  },

  onShow(options) {
    if (!this.data.waitingSignResult) {
      this.loadSubscription()
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
      paying: false,
      subscribeButtonText: buildSubscribeButtonText({
        paying: false,
        alreadySubscribed: this.data.alreadySubscribed,
        selectedIsCurrentPlan: this.data.selectedIsCurrentPlan
      })
    })
    if (showToast && message) {
      wx.showToast({
        title: message,
        icon: 'none',
        duration: 2000
      })
    }
  },

  async loadSubscription() {
    const userId = wx.getStorageSync('userId')
    if (!userId) {
      this._subscriptionRes = null
      this.syncProductSelection({
        alreadySubscribed: false,
        subscriptionPlanName: '',
        currentProductIdentifier: '',
        subscriptionHint: ''
      })
      return
    }

    try {
      const res = await getSubscription(userId)
      const autoRenewEnabled = !!res.autoRenewEnabled
      const subscriptionPlanName = res.planName || 'VIP 会员'
      this._subscriptionRes = res
      this.syncProductSelection({
        alreadySubscribed: autoRenewEnabled,
        subscriptionPlanName,
        currentProductIdentifier: resolveSubscriptionProductId(res),
        subscriptionHint: buildSubscriptionHint({
          alreadySubscribed: autoRenewEnabled,
          subscriptionPlanName,
          isChangeMode: this.data.isChangeMode
        })
      })
    } catch (error) {
      console.error('获取订阅状态失败:', error)
    }
  },

  isSelectedCurrentPlan() {
    const {
      currentProduct,
      alreadySubscribed
    } = this.data
    if (!alreadySubscribed || !currentProduct) {
      return false
    }
    if (currentProduct.isCurrent) {
      return true
    }
    const subscriptionRes = this._subscriptionRes
    return !!(subscriptionRes && isSameSubscriptionPlan(currentProduct, subscriptionRes))
  },

  syncProductSelection(overrides = {}) {
    const preserveSelection = !!overrides.preserveSelection
    const productList = overrides.productList || this.data.productList
    const subscriptionRes = overrides.subscriptionRes !== undefined
      ? overrides.subscriptionRes
      : this._subscriptionRes
    const alreadySubscribed = overrides.alreadySubscribed !== undefined
      ? overrides.alreadySubscribed
      : this.data.alreadySubscribed
    const paying = overrides.paying !== undefined
      ? overrides.paying
      : this.data.paying

    const nextData = {}
    if (overrides.subscriptionPlanName !== undefined) {
      nextData.subscriptionPlanName = overrides.subscriptionPlanName
    }
    if (overrides.currentProductIdentifier !== undefined) {
      nextData.currentProductIdentifier = overrides.currentProductIdentifier
    }
    if (overrides.subscriptionHint !== undefined) {
      nextData.subscriptionHint = overrides.subscriptionHint
    }
    if (overrides.alreadySubscribed !== undefined) {
      nextData.alreadySubscribed = overrides.alreadySubscribed
    }

    if (!productList.length) {
      if (Object.keys(nextData).length) {
        this.setData(nextData)
      }
      return
    }

    let selectedIndex = productList.findIndex((item) => item.checked)
    if (selectedIndex < 0) {
      selectedIndex = 0
    }

    if (!preserveSelection && alreadySubscribed && subscriptionRes) {
      const currentIndex = productList.findIndex((item) =>
        isSameSubscriptionPlan(item, subscriptionRes)
      )
      if (currentIndex >= 0) {
        selectedIndex = currentIndex
      }
    }

    const updatedList = productList.map((item, index) => {
      const isCurrent = alreadySubscribed && subscriptionRes
        ? isSameSubscriptionPlan(item, subscriptionRes)
        : false
      return {
        ...item,
        isCurrent,
        checked: index === selectedIndex
      }
    })

    const currentProduct = updatedList[selectedIndex] || updatedList[0]
    const selectedIsCurrentPlan = !!(
      alreadySubscribed &&
      subscriptionRes &&
      currentProduct &&
      isSameSubscriptionPlan(currentProduct, subscriptionRes)
    )

    this.setData({
      ...nextData,
      productList: updatedList,
      currentProduct,
      selectedIsCurrentPlan,
      subscribeButtonText: buildSubscribeButtonText({
        paying,
        alreadySubscribed,
        selectedIsCurrentPlan
      })
    })
  },

  showCurrentPlanToast() {
    wx.showToast({
      title: '已是当前方案，无需重复订阅',
      icon: 'none',
      duration: 2500
    })
  },

  onCurrentPlanTap() {
    if (!this.data.agreedRenew) {
      wx.showToast({
        title: '请先阅读并同意自动续费协议',
        icon: 'none'
      })
      return
    }
    this.showCurrentPlanToast()
  },

  confirmChangePlan() {
    const nextPlanName = this.data.currentProduct
      ? (this.data.currentProduct.localizedTitle || this.data.currentProduct.name)
      : '新方案'

    wx.showModal({
      title: '更换订阅方案',
      content: `将关闭「${this.data.subscriptionPlanName}」并签约「${nextPlanName}」。当前会员权益不受影响，下一周期起按新方案扣费。`,
      confirmText: '确认更换',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          await this.changePlanAndSubscribe()
        }
      }
    })
  },

  async changePlanAndSubscribe() {
    const userId = wx.getStorageSync('userId')
    if (!userId) {
      return
    }

    this.setData({
      paying: true,
      subscribeButtonText: buildSubscribeButtonText({
        paying: true,
        alreadySubscribed: true,
        selectedIsCurrentPlan: false
      })
    })

    try {
      wx.showLoading({
        title: '正在更换方案...',
        mask: true
      })
      await cancelContract(userId)
      wx.hideLoading()
      this._subscriptionRes = null
      this.setData({
        alreadySubscribed: false,
        selectedIsCurrentPlan: false,
        subscriptionHint: '',
        currentProductIdentifier: ''
      })
      await this.proceedWithPurchase()
    } catch (error) {
      console.error('更换订阅方案失败:', error)
      wx.hideLoading()
      this.setData({
        paying: false,
        subscribeButtonText: buildSubscribeButtonText({
          paying: false,
          alreadySubscribed: this.data.alreadySubscribed,
          selectedIsCurrentPlan: this.data.selectedIsCurrentPlan
        })
      })
      wx.showToast({
        title: error.message || '更换失败，请重试',
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

      this.syncProductSelection({
        productList
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
    const productList = this.data.productList.map((item, i) => ({
      ...item,
      checked: i === index
    }))

    this.syncProductSelection({
      productList,
      preserveSelection: true
    })
  },

  onAgreedRenewChange(event) {
    const checked = !!(event.detail && (event.detail.checked ?? event.detail.value))
    this.setData({
      agreedRenew: checked
    })
  },

  async onPurchase() {
    if (this.data.paying) {
      return
    }

    if (!this.data.currentProduct) {
      wx.showToast({
        title: '请先选择产品',
        icon: 'none'
      })
      return
    }

    if (this.isSelectedCurrentPlan() || this.data.subscribeButtonText === '当前方案') {
      this.showCurrentPlanToast()
      return
    }

    if (!this.data.agreedRenew) {
      wx.showToast({
        title: '请先阅读并同意自动续费协议',
        icon: 'none'
      })
      return
    }

    if (this.data.alreadySubscribed) {
      this.confirmChangePlan()
      return
    }

    await this.proceedWithPurchase()
  },

  async proceedWithPurchase() {
    this.setData({
      paying: true,
      subscribeButtonText: buildSubscribeButtonText({
        paying: true,
        alreadySubscribed: this.data.alreadySubscribed,
        selectedIsCurrentPlan: this.data.selectedIsCurrentPlan
      })
    })

    try {
      const hasWechat = await checkWechatInstalled()
      if (!hasWechat) {
        this.setData({
          paying: false,
          subscribeButtonText: buildSubscribeButtonText({
            paying: false,
            alreadySubscribed: this.data.alreadySubscribed,
            selectedIsCurrentPlan: this.data.selectedIsCurrentPlan
          })
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
          paying: false,
          subscribeButtonText: buildSubscribeButtonText({
            paying: false,
            alreadySubscribed: this.data.alreadySubscribed,
            selectedIsCurrentPlan: this.data.selectedIsCurrentPlan
          })
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
      await this.loadSubscription()
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
