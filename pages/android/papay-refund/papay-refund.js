import {
  getDeductOrders,
  refundDeductOrder
} from '../../../apis/wechatpay-papay-apis'
import {
  formatAmount,
  calculateRefundByAgreement
} from '../../../utils/order-utils.js'

const { checkLoginAndNavigate } = require('../../../utils/util.js')

const REASON_LIST = [
  '不想要了',
  '重复扣款',
  '扣费金额有误',
  '其他原因'
]

const MIN_CUSTOM_REASON_LENGTH = 2

function enrichOrder(item) {
  const outTradeNo = item.outTradeNo || item.OutTradeNo || ''
  const amount = item.amount ?? item.Amount ?? 0
  const status = (item.status || item.Status || '').toUpperCase()
  const successTime = item.successTime || item.SuccessTime || ''
  const calc = calculateRefundByAgreement(amount, successTime)

  const usedDays = item.usedDays ?? item.UsedDays ?? calc.usedDays
  const deductionAmount = item.deductionAmount ?? item.DeductionAmount ?? calc.deductionAmount
  const refundAmount = item.refundAmount ?? item.RefundAmount ?? calc.refundAmount

  return {
    outTradeNo,
    productId: item.productId || item.ProductId || '',
    planName: item.planName || item.PlanName || '自动续费会员',
    amount,
    amountText: formatAmount(amount),
    status,
    successTime,
    refundable: !!(item.refundable ?? item.Refundable),
    refundTip: item.refundTip || item.RefundTip || '',
    usedDays,
    deductionAmount,
    deductionAmountText: formatAmount(deductionAmount),
    refundAmount,
    maxRefundAmountText: formatAmount(refundAmount)
  }
}

function pickRefundableOrder(orders, preferredOutTradeNo) {
  if (preferredOutTradeNo) {
    const preferred = orders.find((item) => item.outTradeNo === preferredOutTradeNo)
    if (preferred?.refundable) {
      return preferred
    }
  }
  return orders.find((item) => item.refundable) || null
}

