import ApplePayManager from '../../../utils/apple-iap-manager2';
import {
  getUserById
} from '../../../apis/user-api'
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
    //6 18	72
    //5 14.9  39.9
    productList: [{
      name: '终身会员',
      price: 99.9,
      originalPrice: 999,
      note: '一次付费，永久使用',
      recommend: '限时特惠',
      checked: true,
      productIdentifier: 'com.louhao.xiaoqu.vip'
    }, {
      name: '连续包月',
      price: 6,
      originalPrice: 8,
      note: '0.20元/天，可随时取消订阅',
      // recommend: '限时特惠',
      checked: false,
      productIdentifier: 'com.louhao.xiaoqu.month'
    },
    {
      name: '连续包季',
      price: 15,
      originalPrice: 24,
      note: '0.17元/天，可随时取消订阅',
      checked: false,
      productIdentifier: 'com.louhao.xiaoqu.season'
    }, {
      name: '连续包年',
      price: 39.9,
      originalPrice: 96,
      note: '0.11元/天，可随时取消订阅',
      recommend: '超值推荐',
      checked: false,
      productIdentifier: 'com.louhao.xiaoqu.year'
    }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    //获取userId
    const userId = wx.getStorageSync('userId')
    // 初始化支付管理器（如果未全局挂载）
    this.applePayManager = new ApplePayManager(userId).init();

    const productIdentifiers = ['com.louhao.xiaoqu.vip', 'com.louhao.xiaoqu.month', 'com.louhao.xiaoqu.season', 'com.louhao.xiaoqu.year'];
    // 请求商品信息
    this.applePayManager.requestProducts(productIdentifiers)
      .then(products => {
        products.sort((a, b) => a.price - b.price);
        products.forEach((element, index) => {
          element.originalPrice = Math.ceil(element.price * 0.6 * (2 + index * 0.5))
          element.note = this.getProductNote(index, element.price)
          // if (element.productIdentifier === 'com.louhao.xiaoqu.month') {
          //     element.recommend = '限时特惠'
          // }
          if (element.productIdentifier === 'com.louhao.xiaoqu.year') {
            element.recommend = '超值推荐'
          }
          element.checked = index === 0
        });
        console.log('商品数据', products)
        // this.setData({
        //     productList: products
        // }); // 更新页面数据
      })
      .catch(error => {
        console.error('获取商品失败:', error);
        wx.showToast({
          title: '获取商品失败',
          icon: 'none'
        });
      });
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
    const productIdentifier = event.currentTarget.dataset.productidentifier
    const productList = this.data.productList.map((item, i) => {
      item.checked = item.productIdentifier === productIdentifier;
      return item;
    });
    console.log(productList)
    this.setData({
      productList
    });
  },
  //支付
  onPurchase() {
    //获取productId
    const productIdentifier = this.data.productList.find(item => item.checked).productIdentifier
    wx.showLoading({
      title: '正在支付...',
      mask: true
    })
    // 发起购买
    this.applePayManager.purchaseProduct(productIdentifier)
      .then(transaction => {
        console.log('购买成功:', transaction);
        wx.showToast({
          title: '购买成功',
        })
        //购买成功后调用获取用户信息的接口，并返回上一页
        setTimeout(() => {
          this.getUserInfo()
        }, 1500);

      })
      .catch(error => {
        console.error('购买失败:', error);
        // "未能完成操作。（SKErrorDomain错误2。）"
        let description = error.localizedDescription
        const index = description.indexOf("。");
        if (index !== -1) {
          description = description.substring(0, index);
        }
        wx.showToast({
          title: description,
          icon: 'none'
        })
      }).finally(() => {
        setTimeout(() => {
          wx.hideToast()
        }, 3000);
      })
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
      url: '/pages/ios/vip-agreement/vip-agreement',
    })
  },
  toRenew() {
    wx.navigateTo({
      url: '/pages/ios/vip-renew/vip-renew',
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