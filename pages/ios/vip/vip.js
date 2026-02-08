import ApplePayManager from '../../../utils/apple-iap-manager2';
import {
  getUserById
} from '../../../apis/user-api'
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
    productList: [], //苹果的付费产品列表
    currentProductIdentifier: 'com.louhao.xiaoqu.vip', //当前选中的产品标识符
    //6 18	72
    //5 14.9  39.9
    // productList: [{
    //         name: '终身会员',
    //         price: 99.9,
    //         originalPrice: 999,
    //         note: '一次付费，永久使用',
    //         recommend: '限时特惠',
    //         checked: true,
    //         productIdentifier: 'com.louhao.xiaoqu.vip'
    //     }, {
    //         name: '连续包月',
    //         price: 6,
    //         originalPrice: 8,
    //         note: '0.20元/天，可随时取消订阅',
    //         // recommend: '限时特惠',
    //         checked: false,
    //         productIdentifier: 'com.louhao.xiaoqu.month'
    //     },
    //     {
    //         name: '连续包季',
    //         price: 15,
    //         originalPrice: 24,
    //         note: '0.17元/天，可随时取消订阅',
    //         checked: false,
    //         productIdentifier: 'com.louhao.xiaoqu.season'
    //     }, {
    //         name: '连续包年',
    //         price: 39.9,
    //         originalPrice: 96,
    //         note: '0.11元/天，可随时取消订阅',
    //         recommend: '超值推荐',
    //         checked: false,
    //         productIdentifier: 'com.louhao.xiaoqu.year'
    //     }
    // ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    this.init()
  },
  init() {
    //控制显示是否显示温馨提醒
    let userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.userId) {
      this.applePayManager = new ApplePayManager().init();

      this.getProductList()
      this.getProductListByApple()      
    } else {
      wx.navigateTo({
        url: '/pages/ios/login/login',
      })
      return
    }
    if (userInfo && userInfo.openId) {
      this.setData({
        showTips: true
      })
    }
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
  //通过苹果sdk获取产品列表
  getProductListByApple() {
    const productIdentifiers = ['com.louhao.xiaoqu.vip', 'com.louhao.xiaoqu.month', 'com.louhao.xiaoqu.season', 'com.louhao.xiaoqu.year'];
    // 请求商品信息
    this.applePayManager.requestProducts(productIdentifiers)
      .then(products => {
        let productList = []
        console.log('请求商品信息', products)
        productIdentifiers.forEach(item => {
          console.log(item)
          let find = products.find(product => {
            return item === product.productIdentifier
          })
          if (find.productIdentifier === 'com.louhao.xiaoqu.vip') {
            find.recommend = '限时特惠'
            find.originalPrice = 499
            find.note = "一次付费，永久使用"
            find.checked = true
          }
          if (find.productIdentifier === 'com.louhao.xiaoqu.month') {
            find.originalPrice = 8
            find.note = this.getProductNote(0, find.price)
          }
          if (find.productIdentifier === 'com.louhao.xiaoqu.season') {
            find.originalPrice = 24
            find.note = this.getProductNote(1, find.price)
          }
          if (find.productIdentifier === 'com.louhao.xiaoqu.year') {
            find.recommend = '超值推荐'
            find.originalPrice = 96
            find.note = this.getProductNote(2, find.price)
          }
          productList.push(find)
        })
        console.log('商品数据', productList)
        // this.setData({
        //     productList
        // });
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
      productList,
      currentProductIdentifier: productIdentifier
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