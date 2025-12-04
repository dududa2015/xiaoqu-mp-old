// pages/android/order/list/list.js
import { getOrdersByUserId } from '../../../../apis/order-api'
import { 
  isRefundable, 
  formatAmount, 
  formatTime, 
  getStatusText, 
  getProductNameFromAttach,
  convertOrderFromApi
} from '../../../../utils/order-utils.js'

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
    totalCount: 0 // 当前筛选状态下的订单总数
  },

  onLoad() {
    const statusFilter = this.data.statusFilter
    this.setData({
      emptyText: this.getEmptyText(statusFilter),
      emptyDesc: this.getEmptyDesc(statusFilter)
    })
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

  // 加载订单列表（使用后端分页）
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
      // 构建请求参数
      const requestParams = {
        userId: userId,
        page: page,
        pageSize: this.data.pageSize
      }

      // 如果后端支持状态筛选，可以在这里添加状态参数
      // 例如：if (this.data.statusFilter) { requestParams.status = this.data.statusFilter }

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

      // 转换后端数据格式为前端格式
      let convertedOrders = orders.map(order => convertOrderFromApi(order))

      // 前端筛选（如果后端不支持状态筛选）
      if (this.data.statusFilter) {
        if (this.data.statusFilter === 'refundable') {
          // 可退款：状态为1（已支付）且可退款
          convertedOrders = convertedOrders.filter(order => {
            const status = String(order.status)
            return status === '1' && isRefundable(order)
          })
        } else {
          // 根据状态码筛选
          convertedOrders = convertedOrders.filter(order => {
            const status = String(order.status)
            return status === this.data.statusFilter
          })
        }
      }

      // 如果是刷新第一页，需要获取筛选选项（获取前100条数据用于生成筛选选项）
      if (refresh && page === 1) {
        const firstPageResponse = await getOrdersByUserId({
          userId: userId,
          page: 1,
          pageSize: 100
        })
        
        let allOrdersForFilter = []
        if (firstPageResponse && Array.isArray(firstPageResponse)) {
          allOrdersForFilter = firstPageResponse.map(order => convertOrderFromApi(order))
        } else if (firstPageResponse && firstPageResponse.data && Array.isArray(firstPageResponse.data)) {
          allOrdersForFilter = firstPageResponse.data.map(order => convertOrderFromApi(order))
        } else if (firstPageResponse && firstPageResponse.list && Array.isArray(firstPageResponse.list)) {
          allOrdersForFilter = firstPageResponse.list.map(order => convertOrderFromApi(order))
        }
        
        this.updateStatusOptions(allOrdersForFilter)
      }

      // 处理订单数据，添加格式化字段
      const processedList = convertedOrders.map(order => {
        const status = String(order.status)
        // 从 attach 中解析产品ID
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
          refundable: isRefundable(order),
          statusText: getStatusText({ status: status }),
          amountText: formatAmount(order.amount),
          timeText: formatTime(order.createdDate || order.createTime),
          canRefund: isRefundable(order),
          // 保存用于支付的数据
          productId: productId,
          description: order.description || getProductNameFromAttach(order.attach) || '会员订单'
        }
      })

      // 判断是否还有更多数据：如果返回的数据量小于pageSize，说明没有更多数据了
      const hasMore = orders.length >= this.data.pageSize

      const statusFilter = this.data.statusFilter
      this.setData({
        orderList: refresh ? processedList : this.data.orderList.concat(processedList),
        page: page + 1,
        hasMore: hasMore,
        totalCount: totalCount || (refresh ? processedList.length : this.data.totalCount + processedList.length),
        emptyText: this.getEmptyText(statusFilter),
        emptyDesc: this.getEmptyDesc(statusFilter)
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