Page({
  data: {
    loading: true,
    displayOrder: null,
    reasonList: REASON_LIST,
    selectedReasonIndex: -1,
    showCustomReason: false,
    customReason: '',
    customReasonError: '',
    agreedToAgreement: false,
    agreementError: '',
    canSubmit: false,
    submitting: false,
    submitDisabledText: '当前暂无可退款记录',
    showDeductionHelp: false,
    showSuccessDialog: false,
    successDialogTitle: '',
    successDialogContent: ''
  },

  onLoad(options) {
    if (options.outTradeNo) {
      this._initialOutTradeNo = options.outTradeNo
    }
  },

  onShow() {
    if (!checkLoginAndNavigate('navigateTo')) {
      return
    }
    this.loadOrders()
  },

  async loadOrders() {
    const userId = wx.getStorageSync('userId')
    if (!userId) {
      this.setData({
        loading: false,
        displayOrder: null
      })
      return
    }

    this.setData({ loading: true })

    try {
      const response = await getDeductOrders(userId)
      const list = Array.isArray(response) ? response : []
      const orders = list.map(enrichOrder)
      const preferredOutTradeNo = this._initialOutTradeNo || ''
      this._initialOutTradeNo = ''

      const refundableOrder = pickRefundableOrder(orders, preferredOutTradeNo)
      const displayOrder = refundableOrder || orders[0] || null

      this.setData({
        displayOrder,
        loading: false,
        selectedReasonIndex: -1,
        showCustomReason: false,
        customReason: '',
        customReasonError: '',
        agreementError: '',
        agreedToAgreement: false,
        showDeductionHelp: false
      })
      this.updateSubmitState()
    } catch (error) {
      console.error('加载扣款记录失败:', error)
      this.setData({
        loading: false,
        displayOrder: null
      })
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
    }
  },

  onShowDeductionHelp() {
    this.setData({
      showDeductionHelp: !this.data.showDeductionHelp
    })
  },

  onSelectReason(event) {
    const index = Number(event.currentTarget.dataset.index)
    const isOther = this.data.reasonList[index] === '其他原因'
    this.setData({
      selectedReasonIndex: index,
      showCustomReason: isOther,
      customReasonError: ''
    })
    this.updateSubmitState()
  },

  onCustomReasonInput(event) {
    const value = event.detail.value || ''
    this.setData({
      customReason: value,
      customReasonError: this.getCustomReasonError(value)
    })
    this.updateSubmitState()
  },

  getCustomReasonError(value) {
    if (!this.data.showCustomReason) {
      return ''
    }
    const trimmed = (value || '').trim()
    if (!trimmed) {
      return '请详细说明退款原因'
    }
    if (trimmed.length < MIN_CUSTOM_REASON_LENGTH) {
      return `退款原因至少需要${MIN_CUSTOM_REASON_LENGTH}个字`
    }
    return ''
  },

  onAgreedAgreementChange(event) {
    this.setData({
      agreedToAgreement: !!event.detail.checked,
      agreementError: ''
    })
    this.updateSubmitState()
  },

  onViewAgreement() {
    wx.navigateTo({
      url: '/pages/android/refund/agreement/agreement'
    })
  },

  getRefundReason() {
    const { selectedReasonIndex, reasonList, showCustomReason, customReason } = this.data
    if (selectedReasonIndex < 0) {
      return ''
    }
    if (showCustomReason) {
      return customReason.trim()
    }
    return reasonList[selectedReasonIndex]
  },

  updateSubmitState() {
    const { displayOrder, selectedReasonIndex, showCustomReason, customReason, agreedToAgreement } = this.data
    let submitDisabledText = '当前暂无可退款记录'
    let canSubmit = false

    if (displayOrder?.refundable && displayOrder.refundAmount > 0) {
      const customReasonError = showCustomReason
        ? this.getCustomReasonError(customReason)
        : ''
      const reasonValid = selectedReasonIndex >= 0 && !customReasonError
      canSubmit = reasonValid && agreedToAgreement
      if (selectedReasonIndex < 0) {
        submitDisabledText = '请选择退款原因'
      } else if (customReasonError) {
        submitDisabledText = customReasonError
      } else if (!agreedToAgreement) {
        submitDisabledText = '请先同意退款协议'
      } else {
        submitDisabledText = ''
      }
    } else if (displayOrder?.refundAmount === 0) {
      submitDisabledText = '可退金额为0，无法退款'
    } else if (displayOrder?.refundTip) {
      submitDisabledText = displayOrder.refundTip
    }

    this.setData({
      canSubmit,
      submitDisabledText,
      customReasonError: showCustomReason ? this.getCustomReasonError(customReason) : ''
    })
  },

  validateForm() {
    const errors = {}
    const reason = this.getRefundReason()

    if (this.data.selectedReasonIndex < 0) {
      errors.reason = '请选择退款原因'
    } else if (this.data.showCustomReason) {
      const customReasonError = this.getCustomReasonError(this.data.customReason)
      if (customReasonError) {
        errors.customReasonError = customReasonError
      }
    }

    if (!this.data.agreedToAgreement) {
      errors.agreementError = '请先阅读并同意退款协议'
    }

    this.setData({
      customReasonError: errors.customReasonError || '',
      agreementError: errors.agreementError || ''
    })

    return Object.keys(errors).length === 0
  },

  onSubmit() {
    const { displayOrder } = this.data
    if (!displayOrder?.refundable || displayOrder.refundAmount <= 0) {
      wx.showToast({
        title: this.data.submitDisabledText || '当前暂无可退款记录',
        icon: 'none'
      })
      return
    }

    if (!this.validateForm()) {
      if (this.data.customReasonError || this.data.agreementError) {
        wx.showToast({
          title: this.data.customReasonError || this.data.agreementError,
          icon: 'none'
        })
      }
      return
    }

    wx.showModal({
      title: '确认退款',
      content: `确定要申请退款 ¥${displayOrder.maxRefundAmountText} 吗？退款成功后相应会员时长将收回。`,
      success: (res) => {
        if (res.confirm) {
          this.submitRefund()
        }
      }
    })
  },

  async submitRefund() {
    const { displayOrder } = this.data
    const reason = this.getRefundReason()

    this.setData({ submitting: true })

    try {
      const response = await refundDeductOrder({
        outTradeNo: displayOrder.outTradeNo,
        totalAmount: displayOrder.amount,
        refundAmount: displayOrder.refundAmount,
        reason
      })

      const outRefundNo = response.outRefundNo || response.OutRefundNo || ''
      const refundId = response.refundId || response.RefundId || ''
      const status = response.status || response.Status || 'PROCESSING'
      const amount = response.amount ?? response.Amount ?? displayOrder.refundAmount

      let content = '退款申请已提交\n\n'
      if (outRefundNo) {
        content += `退款单号：${outRefundNo}\n`
      }
      if (refundId) {
        content += `微信退款单号：${refundId}\n`
      }
      content += `退款金额：¥${typeof amount === 'number' ? formatAmount(amount) : amount}\n`
      content += `退款状态：${this.getRefundStatusText(status)}\n\n`
      content += '我们将在 1-3 个工作日内处理您的退款申请'

      this.setData({
        showSuccessDialog: true,
        successDialogTitle: '提交成功',
        successDialogContent: content
      })
    } catch (error) {
      console.error('提交退款失败:', error)
      wx.showToast({
        title: error.message || '提交失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  getRefundStatusText(status) {
    const map = {
      PROCESSING: '处理中',
      SUCCESS: '退款成功',
      CLOSED: '退款关闭',
      ABNORMAL: '退款异常'
    }
    return map[(status || '').toUpperCase()] || status || '处理中'
  },

  onSuccessDialogConfirm() {
    this.setData({ showSuccessDialog: false })
    this.loadOrders()
  }
})
