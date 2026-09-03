import {
  getXpayOrders
} from '../../../apis/xpay-api'
import {
  formatFen
} from '../../../utils/xpay'
import {
  formatDateTime,
  parseDate
} from '../../../utils/entitlement'
const { checkLoginAndNavigate } = require('../../../utils/util.js')

function formatRecordTime(value) {
  const date = parseDate(value)
  return date ? formatDateTime(date) : ''
}

function isVisibleRecord(item) {
  const status = Number(item.status ?? item.Status)
  if (status === 1) {
    return true
  }
  const text = item.statusText || item.StatusText || ''
  if (text === '已付款' || text === '已退款') {
    return true
  }
  return Boolean(item.deliveredDate || item.DeliveredDate)
}

Page({
  data: {
    loading: true,
    records: []
  },

  onShow() {
    if (!checkLoginAndNavigate()) {
      return
    }
    this.loadRecords()
  },

  async loadRecords() {
    this.setData({
      loading: true
    })
    try {
      const res = await getXpayOrders()
      const list = (Array.isArray(res.list) ? res.list : (res.List || [])).filter(isVisibleRecord)
      this.setData({
        loading: false,
        records: list.map((item) => ({
          outTradeNo: item.outTradeNo || item.OutTradeNo,
          name: item.name || item.Name || item.productId || '会员套餐',
          unit: item.unit || item.Unit || '',
          priceText: formatFen(item.goodsPrice || item.GoodsPrice || 0),
          status: item.status || item.Status,
          statusText: item.statusText || item.StatusText || (item.status === 1 ? '已付款' : '已关闭'),
          isRefunded: (item.status || item.Status) === 2,
          timeText: formatRecordTime(item.deliveredDate || item.DeliveredDate || item.paidDate || item.PaidDate)
        }))
      })
    } catch (error) {
      console.error('加载付款记录失败:', error)
      this.setData({
        loading: false
      })
      wx.showToast({
        title: '加载付款记录失败',
        icon: 'none'
      })
    }
  }
})
