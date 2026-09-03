import {
  getXpayOrders,
  refundXpayOrder
} from '../../../apis/xpay-api'
import {
  formatFen
} from '../../../utils/xpay'
import {
  formatDateTime,
  parseDate,
  refresh as refreshEntitlement
} from '../../../utils/entitlement'
const { checkLoginAndNavigate } = require('../../../utils/util.js')

function formatRecordTime(value) {
  const date = parseDate(value)
  return date ? formatDateTime(date) : ''
}

function resolveIsIos() {
  try {
    const info = wx.getDeviceInfo ? wx.getDeviceInfo() : wx.getSystemInfoSync()
    return String(info.platform || '').toLowerCase() === 'ios'
  } catch (e) {
    return false
  }
}

function pickNum(...values) {
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    if (value !== undefined && value !== null && value !== '') {
      return Number(value) || 0
    }
  }
  return 0
}

function mapOrder(item, isIos) {
  const refundable = !!(item.refundable || item.Refundable)
  const goodsPrice = pickNum(item.goodsPrice, item.GoodsPrice)
  const usedDays = pickNum(item.usedDays, item.UsedDays)
  const deductionAmount = pickNum(item.deductionAmount, item.DeductionAmount)
  const refundAmountRaw = item.refundAmount ?? item.RefundAmount
  const refundAmount = refundAmountRaw == null ? goodsPrice : (Number(refundAmountRaw) || 0)
  return {
    outTradeNo: item.outTradeNo || item.OutTradeNo,
    name: item.name || item.Name || item.productId || '会员套餐',
    unit: item.unit || item.Unit || '',
    priceText: formatFen(goodsPrice),
    usedDays,
    deductionAmountText: formatFen(deductionAmount),
    refundAmountText: formatFen(refundAmount),
    status: item.status || item.Status,
    statusText: item.statusText || item.StatusText || '',
    timeText: formatRecordTime(item.deliveredDate || item.DeliveredDate || item.paidDate || item.PaidDate),
    refundable: refundable && !isIos,
    refundTip: isIos && refundable
      ? 'iOS 请前往 App Store 申请退款'
      : (item.refundTip || item.RefundTip || '')
  }
}

Page({
  data: {
    loading: true,
    submitting: false,
    isIos: false,
    displayOrder: null
  },

  onShow() {
    if (!checkLoginAndNavigate()) {
      return
    }
    this.loadOrder()
  },

  async loadOrder() {
    this.setData({
      loading: true
    })
    try {
      const res = await getXpayOrders()
      const list = Array.isArray(res.list) ? res.list : (res.List || [])
      const isIos = resolveIsIos()
      const orders = list.map((item) => mapOrder(item, isIos))
      const displayOrder = orders.find((item) => item.refundable) || orders[0] || null
      this.setData({
        loading: false,
        isIos,
        displayOrder
      })
    } catch (error) {
      console.error('加载退款订单失败:', error)
      this.setData({
        loading: false,
        displayOrder: null
      })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  onSubmit() {
    const order = this.data.displayOrder
    if (!order || !order.refundable || this.data.submitting) {
      wx.showToast({
        title: (order && order.refundTip) || '当前暂无可退款记录',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认退款',
      content: `确定退款「${order.name}」¥${order.refundAmountText}？退款后将扣回对应会员时长。`,
      confirmText: '确认退款',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.submitRefund(order.outTradeNo)
        }
      }
    })
  },

  async submitRefund(outTradeNo) {
    this.setData({
      submitting: true
    })
    wx.showLoading({
      title: '正在退款...',
      mask: true
    })
    try {
      const res = await refundXpayOrder(outTradeNo)
      wx.hideLoading()
      wx.showToast({
        title: (res && (res.message || res.Message)) || '退款已提交',
        icon: 'none'
      })
      await refreshEntitlement({ force: true })
      await this.loadOrder()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: (error && (error.message || error.errMsg)) || '退款失败',
        icon: 'none'
      })
    } finally {
      this.setData({
        submitting: false
      })
    }
  }
})
