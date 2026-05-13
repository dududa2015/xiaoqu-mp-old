// pages/android/order/detail/detail.js
import { queryOrder } from '../../../../apis/order-api'
import { rePayOrder } from '../../../../apis/wechatpay-apis'
import { 
  isRefundable, 
  formatAmount, 
  formatTimeShort, 
  formatTime,
  getTradeStateText,
  getProductNameFromAttach,
  getProductName
} from '../../../../utils/order-utils.js'

Page({
  data: {
    orderNo: '',
    orderInfo: null,
    loading: true,
    paying: false // 支付中状态
  },

  onLoad(options) {
    if (options.orderNo) {
      this.setData({
        orderNo: options.orderNo
      })
      this.loadOrderDetail()
    } else {
      wx.showToast({
        title: '订单号不能为空',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 加载订单详情（使用真实API）
  async loadOrderDetail() {
    this.setData({ loading: true })

    try {
      const response = await queryOrder({ outTradeNo: this.data.orderNo })

      console.log('订单详情响应:', response)

      // 检查响应数据
      if (response && response.outTradeNo) {
        // 从 Attach 解析产品信息
        const attach = response.Attach || response.attach
        const productName = getProductNameFromAttach(attach)
        const productId = this.getProductIdFromAttach(attach)
        const memberType = this.getMemberTypeFromProductId(productId)
        const memberDuration = this.getMemberDurationFromProductId(productId)
        
        // 计算到期时间
        const expireTime = this.calculateExpireTime(response.successTime, memberDuration)
        
        // 格式化订单信息
        const formattedInfo = {
          outTradeNo: response.outTradeNo || this.data.orderNo,
          tradeState: (response.tradeState || 'NOTPAY').toUpperCase(),
          amount: response.amount || 0,
          successTime: response.successTime || '',
          description: response.description || productName,
          createdDate: response.createdDate || '',
          attach: attach,
          // 产品信息
          productName: productName,
          productId: productId,
          memberType: memberType,
          memberDuration: memberDuration,
          expireTime: expireTime,
          expireTimeText: expireTime ? formatTime(expireTime) : '',
          // 用于显示的格式化字段
          amountText: formatAmount(response.amount || 0),
          statusText: getTradeStateText({ status: (response.tradeState || 'NOTPAY').toUpperCase() }),
          createTimeText: response.createdDate ? formatTime(response.createdDate) : '',
          payTimeText: response.successTime ? formatTime(response.successTime) : '',
          refundable: isRefundable({
            status: (response.tradeState || 'NOTPAY').toUpperCase(),
            successTime: response.successTime
          }),
          // 保存原始数据用于重新支付
          rawAmount: response.amount || 0,
          rawAttach: attach,
          rawProductId: productId
        }

        this.setData({
          orderInfo: formattedInfo,
          loading: false
        })
      } else {
        console.log('订单不存在，响应数据:', response)
        wx.showToast({
          title: response?.message || '订单不存在',
          icon: 'none',
          duration: 2000
        })
        this.setData({ loading: false })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    } catch (error) {
      console.error('加载订单详情失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      this.setData({ loading: false })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },





  // 申请退款
  onRefund() {
    if (this.data.orderInfo && this.data.orderInfo.refundable) {
      wx.navigateTo({
        url: `/pages/android/refund/refund?orderNo=${this.data.orderInfo.outTradeNo}&orderAmount=${this.data.orderInfo.amount}`
      })
    } else {
      wx.showToast({
        title: '该订单暂不支持退款',
        icon: 'none'
      })
    }
  },

  // 立即支付（待支付订单）
  async onPay() {
    if (!this.data.orderInfo) {
      return
    }

    if (this.data.paying) {
      return // 防止重复点击
    }

    this.setData({ paying: true })

    try {
      wx.showLoading({
        title: '正在获取支付参数...',
        mask: true
      })

      // 使用 RePayOrder 接口重新获取支付参数
      const data = await rePayOrder(this.data.orderInfo.outTradeNo)
      console.log('重新支付订单响应:', data)

      wx.hideLoading()
      this.requestPayment(data)
    } catch (error) {
      console.error('获取支付参数失败:', error)
      wx.hideLoading()
      this.setData({ paying: false })
      
      // 处理后端返回的错误信息
      let errorMessage = '获取支付参数失败，请重试'
      if (error && error.response) {
        const errorData = error.response.data || error.response
        if (errorData.code === 'ORDERPAID') {
          errorMessage = '订单已支付，无需重复支付'
          // 支付成功后刷新订单详情
          setTimeout(() => {
            this.loadOrderDetail()
          }, 1500)
        } else if (errorData.code === 'ORDERCLOSED') {
          errorMessage = '订单已关闭，无法支付'
        } else if (errorData.code === 'ORDERNOTFOUND') {
          errorMessage = '订单不存在'
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      } else if (error && error.message) {
        errorMessage = error.message
      }

      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 发起支付
  requestPayment(data) {
    if (!data || !data.prepayId) {
      this.setData({ paying: false })
      wx.showToast({
        title: '订单创建失败',
        icon: 'none'
      })
      return
    }

    wx.miniapp.requestPayment({
      mchId: '1112580418', // 商户号
      prepayId: data.prepayId,
      nonceStr: data.nonceStr,
      package: 'Sign=WXPay',
      timeStamp: data.timeStamp,
      sign: data.paySign,
      success: (res) => {
        console.log('支付成功:', res)
        this.setData({ paying: false })
        wx.showModal({
          content: '支付成功',
          showCancel: false,
          confirmText: '好的',
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 重新加载订单详情
              this.loadOrderDetail()
            }
          }
        })
      },
      fail: (res) => {
        console.error('支付失败:', res)
        this.setData({ paying: false })
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

  // 复制订单号
  onCopyOrderNo() {
    const orderNo = this.data.orderInfo?.outTradeNo || this.data.orderNo
    wx.setClipboardData({
      data: orderNo,
      success: () => {
        wx.showToast({
          title: '订单号已复制',
          icon: 'success'
        })
      }
    })
  },

  // 从 Attach 获取产品ID
  getProductIdFromAttach(attach) {
    if (!attach) return ''
    try {
      const attachObj = typeof attach === 'string' ? JSON.parse(attach) : attach
      return attachObj.productId || attachObj.ProductId || ''
    } catch (e) {
      return ''
    }
  },

  // 根据产品ID获取会员类型
  getMemberTypeFromProductId(productId) {
    if (!productId) return '会员订单'
    return getProductName(productId)
  },

  // 根据产品ID获取会员期限（天数）
  getMemberDurationFromProductId(productId) {
    if (!productId) return 0
    const durationMap = {
      'com.louhao.xiaoqu.month': 30,
      'com.louhao.xiaoqu.season': 90,
      'com.louhao.xiaoqu.year': 365,
      'com.louhao.xiaoqu.vip': 365
    }
    return durationMap[productId] || 0
  },

  // 计算到期时间
  calculateExpireTime(successTime, durationDays) {
    if (!successTime || !durationDays) return ''
    try {
      const payTime = new Date(successTime)
      const expireTime = new Date(payTime.getTime() + durationDays * 24 * 60 * 60 * 1000)
      return expireTime.toISOString()
    } catch (e) {
      return ''
    }
  }
})

