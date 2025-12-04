// pages/android/refund/refund.js
import { queryOrder } from '../../../apis/order-api.js'
import { applyRefund } from '../../../apis/refund-api.js'
import { 
  isRefundable, 
  formatAmount, 
  getProductNameFromAttach,
  calculateUsedDays
} from '../../../utils/order-utils.js'

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
    reasonError: '', // 退款原因错误提示
    customReasonError: '', // 自定义原因错误提示
    agreedToAgreement: false, // 是否同意退款协议
    agreementError: '', // 协议错误提示
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

        // 计算已使用天数（从支付成功时间开始计算，不包含当天）
        // 今天支付的订单：usedDays = 0
        // 昨天支付的订单：usedDays = 1
        const usedDays = calculateUsedDays(successTime)
        
        // 检查是否在7天内（使用统一的 isRefundable 函数）
        const canRefund = isRefundable({
          status: tradeState,
          successTime: successTime
        })
        
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
          // 有使用天数，显示已使用天数
          refundTip = `已使用${usedDays}天，扣除¥${deductionAmountYuan}`
        } else {
          // 使用天数为0，不显示提示
          refundTip = ''
        }
        
        // 从Attach解析产品信息
        const attach = response.Attach || response.attach
        const productName = getProductNameFromAttach(attach)
        
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
          usedDays: usedDays, // 已使用天数（不包含当天）
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
        refundReason: '',
        reasonError: '', // 清除错误提示
        customReason: ''
      })
    } else {
      this.setData({
        selectedReasonIndex: index,
        showCustomReason: false,
        refundReason: reason,
        customReason: '',
        reasonError: '', // 清除错误提示
        customReasonError: '' // 清除自定义原因错误
      })
    }
  },

  // 输入自定义原因
  onCustomReasonInput(e) {
    const value = e.detail.value || e.detail
    this.setData({
      customReason: value,
      refundReason: value,
      customReasonError: '' // 清除错误提示
    })
    
    // 实时验证
    this.validateCustomReason(value)
  },

  // 自定义原因失焦验证
  onCustomReasonBlur() {
    this.validateCustomReason(this.data.customReason)
  },

  // 验证自定义原因
  validateCustomReason(value) {
    if (this.data.showCustomReason) {
      if (!value || value.trim() === '') {
        this.setData({
          customReasonError: '请详细说明退款原因'
        })
        return false
      } else if (value.trim().length < 5) {
        this.setData({
          customReasonError: '退款原因至少需要5个字符'
        })
        return false
      } else {
        this.setData({
          customReasonError: ''
        })
        return true
      }
    }
    return true
  },

  // 切换协议同意状态
  onToggleAgreement() {
    this.setData({
      agreedToAgreement: !this.data.agreedToAgreement,
      agreementError: '' // 清除错误提示
    })
  },

  // 查看退款协议
  onViewAgreement() {
    wx.navigateTo({
      url: '/pages/android/refund/agreement/agreement'
    })
  },

  // 表单验证
  validateForm() {
    let isValid = true
    const errors = {
      reasonError: '',
      customReasonError: '',
      agreementError: ''
    }

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

    // 验证退款原因
    if (this.data.selectedReasonIndex === -1 && !this.data.showCustomReason) {
      errors.reasonError = '请选择退款原因'
      isValid = false
    } else if (this.data.showCustomReason) {
      // 验证自定义原因
      if (!this.validateCustomReason(this.data.customReason)) {
        isValid = false
      }
    }

    // 验证退款协议
    if (!this.data.agreedToAgreement) {
      errors.agreementError = '请先阅读并同意退款协议'
      isValid = false
    }

    // 更新错误状态
    this.setData(errors)

    if (!isValid) {
      // 滚动到错误位置
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 300
      })
    }

    return isValid
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


  // 获取退款状态文本
  getRefundStatusText(status) {
    const statusMap = {
      'PROCESSING': '处理中',
      'SUCCESS': '退款成功',
      'CLOSED': '退款关闭',
      'ABNORMAL': '退款异常',
      'REVOKED': '已撤销'
    }
    return statusMap[status] || '未知状态'
  },

  // 获取退款状态提示信息
  getRefundStatusMessage(status) {
    const statusUpper = String(status).toUpperCase()
    switch (statusUpper) {
      case 'PROCESSING':
        return '退款申请正在处理中，我们将在1-3个工作日内完成退款'
      case 'SUCCESS':
        return '退款已成功，请查收您的账户'
      case 'CLOSED':
        return '退款已关闭'
      case 'ABNORMAL':
        return '退款处理异常，请联系客服处理'
      case 'REVOKED':
        return '退款已撤销'
      default:
        return '我们将在1-3个工作日内处理您的退款申请'
    }
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

      // 检查响应数据，支持小写字段名
      if (response && (response.outRefundNo || response.refundId || response.OutRefundNo || response.RefundId)) {
        const outRefundNo = response.outRefundNo || response.OutRefundNo || ''
        const refundId = response.refundId || response.RefundId || ''
        const status = (response.status || '').toUpperCase()
        const amount = response.amount || 0
        const amountText = formatAmount(amount)

        // 根据状态获取提示信息
        const statusText = this.getRefundStatusText(status)
        const statusMessage = this.getRefundStatusMessage(status)

        // 构建提示内容
        let content = `退款申请已提交\n\n`
        if (outRefundNo) {
          content += `退款单号：${outRefundNo}\n`
        }
        if (refundId) {
          content += `微信退款单号：${refundId}\n`
        }
        content += `退款金额：¥${amountText}\n`
        content += `退款状态：${statusText}\n\n`
        content += statusMessage

        // 提交成功
        wx.showModal({
          title: '提交成功',
          content: content,
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

