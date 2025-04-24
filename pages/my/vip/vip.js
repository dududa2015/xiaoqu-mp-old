import ApplePayManager from '../../../utils/apple-iap-manager2';

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
                name: '连续包月',
                price: 5,
                originalPrice: 6,
                note: '0.17元/天，可随时取消订阅',
                recommend: '限时特惠',
                checked: true,
                productIdentifier: 'com.louhao.xiaoqu.month'
            },
            {
                name: '连续包季',
                price: 12,
                originalPrice: 18,
                note: '0.11元/天，可随时取消订阅',
                checked: false,
                productIdentifier: 'com.louhao.xiaoqu.season'
            }, {
                name: '连续包年',
                price: 39.9,
                originalPrice: 72,
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

        const productIdentifiers = ['com.louhao.xiaoqu.month', 'com.louhao.xiaoqu.season', 'com.louhao.xiaoqu.year'];
        // 请求商品信息
        this.applePayManager.requestProducts(productIdentifiers)
            .then(products => {
                products.sort((a, b) => a.price - b.price);
                products.forEach((element, index) => {
                    element.originalPrice = Math.ceil(element.price * 0.6 * (2 + index * 0.5))
                    element.note = this.getProductNote(index, element.price)
                    if (element.productIdentifier === 'com.louhao.xiaoqu.month') {
                        element.recommend = '限时特惠'
                    }
                    if (element.productIdentifier === 'com.louhao.xiaoqu.year') {
                        element.recommend = '超值推荐'
                    }
                    element.checked = index === 0
                });
                console.log('商品数据', products)
                this.setData({
                    productList: products
                }); // 更新页面数据
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
    onVip() {
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

        // const productIdentifier = 'com.louhao.xiaoqu.month'
        // wx.showLoading({
        //     title: '支付中...',
        // })
        // try {
        //     // 1. 动态查询商品信息（确保获取最新价格和状态）
        //     const products = await iapManager.fetchProducts([productIdentifier]);
        //     if (products.length === 0) {
        //         throw new Error('商品不存在或不可用');
        //     }

        //     // 2. 发起支付
        //     await iapManager.purchase(productIdentifier);
        //     console.log('支付成功');
        // } catch (err) {
        //     console.error('支付失败:', err);
        // }





        // const requestObj = wx.miniapp.IAP.requestSKProducts({
        //     productIdentifiers: [
        //         'com.louhao.xiaoqu.month'
        //     ],
        //     success(ret) {
        //         console.log(ret)
        //         console.log(ret.invalidProductIdentifiers)
        //         console.log(ret.products)

        //         wx.miniapp.IAP.addPaymentByProductIdentifiers({
        //             productIdentifier: 'com.louhao.xiaoqu.month',
        //             applicationUsername: 'testidentifierUserName',
        //             quantity: 1,
        //             simulatesAskToBuyInSandbox: false,
        //             success: (args) => {
        //               // addPayment调用成功，但是不代表交易完成。
        //               console.log(`addPaymentByProductIdentifiers success`, args)
        //             },
        //             fail: (args) => {
        //               // addPayment调用成功
        //               console.error(`addPaymentByProductIdentifiers fail`, args)
        //             }
        //           })

        //     },
        //     fail(error) {
        //         console.error(`requestSKProducts failed. ${error.errMsg}`)
        //     }
        // })

        // wx.miniapp.IAP.cancelRequestSKProducts(requestObj)
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