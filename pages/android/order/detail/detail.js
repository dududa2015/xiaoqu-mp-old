// pages/android/order/detail/detail.js
import { queryOrder } from '../../../../apis/order-api'

Page({
  data: {
    orderNo: '',
    orderInfo: null,
    loading: true
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

      // 检查响应数据，支持多种可能的字段名
      if (response && (response.OutTradeNo || response.outTradeNo)) {
        // 直接使用 TradeState（微信支付状态）
        const tradeState = (response.TradeState || response.tradeState || 'NOTPAY').toUpperCase()

        // 获取时间信息（优先使用SuccessTime，如果为空则使用当前时间作为占位）
        const successTime = response.SuccessTime || response.successTime
        const timeForDisplay = successTime || new Date().toISOString()

        // 格式化订单信息
        const formattedInfo = {
          orderNo: response.OutTradeNo || response.outTradeNo || this.data.orderNo,
          totalAmount: response.Amount || response.amount || 0,
          amountText: this.formatAmount(response.Amount || response.amount || 0),
          status: tradeState,
          statusText: this.getStatusText({ status: tradeState }),
          createTime: this.formatTime(timeForDisplay),
          payTime: successTime ? this.formatTime(successTime) : '',
          completeTime: successTime ? this.formatTime(successTime) : '',
          productName: response.description,
          productDesc: this.getProductDescFromAttach(response.Attach || response.attach),
          memberType: this.getMemberTypeFromAttach(response.Attach || response.attach),
          quantity: 1,
          price: response.Amount || response.amount || 0,
          priceText: this.formatAmount(response.Amount || response.amount || 0),
          refundable: this.isRefundable({
            status: tradeState,
            successTime: successTime
          }),
          expireTime: successTime ? this.calculateExpireTime(
            successTime,
            this.getMemberTypeFromAttach(response.Attach || response.attach)
          ) : ''
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


  // 从Attach字段解析产品信息（Attach可能是JSON字符串）
  getProductNameFromAttach(attach) {
    if (!attach) return '会员订单'
    try {
      const attachObj = typeof attach === 'string' ? JSON.parse(attach) : attach
      const productId = attachObj.productId || attachObj.ProductId
      return this.getProductName(productId)
    } catch (e) {
      // 如果不是JSON，尝试直接作为产品ID
      return this.getProductName(attach)
    }
  },

  getProductDescFromAttach(attach) {
    if (!attach) return '会员订单'
    try {
      const attachObj = typeof attach === 'string' ? JSON.parse(attach) : attach
      const productId = attachObj.productId || attachObj.ProductId
      return this.getProductDesc(productId)
    } catch (e) {
      const productId = attach
      return this.getProductDesc(productId)
    }
  },

  getMemberTypeFromAttach(attach) {
    if (!attach) return 'monthly'
    try {
      const attachObj = typeof attach === 'string' ? JSON.parse(attach) : attach
      const productId = attachObj.productId || attachObj.ProductId
      return this.getMemberType(productId)
    } catch (e) {
      const productId = attach
      return this.getMemberType(productId)
    }
  },

  // 根据产品ID获取产品名称
  getProductName(productId) {
    if (!productId) return '会员订单'
    const productMap = {
      'com.louhao.xiaoqu.month': '月度会员',
      'com.louhao.xiaoqu.season': '季度会员',
      'com.louhao.xiaoqu.year': '年度会员',
      'com.louhao.xiaoqu.vip': 'VIP会员'
    }
    return productMap[productId] || productId || '会员订单'
  },

  // 根据产品ID获取产品描述
  getProductDesc(productId) {
    if (!productId) return '会员订单'
    const descMap = {
      'com.louhao.xiaoqu.month': '月度会员，有效期30天',
      'com.louhao.xiaoqu.season': '季度会员，有效期90天',
      'com.louhao.xiaoqu.year': '年度会员，有效期365天',
      'com.louhao.xiaoqu.vip': 'VIP会员，永久有效'
    }
    return descMap[productId] || '会员订单'
  },

  // 根据产品ID获取会员类型
  getMemberType(productId) {
    if (!productId) return 'monthly'
    const typeMap = {
      'com.louhao.xiaoqu.month': 'monthly',
      'com.louhao.xiaoqu.season': 'quarterly',
      'com.louhao.xiaoqu.year': 'yearly',
      'com.louhao.xiaoqu.vip': 'vip'
    }
    return typeMap[productId] || 'monthly'
  },

  // 获取订单状态文本（直接使用 TradeState）
  getStatusText(order) {
    const status = String(order.status).toUpperCase()
    const statusMap = {
      'NOTPAY': '待支付',      // 未支付
      'SUCCESS': '已支付',      // 已支付
      'CLOSED': '已关闭',      // 已关闭
      'REFUND': '已退款',       // 已退款
      'REVOKED': '已撤销',      // 已撤销
      'USERPAYING': '支付中',   // 用户支付中
      'PAYERROR': '支付失败'    // 支付失败
    }
    return statusMap[status] || '未知状态'
  },

  // 判断订单是否可退款
  isRefundable(order) {
    // 订单状态必须是已支付（SUCCESS）
    const status = String(order.status).toUpperCase()
    if (status !== 'SUCCESS') {
      return false
    }

    // 检查是否在7天内
    if (!order.successTime) {
      return false
    }

    const now = new Date()
    const successTime = new Date(order.successTime)
    const daysDiff = Math.floor((now - successTime) / (24 * 60 * 60 * 1000))

    return daysDiff <= 7
  },

  // 格式化金额
  formatAmount(amount) {
    if (!amount && amount !== 0) return '0.00'
    return (amount / 100).toFixed(2)
  },

  // 格式化时间（完整格式）
  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  // 计算会员到期时间
  calculateExpireTime(createTime, memberType) {
    if (!createTime || !memberType) return ''
    const createDate = new Date(createTime)
    let days = 30 // 默认30天

    if (memberType === 'quarterly') {
      days = 90
    } else if (memberType === 'yearly') {
      days = 365
    }

    const expireDate = new Date(createDate.getTime() + days * 24 * 60 * 60 * 1000)
    return this.formatTime(expireDate.toISOString())
  },

  // 申请退款
  onRefund() {
    if (this.data.orderInfo && this.data.orderInfo.refundable) {
      wx.navigateTo({
        url: `/pages/android/refund/refund?orderNo=${this.data.orderInfo.orderNo}&orderAmount=${this.data.orderInfo.totalAmount}`
      })
    } else {
      wx.showToast({
        title: '该订单暂不支持退款',
        icon: 'none'
      })
    }
  },

  // 复制订单号
  onCopyOrderNo() {
    wx.setClipboardData({
      data: this.data.orderNo,
      success: () => {
        wx.showToast({
          title: '订单号已复制',
          icon: 'success'
        })
      }
    })
  }
})

