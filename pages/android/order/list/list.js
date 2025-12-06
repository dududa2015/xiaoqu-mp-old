// pages/android/order/list/list.js
import { getOrdersByUserId } from '../../../../apis/order-api'
import { 
  isRefundable, 
  formatAmount, 
  formatTime, 
  getProductNameFromAttach,
  convertOrderFromApi,
  getStatusText
} from '../../../../utils/order-utils.js'

Page({
  data: {
    // 展示数据（当前标签）
    orderList: [],
    loading: false,
    hasMore: true,
    page: 1,
    currentScrollTop: 0,
    pageSize: 10,
    statusFilter: '', // 状态筛选：''-全部, '0'-待支付, '1'-已支付, '2'-已关闭, '3'-已退款, '4'-退款中, '5'-支付失败, 'refundable'-可退款
    statusOptions: [
      { label: '全部', value: '' }
    ],
    totalCount: 0, // 当前筛选状态下的订单总数
    emptyText: '',
    emptyDesc: '',
    // 按状态缓存
    orderDataMap: {},
    // 滚动位置缓存
    scrollMap: {}
  },

  // 获取或初始化指定状态的数据
  getOrderData(statusFilter = '') {
    const key = statusFilter || ''
    if (!this.data.orderDataMap[key]) {
      this.data.orderDataMap[key] = {
        orderList: [],
        loading: false,
        hasMore: true,
        page: 1,
        totalCount: 0,
        emptyText: this.getEmptyText(statusFilter),
        emptyDesc: this.getEmptyDesc(statusFilter)
      }
    }
    return this.data.orderDataMap[key]
  },

  // 同步展示数据
  updateDisplay(statusFilter = '') {
    const data = this.getOrderData(statusFilter)
    this.setData({
      orderList: data.orderList,
      loading: data.loading,
      hasMore: data.hasMore,
      page: data.page,
      totalCount: data.totalCount,
      emptyText: data.emptyText,
      emptyDesc: data.emptyDesc,
      currentScrollTop: this.data.scrollMap[statusFilter || ''] || 0
    })
  },

  onLoad() {
    const statusFilter = this.data.statusFilter
    this.getOrderData(statusFilter)
    this.updateDisplay(statusFilter)
    this.loadOrderList(true)
  },

  onPullDownRefresh() {
    this.loadOrderList(true)
  },

  onReachBottom() {
    const current = this.getOrderData(this.data.statusFilter)
    if (current.hasMore && !current.loading) {
      this.loadOrderList(false)
    }
  },

  // 记录滚动位置
  onScroll(e) {
    const key = this.data.statusFilter || ''
    const top = e.detail.scrollTop || 0
    this.data.scrollMap[key] = top
  },

  // 加载订单列表（使用后端分页）
  async loadOrderList(refresh = false) {
    const statusFilter = this.data.statusFilter
    const currentData = this.getOrderData(statusFilter)

    if (currentData.loading) {
      return
    }

    const userId = wx.getStorageSync('userId')
    if (!userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      this.setData({ [`orderDataMap.${statusFilter || ''}.loading`]: false })
      this.updateDisplay(statusFilter)
      if (refresh) {
        wx.stopPullDownRefresh()
      }
      return
    }

    const page = refresh ? 1 : currentData.page
    this.setData({ 
      [`orderDataMap.${statusFilter || ''}.loading`]: true 
    })

    try {
      // 构建请求参数
      const requestParams = {
        userId: userId,
        page: page,
        pageSize: this.data.pageSize
      }

      // 后端支持状态筛选则透传（refundable 前端处理）
      if (statusFilter && statusFilter !== 'refundable') {
        requestParams.status = statusFilter
      }

      // 调用后端分页API
      const response = await getOrdersByUserId(requestParams)

      // 处理响应数据
      let orders = []
      let totalCount = 0

      if (response && Array.isArray(response)) {
        // 如果后端返回的是数组，说明是订单列表
        orders = response
      } else if (response && response.data && Array.isArray(response.data)) {
        // 如果后端返回的是对象，包含data和totalCount
        orders = response.data
        totalCount = response.totalCount || response.total || 0
      } else if (response && response.list && Array.isArray(response.list)) {
        // 如果后端返回的是对象，包含list字段
        orders = response.list
        totalCount = response.totalCount || response.total || 0
      }

      // 转换后端数据格式为前端格式（完整列表用于构建筛选项）
      const convertedOrdersAll = orders.map(order => convertOrderFromApi(order))

      // 基于完整列表生成处理结果（用于更新筛选项与展示）
      const buildProcessedList = sourceOrders => sourceOrders.map(order => {
        const status = String(order.status || '0')
        const normalizedOrder = { ...order, status }
        let productId = ''
        try {
          const attach = order.attach
          if (attach) {
            const attachObj = typeof attach === 'string' ? JSON.parse(attach) : attach
            productId = attachObj.productId || attachObj.ProductId || ''
          }
        } catch (e) {
          console.error('解析attach失败:', e)
        }
        return {
          orderNo: order.outTradeNo,
          totalAmount: order.amount,
          amount: order.amount,
          status: status,
          createTime: order.createdDate || order.createTime,
          productName: order.description || getProductNameFromAttach(order.attach) || '会员订单',
          refundable: isRefundable(normalizedOrder),
          // 状态文案以列表状态码为准
          statusText: getStatusText({ status }),
          amountText: formatAmount(order.amount),
          timeText: formatTime(order.createdDate || order.createTime),
          canRefund: isRefundable(normalizedOrder),
          productId: productId,
          description: order.description || getProductNameFromAttach(order.attach) || '会员订单'
        }
      })

      // 处理订单数据（完整列表，用于筛选项和筛选操作）
      const processedListAll = buildProcessedList(convertedOrdersAll)

      // 根据当前筛选条件过滤（基于后端真实状态）
      let processedSource = convertedOrdersAll
      if (this.data.statusFilter) {
        if (this.data.statusFilter === 'refundable') {
          processedSource = convertedOrdersAll.filter(order => {
            const status = String(order.status || '0')
            return status === '1' && isRefundable(order)
          })
        } else {
          processedSource = convertedOrdersAll.filter(order => {
            const status = String(order.status || '0')
            return status === this.data.statusFilter
          })
        }
      }
      const processedList = buildProcessedList(processedSource)

      // 只有在「全部」标签下首屏刷新时，才根据完整数据更新筛选项，保证筛选数量稳定
      if (refresh && page === 1 && !statusFilter) {
        this.updateStatusOptions(convertedOrdersAll)
      }

      // 判断是否还有更多数据
      // 普通状态：如果返回的数据量小于 pageSize，说明没有更多数据了
      // 「可退款」：如果本页没有筛选出任何可退款订单，则认为当前筛选已经没有更多数据
      let hasMore
      if (statusFilter === 'refundable') {
        if (processedList.length === 0) {
          hasMore = false
        } else {
          hasMore = orders.length >= this.data.pageSize
        }
      } else {
        hasMore = orders.length >= this.data.pageSize
      }

      const key = statusFilter || ''
      const existing = refresh ? [] : currentData.orderList
      const finalList = refresh ? processedList : existing.concat(processedList)

      // 计算当前筛选下的总数
      let finalTotalCount
      if (statusFilter === 'refundable') {
        // 可退款：只能根据前端筛选结果累加，不能用后端 totalCount（后端返回的是全部订单数）
        finalTotalCount = refresh
          ? processedList.length
          : (currentData.totalCount || 0) + processedList.length
      } else {
        // 其他状态优先使用后端 totalCount（如果提供），否则按已加载数量累加
        finalTotalCount = totalCount || (refresh
          ? processedList.length
          : (currentData.totalCount || 0) + processedList.length)
      }

      // 写回缓存
      this.data.orderDataMap[key] = {
        orderList: finalList,
        loading: false,
        hasMore,
        page: page + 1,
        totalCount: finalTotalCount,
        emptyText: this.getEmptyText(statusFilter),
        emptyDesc: this.getEmptyDesc(statusFilter)
      }

      // 同步到展示
      this.updateDisplay(statusFilter)

      if (refresh) {
        wx.stopPullDownRefresh()
      }
    } catch (error) {
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
      this.setData({ [`orderDataMap.${statusFilter || ''}.loading`]: false })
      this.updateDisplay(statusFilter)
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

    // 确保缓存存在
    this.getOrderData(value)

    // 切换状态，先展示缓存
    this.setData({ statusFilter: value })
    this.updateDisplay(value)

    // 未加载过则请求
    const data = this.getOrderData(value)
    if (data.orderList.length === 0 && !data.loading) {
      this.loadOrderList(true)
    }
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
      if (status === '1' && isRefundable(order)) {
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

