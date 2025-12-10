import {
  request
} from "../utils/request"

//按天统计
export const getAndroidDailyStats = (params) => {
  return request({
      url: '/WechatPay/GetDailyPaymentStats',
      data: params,
      method: 'GET',
  })
}

//按月统计
export const getAndroidMonthStats = (params) => {
  return request({
      url: '/WechatPay/GetMonthlyPaymentTotals',
      data: params,
      method: 'GET',
  })
}

