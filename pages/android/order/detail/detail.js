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

  onShow() {
    if (this.data.orderNo) {
      this.loadOrderDetail()
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
        // 格式化订单信息，只保留必要字段
        const formattedInfo = {
          outTradeNo: response.outTradeNo || this.data.orderNo,
          tradeState: (response.tradeState || 'NOTPAY').toUpperCase(),
          amount: response.amount || 0,
          successTime: response.successTime || '',
          description: response.description || '',
          createdDate: response.createdDate || '',
          // 用于显示的格式化字段
          amountText: this.formatAmount(response.amount || 0),
          statusText: this.getStatusText({ status: (response.tradeState || 'NOTPAY').toUpperCase() }),
          createTimeText: response.createdDate ? this.formatTime(response.createdDate) : '',
          payTimeText: response.successTime ? this.formatTime(response.successTime) : '',
          refundable: this.isRefundable({
            status: (response.tradeState || 'NOTPAY').toUpperCase(),
            successTime: response.successTime
          })
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
    // 处理 createdDate 格式 "2025/12/03 21:45:54"，转换为标准格式
    let normalizedTime = timeStr
    if (timeStr.includes('/')) {
      normalizedTime = timeStr.replace(/\//g, '-')
    }
    const date = new Date(normalizedTime)
    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return timeStr // 如果解析失败，返回原始字符串
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
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
  }
})

