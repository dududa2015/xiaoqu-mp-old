/**
 * Apple IAP 支付封装类
 * 支持：商品查询、支付、收据验证、交易恢复
 */
class AppleIAPManager {
    constructor() {
        this.isObserverAdded = false;
        this.pendingTransactions = new Map(); // 存储未完成的交易
    }

    /**
     * 初始化IAP模块（必须首先调用）
     */
    init() {
        return new Promise((resolve, reject) => {
            if (this.isObserverAdded) return resolve();

            // 添加交易监听
            wx.miniapp.IAP.addTransactionObserver({
                updatedTransactions: (args) => {
                    console.log('交易数据格式:', args.transactions);
                    args.transactions.forEach(t => this._handleTransaction(t));
                }
            });

            this.isObserverAdded = true;
            console.log('[IAP] 监听器已注册');
            resolve();
        });
    }

    /**
     * 查询商品信息
     * @param {Array<string>} productIds 商品ID数组
     */
    fetchProducts(productIds) {
        return new Promise((resolve, reject) => {
            wx.miniapp.IAP.requestSKProducts({
                productIdentifiers: productIds,
                success: (res) => {
                    const validProducts = res.products || [];
                    console.log('[IAP] 有效商品:', validProducts);
                    resolve(validProducts);
                },
                fail: (err) => {
                    console.error('[IAP] 获取商品失败:', err);
                    reject(err);
                }
            });
        });
    }

    /**
     * 发起支付
     * @param {string} productId 商品ID
     * @param {number} quantity 数量（默认1）
     */
    purchase(productId, quantity = 1) {
        return new Promise((resolve, reject) => {
            wx.miniapp.IAP.addPaymentByProductIdentifiers({
                productIdentifier: productId,
                quantity: quantity,
                success: () => {
                    console.log('[IAP] 支付已发起');
                    // 将交易暂存到pending队列
                    this.pendingTransactions.set(productId, {
                        resolve,
                        reject
                    });
                },
                fail: (err) => {
                    console.error('[IAP] 支付发起失败:', err);
                    reject(err);
                }
            });
        });
    }

    /**
     * 处理交易状态变更
     * @private
     */
    _handleTransaction(transaction) {
        const {
            id,
            productIdentifier,
            state,
            error
        } = transaction;

        console.log(`[IAP] 交易更新: ${productIdentifier} -> ${state}`);

        switch (state) {
            case 'purchased': // 支付成功
                this._verifyReceipt(productIdentifier, id)
                    .then(() => this._finishTransaction(id))
                    .catch(err => {
                        console.error('[IAP] 收据验证失败:', err);
                        this.pendingTransactions.get(productIdentifier)?.reject(err);
                    });
                break;

            case 'failed': // 支付失败
                console.error('[IAP] 支付失败:', error);
                this.pendingTransactions.get(productIdentifier)?.reject(error);
                this.pendingTransactions.delete(productIdentifier);
                this._finishTransaction(id);
                break;

            case 'restored': // 恢复购买
                console.log('[IAP] 已恢复购买:', productIdentifier);
                this._finishTransaction(id);
                break;
        }
    }

    /**
     * 验证支付收据（需实现自己的服务器验证）
     * @private
     */
    _verifyReceipt(productId, transactionId) {
        return new Promise((resolve, reject) => {
            wx.miniapp.IAP.getAppStoreReceiptData({
                success: async (res) => {
                    try {
                        // 示例：发送到自己的服务器验证
                        const verificationResult = await this._sendToServerForVerification(
                            res.receipt,
                            productId
                        );

                        if (verificationResult.valid) {
                            this.pendingTransactions.get(productId)?.resolve(transactionId);
                            this.pendingTransactions.delete(productId);
                            resolve();
                        } else {
                            reject(new Error('收据验证未通过'));
                        }
                    } catch (err) {
                        reject(err);
                    }
                },
                fail: (err) => reject(err)
            });
        });
    }

    /**
     * 发送收据到服务端验证（需自行实现）
     * @private
     */
    async _sendToServerForVerification(receiptData, productId) {
        // 示例：实际项目中替换为你的服务器API
        const response = await fetch('https://your-api.com/verify-receipt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                receipt: receiptData,
                productId: productId
            })
        });

        return response.json();
    }

    /**
     * 结束交易
     * @private
     */
    _finishTransaction(transactionId) {
        wx.miniapp.IAP.finishTransaction({
            transactionIdentifier: transactionId,
            success: () => console.log('[IAP] 交易已完成:', transactionId),
            fail: (err) => console.error('[IAP] 结束交易失败:', err)
        });
    }

    /**
     * 恢复购买
     */
    restorePurchases() {
        return new Promise((resolve, reject) => {
            wx.miniapp.IAP.restoreCompletedTransactions({
                success: () => resolve(),
                fail: (err) => reject(err)
            });
        });
    }

    /**
     * 清理资源
     */
    destroy() {
        if (this.isObserverAdded) {
            wx.miniapp.IAP.removeTransactionObserver();
            this.isObserverAdded = false;
        }
        this.pendingTransactions.clear();
    }
}

// 单例模式导出
export const iapManager = new AppleIAPManager();