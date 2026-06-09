import {
  getDeductOrders
} from '../../../apis/wechatpay-papay-apis'
import {
  formatAmount
} from '../../../utils/order-utils.js'

const { checkLoginAndNavigate } = require('../../../utils/util.js')

function getDeductStatusText(status) {
  const upper = (status || '').toUpperCase()
  const map = {
    SUCCESS: '扣款成功',
    REFUNDED: '已退款',
    REFUNDING: '退款中',
    PROCESSING: '处理中'
  }
  return map[upper] || '扣款成功'
}

function mapDeductOrder(item) {
  const outTradeNo = item.outTradeNo || item.OutTradeNo || ''
  const amount = item.amount ?? item.Amount ?? 0
  const status = (item.status || item.Status || '').toUpperCase()

  return {
    outTradeNo,
    planName: item.planName || item.PlanName || '自动续费会员',
    amountText: formatAmount(amount),
    successTime: item.successTime || item.SuccessTime || '',
    status,
    statusText: getDeductStatusText(status),
    isRefunded: status === 'REFUNDED'
  }
}

function sortBySuccessTimeDesc(list) {
  return list.slice().sort((a, b) => {
    const timeA = a.successTime || ''
    const timeB = b.successTime || ''
    return timeB.localeCompare(timeA)
  })
}

Page({
  data: {
    loading: true,
    orderList: []
  },

  onShow() {
    if (!checkLoginAndNavigate('navigateTo')) {
      return
    }
    this.loadOrders()
  },

  onPullDownRefresh() {
    this.loadOrders(true)
  },

  async loadOrders(fromPullDown = false) {
    const userId = wx.getStorageSync('userId')
    if (!userId) {
      this.setData({
        loading: false,
        orderList: []
      })
      if (fromPullDown) {
        wx.stopPullDownRefresh()
      }
      return
    }

    if (!fromPullDown) {
      this.setData({ loading: true })
    }

    try {
      const response = await getDeductOrders(userId)
      const list = Array.isArray(response) ? response : []
      const orderList = sortBySuccessTimeDesc(list.map(mapDeductOrder))
      this.setData({
        orderList,
        loading: false
      })
    } catch (error) {
      console.error('加载扣费记录失败:', error)
      this.setData({
        loading: false
      })
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    } finally {
      if (fromPullDown) {
        wx.stopPullDownRefresh()
      }
    }
  }
})
