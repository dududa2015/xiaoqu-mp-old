// utils/order-utils.js
// 订单相关工具函数

/**
 * 判断订单是否可退款（会员订单：7天内可退款，包含当天）
 * @param {Object} order - 订单对象
 * @param {String|Number} order.status - 订单状态（'1' 或 'SUCCESS' 表示已支付）
 * @param {String} order.successTime - 支付成功时间
 * @param {String} order.createdDate - 创建时间（可选）
 * @param {String} order.createTime - 创建时间（可选）
 * @returns {Boolean} 是否可退款
 */
export function isRefundable(order) {
  // 检查订单状态（支持两种格式：'1' 和 'SUCCESS'）
  const status = String(order.status)
  const statusUpper = status.toUpperCase()
  if (status !== '1' && statusUpper !== 'SUCCESS') {
    return false
  }

  // 获取时间（优先使用支付成功时间，其次使用创建时间）
  const timeToCheck = order.successTime || order.createdDate || order.createTime
  if (!timeToCheck) {
    return false
  }

  // 计算天数差（包含当天）
  const now = new Date()
  const checkTime = new Date(timeToCheck)

  // 将时间设置为当天的 00:00:00，以便按天计算
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const checkDate = new Date(checkTime.getFullYear(), checkTime.getMonth(), checkTime.getDate())

  // 计算天数差（包含当天，所以是 <= 6，即 0-6 共7天）
  const daysDiff = Math.floor((nowDate - checkDate) / (24 * 60 * 60 * 1000))

  // 包含当天，所以 daysDiff <= 6 表示在7天内（第0天到第6天，共7天）
  return daysDiff >= 0 && daysDiff <= 6
}

/**
 * 格式化金额（分转元）
 * @param {Number} amount - 金额（单位：分）
 * @returns {String} 格式化后的金额字符串（单位：元）
 */
export function formatAmount(amount) {
  if (!amount && amount !== 0) return '0.00'
  return (amount / 100).toFixed(2)
}

/**
 * 格式化时间（完整格式：年月日时分秒）
 * @param {String} timeStr - 时间字符串
 * @returns {String} 格式化后的时间字符串
 */
export function formatTime(timeStr) {
  if (!timeStr) return ''

  // 处理 createdDate 格式 "2025/12/03 21:45:54"，转换为标准格式
  let normalizedTime = timeStr
  if (timeStr.includes('/')) {
    normalizedTime = timeStr.replace(/\//g, '-')
  }

  const date = new Date(normalizedTime)
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return timeStr // 如果解析失败，返回原始字符串
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

/**
 * 格式化时间（简化格式：年月日时分）
 * @param {String} timeStr - 时间字符串
 * @returns {String} 格式化后的时间字符串
 */
export function formatTimeShort(timeStr) {
  if (!timeStr) return ''

  // 处理 createdDate 格式 "2025/12/03 21:45:54"，转换为标准格式
  let normalizedTime = timeStr
  if (timeStr.includes('/')) {
    normalizedTime = timeStr.replace(/\//g, '-')
  }

  const date = new Date(normalizedTime)
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return timeStr // 如果解析失败，返回原始字符串
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

/**
 * 获取订单状态文本（列表页使用，状态码：0-5）
 * @param {Object} order - 订单对象
 * @param {String|Number} order.status - 订单状态码
 * @returns {String} 状态文本
 */
export function getStatusText(order) {
  const status = String(order.status)
  const statusMap = {
    '0': '待支付',
    '1': '已支付',
    '2': '已关闭',
    '3': '已退款',
    '4': '退款中',
    '5': '支付失败'
  }
  return statusMap[status] || '未知状态'
}

/**
 * 获取订单状态文本（详情页使用，TradeState：NOTPAY, SUCCESS等）
 * @param {Object} order - 订单对象
 * @param {String} order.status - 订单状态（TradeState）
 * @returns {String} 状态文本
 */
export function getTradeStateText(order) {
  const status = String(order.status).toUpperCase()
  const statusMap = {
    'NOTPAY': '待支付',
    'SUCCESS': '已支付',
    'CLOSED': '已关闭',
    'REFUND': '已退款',
    'REVOKED': '已撤销',
    'USERPAYING': '支付中',
    'PAYERROR': '支付失败'
  }
  return statusMap[status] || '未知状态'
}

/**
 * 根据产品ID获取产品名称
 * @param {String} productId - 产品ID
 * @returns {String} 产品名称
 */
export function getProductName(productId) {
  if (!productId) return '会员订单'
  const productMap = {
    'com.louhao.xiaoqu.month': '月度会员',
    'com.louhao.xiaoqu.season': '季度会员',
    'com.louhao.xiaoqu.year': '年度会员',
    'com.louhao.xiaoqu.vip': 'VIP会员'
  }
  return productMap[productId] || productId || '会员订单'
}

/**
 * 从Attach字段解析产品名称
 * @param {String|Object} attach - Attach字段（JSON字符串或对象）
 * @returns {String} 产品名称
 */
export function getProductNameFromAttach(attach) {
  if (!attach) return '会员订单'
  try {
    const attachObj = typeof attach === 'string' ? JSON.parse(attach) : attach
    const productId = attachObj.productId || attachObj.ProductId
    return getProductName(productId)
  } catch (e) {
    return getProductName(attach)
  }
}

/**
 * 计算已使用天数（从支付成功时间开始计算，不包含当天）
 * 用于退款金额计算：如果订单是今天支付的，使用天数为0（不扣除费用）
 * @param {String} successTime - 支付成功时间
 * @returns {Number} 已使用天数（不包含当天）
 */
export function calculateUsedDays(successTime) {
  return calculateUsedNaturalDays(successTime)
}

/**
 * 按自然日计算已使用天数（退款协议）
 * 扣款/支付成功当日计为 0 天；每跨越一个自然日加 1 天（不按小时折算）
 * @param {String} successTime - 支付/扣款成功时间
 * @returns {Number}
 */
export function calculateUsedNaturalDays(successTime) {
  if (!successTime) return 0

  const now = new Date()
  const payTime = new Date(successTime)
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const payDate = new Date(payTime.getFullYear(), payTime.getMonth(), payTime.getDate())
  const daysDiff = Math.floor((nowDate - payDate) / (24 * 60 * 60 * 1000))

  return Math.max(0, daysDiff)
}

/** 退款协议：每天扣除 0.3 元（30 分） */
export const REFUND_DEDUCTION_PER_DAY_FEN = 30

/**
 * 按退款协议计算可退金额（单位：分）
 * 退款金额 = 订单金额 - (已使用自然日天数 × 0.3元)
 */
export function calculateRefundByAgreement(totalAmountFen, successTime) {
  const amount = Number(totalAmountFen) || 0
  const usedDays = calculateUsedNaturalDays(successTime)
  const deductionAmount = usedDays * REFUND_DEDUCTION_PER_DAY_FEN
  const refundAmount = Math.max(0, amount - deductionAmount)

  return {
    usedDays,
    deductionAmount,
    refundAmount
  }
}

/**
 * 转换API返回的订单数据格式
 * @param {Object} apiOrder - API返回的订单对象
 * @returns {Object} 转换后的订单对象
 */
export function convertOrderFromApi(apiOrder) {
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
}

