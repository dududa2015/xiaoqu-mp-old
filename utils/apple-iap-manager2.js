class ApplePayManager {
    constructor() {
        this.transactionObserver = null;
        this.paymentSuccessCallback = null;
        this.paymentFailCallback = null;
        this.currentRequest = null;
        this.restoreSuccessCallback = null;
        this.restoreFailCallback = null;
    }

    /**
     * 初始化Apple支付环境
     */
    init() {
        this._addTransactionObserver();
        return this;
    }

    /**
     * 添加交易观察者
     */
    _addTransactionObserver() {
        console.log('_addTransactionObserver')
        this.transactionObserver = {
            updatedTransactions: (args) => {
                console.log('交易数据格式:', args.transactions);
                args.transactions.forEach(transaction => {
                    this._handleTransaction(transaction);
                });
            },
            restoreCompletedTransactionsFailedWithError: (args) => {
                console.error('恢复购买失败:', args);
                if (this.restoreFailCallback) {
                    this.restoreFailCallback(args);
                }
            },
            paymentQueueRestoreCompletedTransactionsFinished: (args) => {
                console.log('恢复购买完成:', args);
                if (args.transactions && args.transactions.length > 0) {
                    args.transactions.forEach(transaction => {
                        this._handleTransaction(transaction);
                    });
                    if (this.restoreSuccessCallback) {
                        this.restoreSuccessCallback({
                            message: '恢复购买完成'
                        })
                    }
                } else {
                    console.log('没有可恢复的购买');
                    if (this.restoreSuccessCallback) {
                        this.restoreSuccessCallback({
                            message: '没有可恢复的购买'
                        });
                    }
                }
            },
            // 其他回调...
        };

        wx.miniapp.IAP.addTransactionObserver(this.transactionObserver);
    }

    /**
     * 处理交易状态
     */
    _handleTransaction(transaction) {
        console.log('_handleTransaction')
        switch (transaction.transactionState) {
            case 'SKPaymentTransactionStatePurchasing':
                console.log('交易中...');
                break;
            case 'SKPaymentTransactionStatePurchased':
                this._handlePurchased(transaction);
                break;
            case 'SKPaymentTransactionStateFailed':
                this._handleFailed(transaction);
                break;
            case 'SKPaymentTransactionStateRestored':
                console.log('交易已恢复:', transaction);
                this._handlePurchased(transaction);
                break;
            case 'SKPaymentTransactionStateDeferred':
                console.log('交易延迟:', transaction);
                break;
        }
    }

    /**
     * 处理购买成功
     */
    _handlePurchased(transaction) {
        // //为了测试，要删除下面这行代码TODO
        // this._finishTransaction(transaction);
        // 验证收据
        this._verifyReceipt(transaction.transactionReceipt)
            .then(() => {
                if (this.paymentSuccessCallback) {
                    this.paymentSuccessCallback(transaction);
                }
                this._finishTransaction(transaction);
            })
            .catch(error => {
                console.error('收据验证失败:', error);
                if (this.paymentFailCallback) {
                    this.paymentFailCallback(error);
                }
            });
    }

    /**
     * 处理购买失败
     */
    _handleFailed(transaction) {
        console.error('购买失败了:', transaction.error);
        if (this.paymentFailCallback) {
            this.paymentFailCallback(transaction.error);
        }
        this._finishTransaction(transaction);
    }

    /**
     * 验证收据
     */
    _verifyReceipt(receiptData) {
        console.log('_verifyReceipt')
        // 验证时从缓存取 userId
        const userId = wx.getStorageSync('userId') || (wx.getStorageSync('userInfo') && wx.getStorageSync('userInfo').userId) || null;
        if (userId == null || userId === '') {
            console.warn('_verifyReceipt: userId 为空，跳转登录页')
            wx.navigateTo({ url: '/pages/ios/login/login' });
            return Promise.reject(new Error('请先登录'));
        }
        return new Promise((resolve, reject) => {
            // 这里应该将收据发送到你的服务器进行验证
            // 示例代码，实际应该调用你的后端API
            wx.request({
                url: 'https://mp.zhuzixi.cn/api/AppleIAPReceipts/VerifyReceipt',
                // url: 'http://localhost:5213/api/ReceiptVerification/VerifyReceipt',
                method: 'POST',
                data: {
                    receipt: receiptData,
                    userId: userId
                },
                success: (res) => {
                    console.log('_verifyReceipt', res)
                    if (res.data.valid) {
                        console.log('验证收据成功')
                        resolve();
                    } else {
                        console.log('验证收据失败')
                        reject(new Error('无效的收据'));
                    }
                },
                fail: (error) => {
                    reject(error);
                }
            });
        });
    }

    /**
     * 完成交易
     */
    _finishTransaction(transaction) {
        wx.miniapp.IAP.finishTransaction({
            transactionIdentifier: transaction.transactionIdentifier,
            success: () => console.log('交易已完成'),
            fail: (error) => console.error('完成交易失败:', error)
        });
    }

    /**
     * 请求商品信息
     */
    requestProducts(productIdentifiers) {
        return new Promise((resolve, reject) => {
            this.currentRequest = wx.miniapp.IAP.requestSKProducts({
                productIdentifiers: productIdentifiers,
                success: (ret) => {
                    resolve(ret.products);
                },
                fail: (error) => {
                    reject(error);
                }
            });
        });
    }

    /**
     * 发起支付
     */
    purchaseProduct(productIdentifier, options = {}) {
        return new Promise((resolve, reject) => {
            // 设置回调
            this.paymentSuccessCallback = resolve;
            this.paymentFailCallback = reject;

            const params = {
                productIdentifier: productIdentifier,
                quantity: options.quantity || 1,
                applicationUsername: options.applicationUsername || '',
                simulatesAskToBuyInSandbox: options.simulatesAskToBuyInSandbox || false,
                success: () => console.log('支付请求已发起'),
                fail: (error) => reject(error)
            };

            if (options.discount) {
                params.discount = options.discount;
            }

            wx.miniapp.IAP.addPaymentByProductIdentifiers(params);
        });
    }

    /**
     * 恢复购买
     */
    restorePurchases() {
        return new Promise((resolve, reject) => {
            this.restoreSuccessCallback = resolve;
            this.restoreFailCallback = reject;
            wx.miniapp.IAP.restoreCompletedTransactions({
                success: (ret) => {
                    console.log('恢复购买成功', ret);
                    // 这里不直接调用resolve，等待交易观察者的回调，否则vip.js将收到这里的回调
                    // if (this.restoreSuccessCallback) {
                    //     this.restoreSuccessCallback(ret);
                    // }
                },
                fail: (error) => {
                    console.error('恢复购买失败', error);
                    if (this.restoreFailCallback) {
                        this.restoreFailCallback(error);
                    }
                }
            });
        });
    }

    /**
     * 销毁实例
     */
    destroy() {
        if (this.transactionObserver) {
            console.log('removeTransactionObserver')
            wx.miniapp.IAP.removeTransactionObserver(this.transactionObserver);
        }
        if (this.currentRequest) {
            console.log('cancelRequestSKProducts')
            wx.miniapp.IAP.cancelRequestSKProducts(this.currentRequest);
        }
    }
}

export default ApplePayManager;