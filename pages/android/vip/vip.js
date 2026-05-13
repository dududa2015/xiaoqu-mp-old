import {
  createAppOrder
} from '../../../apis/wechatpay-apis'
import {
  getProductAndroidList
} from '../../../apis/product-api'
import {
  getUserById
} from '../../../apis/user-api'
const { checkLoginAndNavigate } = require('../../../utils/util.js')

Page({

  /**
   * 页面的初始数据
   */
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
    currentProduct: null,
    productList: [], //付费产品列表
    loading: false,
    paying: false, // 支付中状态
    showRefundHelp: false // 显示退款说明提示
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.init()
  },
  async init() {
    //控制显示是否显示温馨提醒
    if (!checkLoginAndNavigate('redirectTo')) {
      return
    }
    // 从后端获取产品列表
    await this.getProductAndroidList()
  },
  //通过接口获取安卓产品列表
  async getProductAndroidList() {
    if (this.data.loading) {
      return
    }

    this.setData({
      loading: true
    })

    try {
      const res = await getProductAndroidList()

      if (res && Array.isArray(res) && res.length > 0) {
        // 处理产品列表数据，添加 checked 字段
        let productList = res.map((product, index) => {
          const price = Number(product.price || product.Price || 0)
          const originalPrice = Number(product.originalPrice || product.OriginalPrice || 0)

          return {
            productId: product.productId || product.ProductId,
            productIdentifier: product.productIdentifier || product.ProductIdentifier,
            name: product.name || product.Name,
            localizedTitle: product.localizedTitle || product.LocalizedTitle || product.name || product.Name,
            description: product.description || product.Description,
            price: price, // 保留原始数字用于计算
            priceText: price.toFixed(2), // 格式化价格用于显示
            originalPrice: originalPrice > 0 ? originalPrice : null,
            originalPriceText: originalPrice > 0 ? originalPrice.toFixed(2) : null,
            note: product.note || product.Note,
            recommend: product.recommend || product.Recommend,
            checked: index === 0 // 第一项默认选中
          }
        })

        this.setData({
          productList,
          currentProduct: productList[0]
        })

        console.log('获取安卓产品列表成功', productList)
      } else {
        console.warn('产品列表为空')
        wx.showToast({
          title: '暂无产品信息',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取产品列表失败:', error)
      wx.showToast({
        title: '加载产品列表失败',
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
      item.checked = i === index;
      return item;
    });

    this.setData({
      productList,
      currentProduct
    });
    console.log(this.data.currentProduct)
  },
  //支付 1112580418
  async onPurchase() {
    if (!this.data.currentProduct) {
      wx.showToast({
        title: '请先选择产品',
        icon: 'none'
      })
      return
    }

    if (this.data.paying) {
      return // 防止重复点击
    }

    this.setData({
      paying: true
    })

    try {
      const param = {
        userId: wx.getStorageSync('userId'),
        Amount: this.data.currentProduct.price * 100, //,
        ProductId: this.data.currentProduct.productIdentifier,
        Description: this.data.currentProduct.description,
      }

      wx.showLoading({
        title: '正在创建订单...',
        mask: true
      })

      const data = await createAppOrder(param)
      console.log(data)

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

    // 假设从你的服务端接口收到了所有支付参数
    wx.miniapp.requestPayment({
      mchId: '1112580418', // 你的商户号
      prepayId: data.prepayId, // 服务端返回的prepay_id
      nonceStr: data.nonceStr, // 随机字符串
      package: 'Sign=WXPay', // 固定值
      timeStamp: data.timeStamp, // 示例时间戳，字符串格式的秒级时间戳      
      sign: data.paySign, // 服务端计算好的V3签名
      success: (res) => {
        console.warn('wx.miniapp.requestPayment success:', res);
        this.setData({
          paying: false
        })
        // 支付成功后，轮询检查用户信息是否已更新，然后直接跳转
        this.checkUserInfoAfterPayment()
      },
      fail: (res) => {
        console.error('wx.miniapp.requestPayment res:', res);
        this.setData({
          paying: false
        })
        // 处理失败情况
        if (res.errMsg && res.errMsg.includes('cancel')) {
          // 用户取消支付
          wx.showToast({
            title: '已取消支付',
            icon: 'none'
          });
        } else {
          // 处理其他错误
          const errorMsg = res.errMsg || '支付失败'
          wx.showToast({
            title: errorMsg.includes('fail') ? '支付失败，请重试' : errorMsg,
            icon: 'none',
            duration: 2000
          });
        }
      }
    })
  },

  // 支付成功后轮询检查用户信息是否已更新，然后直接跳转
  checkUserInfoAfterPayment() {
    const maxAttempts = 10 // 最多尝试10次
    const interval = 2000 // 每2秒检查一次
    let attempts = 0
    let userInfoUpdated = false // 标记用户信息是否已更新
    
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
          console.warn('检查用户信息超时，用户ID不存在')
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
          
          // 检查会员信息是否已更新
          if (newVipDate && newVipDate !== oldVipDate) {
            console.log('用户信息已更新，会员到期时间:', newVipDate)
            wx.setStorageSync('userInfo', res)
            userInfoUpdated = true
            jumpToHome('支付成功')
          } else if (attempts >= maxAttempts) {
            // 达到最大尝试次数，即使没更新也继续
            console.warn('检查用户信息达到最大次数，会员信息可能尚未更新')
            if (res) {
              wx.setStorageSync('userInfo', res)
            }
            jumpToHome('支付成功，会员权益可能稍后到账')
          } else {
            // 继续轮询
            setTimeout(checkUserInfo, interval)
          }
        } else {
          if (attempts >= maxAttempts) {
            console.warn('检查用户信息达到最大次数，未获取到用户信息')
            jumpToHome('支付成功，会员权益可能稍后到账')
          } else {
            setTimeout(checkUserInfo, interval)
          }
        }
      }).catch(err => {
        console.error('获取用户信息失败:', err)
        if (attempts >= maxAttempts) {
          jumpToHome('支付成功，会员权益可能稍后到账')
        } else {
          setTimeout(checkUserInfo, interval)
        }
      })
    }
    
    // 延迟1秒后开始第一次检查，给服务器一些处理时间
    setTimeout(checkUserInfo, 1000)
  },
  toMP() {
    wx.miniapp.launchMiniProgram({
      userName: 'gh_37d525095f5a', //小程序原始ID
      path: 'pages/index/index',
      miniprogramType: 0, //0 release ，1 test, 2 preview
      success: (res) => {
        console.log('launchMiniProgram success:', res)
      }
    })
  },
  toUseAgreement() {
    wx.navigateTo({
      url: '/pages/android/vip-agreement/vip-agreement',
    })
  },
  toRenew() {
    wx.navigateTo({
      url: '/pages/android/vip-renew/vip-renew',
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  async onPullDownRefresh() {
    await this.getProductAndroidList()
    wx.stopPullDownRefresh()
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

  },

  // 显示/隐藏退款说明提示
  onShowRefundHelp() {
    this.setData({
      showRefundHelp: !this.data.showRefundHelp
    })
  }
})