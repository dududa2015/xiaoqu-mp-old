// pages/android/refund/refund.js
import { queryOrder } from '../../../apis/order-api.js'
import { applyRefund } from '../../../apis/refund-api.js'

Page({
  data: {
    orderNo: '',
    refundAmount: '',
    refundReason: '',
    reasonList: [
      '不想要了',
      '商品信息填错了',
      '重复下单',
      '其他原因'
    ],
    selectedReasonIndex: -1,
    customReason: '',
    showCustomReason: false,
    orderInfo: null, // 订单信息
    loading: false, // 是否正在加载
    maxRefundAmount: 0, // 最大可退款金额（单位：分）
    maxRefundAmountText: '', // 最大可退款金额文本（格式化后）
    orderAmountText: '', // 订单金额文本（格式化后）
    usedDays: 0, // 已使用天数
    deductionAmount: 0, // 扣除金额（单位：分）
    deductionAmountText: '0.00', // 扣除金额文本
    canRefund: true, // 是否可退款（7天内）
    refundTip: '' // 退款提示
  },

  onLoad(options) {
    // 如果从其他页面传入订单号，自动填充并查询订单信息
    if (options.orderNo) {
      this.setData({
        orderNo: options.orderNo
      })
      // 统一通过查询接口获取订单信息，以便计算退款金额
      this.queryOrderInfo()
    }
  },

  // 输入订单号
  onOrderNoInput(e) {
    const value = e.detail.value || e.detail
    this.setData({
      orderNo: value,
      orderInfo: null,
      maxRefundAmount: 0,
      maxRefundAmountText: '',
      orderAmountText: ''
    })
  },

  // 查询订单信息（使用真实API）
  async queryOrderInfo() {
    const orderNo = this.data.orderNo.trim()
    if (!orderNo) {
      return
    }

    this.setData({ loading: true })

    try {
      const response = await queryOrder({ outTradeNo: orderNo })
      
      console.log('退款页面查询订单响应:', response)
      
      // 检查响应数据，支持多种可能的字段名
      if (response && (response.OutTradeNo || response.outTradeNo)) {
        const now = new Date()
        const totalAmount = response.Amount || response.amount || 0
        const successTime = response.SuccessTime || response.successTime
        
        // 检查订单状态
        const tradeState = response.TradeState || response.tradeState
        if (tradeState !== 'SUCCESS') {
          wx.showToast({
            title: '订单未支付，无法退款',
            icon: 'none',
            duration: 2000
          })
          this.setData({
            orderInfo: null,
            loading: false
          })
          return
        }

        if (!successTime) {
          wx.showToast({
            title: '订单信息不完整',
            icon: 'none',
            duration: 2000
          })
          this.setData({
            orderInfo: null,
            loading: false
          })
          return
        }

        // 计算已使用天数（从支付成功时间开始计算）
        const payTime = new Date(successTime)
        const daysDiff = Math.floor((now - payTime) / (24 * 60 * 60 * 1000))
        const usedDays = daysDiff
        
        // 检查是否在7天内
        const canRefund = usedDays <= 7
        
        // 计算扣除金额（每天0.3元）
        const deductionPerDay = 30 // 0.3元 = 30分
        const deductionAmount = usedDays * deductionPerDay
        
        // 计算可退款金额
        const refundAmount = Math.max(0, totalAmount - deductionAmount)
        
        const totalAmountYuan = (totalAmount / 100).toFixed(2)
        const deductionAmountYuan = (deductionAmount / 100).toFixed(2)
        const refundAmountYuan = (refundAmount / 100).toFixed(2)
        
        let refundTip = ''
        if (!canRefund) {
          refundTip = '该订单已超过7天，无法退款'
        } else if (usedDays > 0) {
          refundTip = `已使用${usedDays}天，扣除¥${deductionAmountYuan}`
        } else {
          refundTip = '未使用，可全额退款'
        }
        
        // 从Attach解析产品信息
        const attach = response.Attach || response.attach
        const productName = this.getProductNameFromAttach(attach)
        
        this.setData({
          orderInfo: {
            orderNo: orderNo,
            totalAmount: totalAmount,
            amount: totalAmount,
            createTime: successTime,
            status: 'paid',
            statusText: '已支付',
            productName: productName
          },
          maxRefundAmount: refundAmount,
          maxRefundAmountText: refundAmountYuan,
          orderAmountText: totalAmountYuan,
          usedDays: usedDays,
          deductionAmount: deductionAmount,
          deductionAmountText: deductionAmountYuan,
          canRefund: canRefund,
          refundTip: refundTip,
          // 自动填充退款金额
          refundAmount: canRefund ? refundAmountYuan : ''
        })
      } else {
        wx.showToast({
          title: '订单不存在',
          icon: 'none',
          duration: 2000
        })
        this.setData({
          orderInfo: null,
          maxRefundAmount: 0,
          maxRefundAmountText: '',
          orderAmountText: '',
          usedDays: 0,
          deductionAmount: 0,
          deductionAmountText: '0.00',
          canRefund: true,
          refundTip: ''
        })
      }
      
      this.setData({ loading: false })
    } catch (error) {
      console.error('查询订单信息失败:', error)
      wx.showToast({
        title: '查询失败，请重试',
        icon: 'none',
        duration: 2000
      })
      this.setData({
        orderInfo: null,
        loading: false
      })
    }
  },

  // 从Attach字段解析产品名称
  getProductNameFromAttach(attach) {
    if (!attach) return '会员订单'
    try {
      const attachObj = typeof attach === 'string' ? JSON.parse(attach) : attach
      const productId = attachObj.productId || attachObj.ProductId
      return this.getProductName(productId)
    } catch (e) {
      return this.getProductName(attach)
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

  // 查询订单按钮点击
  onQueryOrder() {
    if (!this.data.orderNo || this.data.orderNo.trim() === '') {
      wx.showToast({
        title: '请输入订单号',
        icon: 'none'
      })
      return
    }
    this.queryOrderInfo()
  },

  // 输入退款金额
  onAmountInput(e) {
    const value = e.detail.value
    // 只允许输入数字和小数点
    if (/^\d*\.?\d*$/.test(value)) {
      this.setData({
        refundAmount: value
      })
    }
  },

  // 选择退款原因
  onReasonSelect(e) {
    const index = e.currentTarget.dataset.index
    const reason = this.data.reasonList[index]
    
    if (reason === '其他原因') {
      this.setData({
        selectedReasonIndex: index,
        showCustomReason: true,
        refundReason: ''
      })
    } else {
      this.setData({
        selectedReasonIndex: index,
        showCustomReason: false,
        refundReason: reason,
        customReason: ''
      })
    }
  },

  // 输入自定义原因
  onCustomReasonInput(e) {
    const value = e.detail.value || e.detail
    this.setData({
      customReason: value,
      refundReason: value
    })
  },

  // 表单验证
  validateForm() {
    // 检查是否可退款（7天内）
    if (!this.data.canRefund) {
      wx.showToast({
        title: '该订单已超过7天，无法退款',
        icon: 'none',
        duration: 2000
      })
      return false
    }

    if (!this.data.orderNo || this.data.orderNo.trim() === '') {
      wx.showToast({
        title: '请输入订单号',
        icon: 'none'
      })
      return false
    }

    if (!this.data.refundAmount || this.data.refundAmount.trim() === '') {
      wx.showToast({
        title: '请输入退款金额',
        icon: 'none'
      })
      return false
    }

    const amount = parseFloat(this.data.refundAmount)
    if (isNaN(amount) || amount <= 0) {
      wx.showToast({
        title: '请输入有效的退款金额',
        icon: 'none'
      })
      return false
    }

    // 验证退款金额不能超过可退款金额
    if (this.data.maxRefundAmount > 0) {
      const maxAmount = this.data.maxRefundAmount / 100 // 转换为元
      if (amount > maxAmount) {
        wx.showToast({
          title: `退款金额不能超过可退金额¥${maxAmount.toFixed(2)}`,
          icon: 'none',
          duration: 2000
        })
        return false
      }
    }

    if (!this.data.refundReason || this.data.refundReason.trim() === '') {
      wx.showToast({
        title: '请选择退款原因',
        icon: 'none'
      })
      return false
    }

    return true
  },

  // 提交退款申请
  onSubmit() {
    if (!this.validateForm()) {
      return
    }

    // 确认提交
    wx.showModal({
      title: '确认退款',
      content: `确定要申请退款¥${this.data.refundAmount}吗？`,
      success: (res) => {
        if (res.confirm) {
          this.submitRefundRequest()
        }
      }
    })
  },

  // 提交退款请求（使用真实API）
  async submitRefundRequest() {
    wx.showLoading({
      title: '提交中...',
      mask: true
    })

    try {
      const orderNo = this.data.orderNo.trim()
      const totalAmount = this.data.orderInfo.totalAmount || 0
      const refundAmount = Math.round(parseFloat(this.data.refundAmount) * 100) // 转换为分
      const reason = this.data.refundReason.trim()

      const response = await applyRefund({
        OutTradeNo: orderNo,
        TotalAmount: totalAmount,
        RefundAmount: refundAmount,
        Reason: reason
      })

      wx.hideLoading()

      if (response && (response.OutRefundNo || response.RefundId)) {
        const refundNo = response.OutRefundNo || response.outRefundNo || response.RefundId || response.refundId || ''

        // 提交成功
        wx.showModal({
          title: '提交成功',
          content: `退款申请已提交${refundNo ? '，退款单号：' + refundNo : ''}\n我们将在1-3个工作日内处理您的退款申请`,
          showCancel: false,
          success: (res) => {
            if (res.confirm) {
              // 返回上一页或跳转到订单列表
              const pages = getCurrentPages()
              if (pages.length > 1) {
                wx.navigateBack()
              } else {
                // 如果没有上一页，跳转到订单列表页
                wx.reLaunch({ url: '/pages/android/order/list/list' })
              }
            }
          }
        })
      } else {
        wx.showToast({
          title: '提交失败，请重试',
          icon: 'none',
          duration: 2000
        })
      }
    } catch (error) {
      console.error('提交退款申请失败:', error)
      wx.hideLoading()
      
      let errorMessage = '提交失败，请重试'
      if (error && error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      wx.showModal({
        title: '提交失败',
        content: errorMessage,
        showCancel: false
      })
    }
  }
})

