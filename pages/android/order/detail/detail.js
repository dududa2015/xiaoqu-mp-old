// pages/android/order/detail/detail.js
import { queryOrder } from '../../../../apis/order-api'
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
          createTimeText: response.createdDate ? formatTimeShort(response.createdDate) : '',
          payTimeText: response.successTime ? formatTimeShort(response.successTime) : '',
          refundable: isRefundable({
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

