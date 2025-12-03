import ApplePayManager from '../../../utils/apple-iap-manager2';
import {
  createAppOrder
} from '../../../apis/wechatpay-apis'
import {
  getProductList
} from '../../../apis/product-api'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    rightsList: [{
      name: '免广告',
      imgUrl: '/images/my/rights-noad.png'
    }, {
      name: '个人地图',
      imgUrl: '/images/my/rights-map.png'
    }, {
      name: '跟随导航',
      imgUrl: '/images/my/rights-nav.png'
    }, {
      name: '3D地图',
      imgUrl: '/images/my/rights-3d.png'
    }, {
      name: '定位图标',
      imgUrl: '/images/my/rights-loc.png'
    }],
    currentProductIdentifier: 'com.louhao.xiaoqu.vip', //当前
    currentProduct: null,
    productList: [{
      "productId": 1,
      "productIdentifier": "com.louhao.xiaoqu.vip",
      "name": "终身会员",
      "description": "小区楼号终身会员",
      "price": 68,
      "originalPrice": 499.00,
      "note": "一次付费，永久使用",
      "recommend": "超值推荐",
      "checked": true
    }, {
      "productId": 2,
      "productIdentifier": "com.louhao.xiaoqu.month",
      "name": "1个月",
      "description": "月度会员",
      "price": 6.00,
      "originalPrice": 8.00,
      "note": "0.20元/天，不会自动续费"
    }, {
      "productId": 3,
      "productIdentifier": "com.louhao.xiaoqu.season",
      "name": "3个月",
      "description": "季度会员",
      "price": 15.00,
      "originalPrice": 24.00,
      "note": "0.17元/天，不会自动续费"
    }, {
      "productId": 4,
      "productIdentifier": "com.louhao.xiaoqu.year",
      "name": "12个月",
      "description": "年度会员",
      "price": 49.00,
      "originalPrice": 96.00,
      "note": "0.11元/天，不会自动续费"
    }], //付费产品列表
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    //获取userId
    const userId = wx.getStorageSync('userId')
    // 初始化支付管理器（如果未全局挂载）
    this.applePayManager = new ApplePayManager(userId).init();

    // this.getProductList()
    // this.getProductListByApple()

    this.init()
  },
  init() {
    //控制显示是否显示温馨提醒
    let userInfo = wx.getStorageSync('userInfo')
    if (!userInfo || !userInfo.userId) {
      wx.navigateTo({
        url: '/pages/android/login/login',
      })
      return
    }
    this.setData({
      currentProduct: this.data.productList[0]
    })
  },
  //通过接口获取产品列表--优化用这个方法获取
  getProductList() {
    getProductList().then(res => {
      let productList = res.map((product, index) => ({
        ...product,
        checked: index === 0 // 如果是第一项（索引为0），checked 为 true，否则为 false
      }))
      this.setData({
        productList
      })
      console.log('请求商品信息', productList)
    })
  },
  getProductNote(index, price) {
    if (index === 0) {
      return `${(price / 30).toFixed(2)}元/天，可随时取消订阅`
    } else if (index === 1) {
      return `${(price / 90).toFixed(2)}元/天，可随时取消订阅`
    } else if (index === 2) {
      return `${(price / 365).toFixed(2)}元/天，可随时取消订阅`
    } else {
      return '可随时取消订阅'
    }
  },
  onUnload() {
    // 清理资源
    if (this.applePayManager) {
      console.log('清理资源')
      this.applePayManager.destroy();
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
  //支付 1715931589
  async onPurchase() {
    const param = {
      // AppId: "wx3490241c9a011b50",
      userId: wx.getStorageSync('userId'),
      Amount: this.data.currentProduct.price, //* 100,
      ProductId: this.data.currentProduct.productIdentifier,
      Description: this.data.currentProduct.description,
    }
    const data = await createAppOrder(param)
    console.log(data)
    this.requestPayment(data)
  },
  requestPayment(data) {
    // 假设从你的服务端接口收到了所有支付参数
    wx.miniapp.requestPayment({
      mchId: '1715931589', // 你的商户号
      prepayId: data.prepayId, // 服务端返回的prepay_id
      nonceStr: data.nonceStr, // 随机字符串
      package: 'Sign=WXPay', // 固定值
      timeStamp: data.timeStamp, // 示例时间戳，字符串格式的秒级时间戳      
      sign: data.paySign, // 服务端计算好的V3签名
      success: (res) => {
        console.warn('wx.miniapp.requestPayment success:', res);
        wx.showModal({
          content: '支付成功',
          showCancel: false,
          confirmText: '好的',
          success(res) {
            if (res.confirm) {
              wx.navigateBack()
            }
          }
        });
        // 支付成功，跳转到成功页面或进行其他业务操作
      },
      fail: (res) => {
        console.error('wx.miniapp.requestPayment res:', res);
        // 处理失败情况
        if (res.errMsg && res.errMsg.includes('cancel')) {
          // 用户取消支付
          wx.showToast({
            title: '用户取消支付',
            icon: 'none'
          });
        } else {
          // 处理其他错误
          wx.showToast({
            title: '支付失败',
            icon: 'none'
          });
        }
      }
    })
  },
  getProductName(index) {
    let productName = ''
    switch (index) {
      case 0:
        productName = '小区楼号终身会员'
        break;
      case 1:
        productName = '小区楼号1个月会员'
        break;
      case 2:
        productName = '小区楼号3个月会员'
        break;
      case 3:
        productName = '小区楼号12个月会员'
        break;
      default:
        productName = '小区楼号1个月会员'
        break;
    }

    return productName
  },
  //恢复购买
  onRestore() {
    wx.showLoading({
      title: '恢复购买中...',
      mask: true
    })
    this.applePayManager.restorePurchases().then(res => {
      console.log('onRestore', res)
      wx.showToast({
        title: res.message,
        icon: 'none'
      })
    })
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
  getUserInfo() {
    let userId = wx.getStorageSync('userId')
    if (userId) {
      getUserById({
        code: '',
        userId,
        friendUserId: ''
      }).then(res => {
        if (res) {
          wx.setStorageSync('userInfo', res)
          wx.navigateBack()
        }
      })
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },
  onChange(e) {
    this.setData({
      value: e.detail.value
    });
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

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

  }
})