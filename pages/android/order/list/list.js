// pages/android/order/list/list.js
import { getOrdersByUserId } from '../../../../apis/order-api'

Page({
  data: {
    orderList: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    statusFilter: '', // 状态筛选：''-全部, '0'-待支付, '1'-已支付, '2'-已关闭, '3'-已退款, '4'-退款中, '5'-支付失败, 'refundable'-可退款
    statusOptions: [
      { label: '全部', value: '' }
    ],
    allOrders: [], // 所有订单数据
    totalCount: 0 // 当前筛选状态下的订单总数
  },

  onLoad() {
    const statusFilter = this.data.statusFilter
    this.setData({
      emptyText: this.getEmptyText(statusFilter),
      emptyDesc: this.getEmptyDesc(statusFilter)
    })
  },

  onShow() {
    this.loadOrderList(true)
  },

  onPullDownRefresh() {
    this.loadOrderList(true)
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadOrderList(false)
    }
  },

  // 加载订单列表（使用真实API）
  async loadOrderList(refresh = false) {
    if (this.data.loading) {
      return
    }

    const userId = wx.getStorageSync('userId')
    if (!userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      this.setData({ loading: false })
      if (refresh) {
        wx.stopPullDownRefresh()
      }
      return
    }

    const page = refresh ? 1 : this.data.page
    this.setData({ loading: true })

    try {
      // 如果是刷新，重新获取所有订单
      if (refresh) {
        const response = await getOrdersByUserId({ userId: userId })

        if (response && Array.isArray(response)) {
          // 转换后端数据格式为前端格式
          const convertedOrders = response.map(order => this.convertOrderFromApi(order))
          this.setData({ allOrders: convertedOrders })
          
          // 根据实际订单状态生成筛选选项
          this.updateStatusOptions(convertedOrders)
        } else {
          this.setData({ allOrders: [] })
          this.setData({ statusOptions: [{ label: '全部', value: '' }] })
        }
      }

      // 筛选订单
      let filteredOrders = this.data.allOrders.slice()

      if (this.data.statusFilter) {
        if (this.data.statusFilter === 'refundable') {
          // 可退款：状态为1（已支付）且可退款
          filteredOrders = filteredOrders.filter(order => {
            const status = String(order.status)
            return status === '1' && this.isRefundable(order)
          })
        } else {
          // 根据状态码筛选
          filteredOrders = filteredOrders.filter(order => {
            const status = String(order.status)
            return status === this.data.statusFilter
          })
        }
      }

      // 分页处理
      const startIndex = (page - 1) * this.data.pageSize
      const endIndex = startIndex + this.data.pageSize
      const newList = filteredOrders.slice(startIndex, endIndex)

      // 处理订单数据，添加格式化字段
      const processedList = newList.map(order => {
        const status = String(order.status)
        return {
          orderNo: order.outTradeNo,
          totalAmount: order.amount,
          amount: order.amount,
          status: status,
          createTime: order.createdDate || order.createTime,
          productName: order.description || '会员订单',
          refundable: this.isRefundable(order),
          statusText: this.getStatusText({ status: status }),
          amountText: this.formatAmount(order.amount),
          timeText: this.formatTime(order.createdDate || order.createTime),
          canRefund: this.isRefundable(order)
        }
      })

      const statusFilter = this.data.statusFilter
      this.setData({
        orderList: refresh ? processedList : this.data.orderList.concat(processedList),
        page: page + 1,
        hasMore: endIndex < filteredOrders.length,
        totalCount: filteredOrders.length, // 更新总数
        emptyText: this.getEmptyText(statusFilter), // 更新空状态文案
        emptyDesc: this.getEmptyDesc(statusFilter) // 更新空状态描述
      })

      this.setData({ loading: false })
      if (refresh) {
        wx.stopPullDownRefresh()
      }
    } catch (error) {
      console.error('加载订单列表失败:', error)
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      this.setData({ loading: false })
      if (refresh) {
        wx.stopPullDownRefresh()
      }
    }
  },

  // 状态筛选
  onStatusFilter(e) {
    const value = e.detail.value
    if (this.data.statusFilter === value) {
      return
    }

    this.setData({
      statusFilter: value,
      page: 1,
      orderList: [],
      totalCount: 0,
      emptyText: this.getEmptyText(value),
      emptyDesc: this.getEmptyDesc(value)
    })
    this.loadOrderList(true)
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止事件冒泡
  },

  // 根据订单列表中的实际状态更新筛选选项
  updateStatusOptions(orders) {
    if (!orders || orders.length === 0) {
      this.setData({ statusOptions: [{ label: '全部', value: '' }] })
      return
    }

    // 统计所有存在的状态
    const statusSet = new Set()
    let hasRefundable = false

    orders.forEach(order => {
      const status = String(order.status)
      statusSet.add(status)
      
      // 检查是否有可退款的订单
      if (status === '1' && this.isRefundable(order)) {
        hasRefundable = true
      }
    })

    // 状态映射
    const statusMap = {
      '0': '待支付',
      '1': '已支付',
      '2': '已关闭',
      '3': '已退款',
      '4': '退款中',
      '5': '支付失败'
    }

    // 生成筛选选项
    const options = [{ label: '全部', value: '' }]
    
    // 按状态码顺序添加选项
    const statusOrder = ['0', '1', '2', '3', '4', '5']
    statusOrder.forEach(status => {
      if (statusSet.has(status)) {
        options.push({
          label: statusMap[status] || `状态${status}`,
          value: status
        })
      }
    })

    // 如果有可退款的订单，添加"可退款"选项
    if (hasRefundable) {
      options.push({
        label: '可退款',
        value: 'refundable'
      })
    }

    this.setData({ statusOptions: options })
  },

  // 转换API返回的订单数据格式
  convertOrderFromApi(apiOrder) {
    return {
      outTradeNo: apiOrder.OutTradeNo || apiOrder.outTradeNo,
      userId: apiOrder.UserId || apiOrder.userId,
      productId: apiOrder.ProductId || apiOrder.productId,
      description: apiOrder.Description || apiOrder.description,
      amount: apiOrder.Amount || apiOrder.amount || 0,
      attach: apiOrder.Attach || apiOrder.attach,
      transactionId: apiOrder.TransactionId || apiOrder.transactionId,
      status: apiOrder.Status || apiOrder.status || '0',
      createdDate: apiOrder.CreatedDate || apiOrder.createdDate,
      successTime: apiOrder.SuccessTime || apiOrder.successTime
    }
  },

  // 判断订单是否可退款（会员订单：7天内可退款）
  isRefundable(order) {
    // 订单状态必须是已支付（status === '1'）
    const status = String(order.status)
    if (status !== '1') {
      return false
    }

    // 检查是否在7天内（使用创建时间或支付成功时间）
    const now = new Date()
    const timeToCheck = order.successTime || order.createdDate || order.createTime
    if (!timeToCheck) {
      return false
    }

    const checkTime = new Date(timeToCheck)
    const daysDiff = Math.floor((now - checkTime) / (24 * 60 * 60 * 1000))

    return daysDiff <= 7
  },

  // 获取订单状态文本
  getStatusText(order) {
    const status = String(order.status)
    const statusMap = {
      '0': '待支付',      // 未支付
      '1': '已支付',      // 已支付
      '2': '已关闭',      // 已关闭
      '3': '已退款',      // 已退款
      '4': '退款中',      // 退款中
      '5': '支付失败'     // 其他/错误
    }
    return statusMap[status] || '未知状态'
  },

  // 格式化金额
  formatAmount(amount) {
    if (!amount && amount !== 0) return '0.00'
    return (amount / 100).toFixed(2)
  },

  // 格式化时间（完整格式：年月日时分秒）
  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    const second = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  },

  // 获取空状态文案
  getEmptyText(statusFilter = '') {
    if (!statusFilter) {
      return '暂无订单'
    }
    
    if (statusFilter === 'refundable') {
      return '暂无可退款订单'
    }
    
    const statusMap = {
      '0': '暂无待支付订单',
      '1': '暂无已支付订单',
      '2': '暂无已关闭订单',
      '3': '暂无已退款订单',
      '4': '暂无退款中订单',
      '5': '暂无支付失败订单'
    }
    return statusMap[statusFilter] || '暂无订单'
  },

  // 获取空状态描述
  getEmptyDesc(statusFilter = '') {
    if (statusFilter) {
      return '试试切换其他筛选条件'
    }
    return '您还没有任何订单记录'
  },

  // 查看订单详情（整个卡片可点击）
  onViewDetail(e) {
    const orderNo = e.currentTarget.dataset.orderNo
    wx.navigateTo({
      url: `/pages/android/order/detail/detail?orderNo=${orderNo}`
    })
  }
})

