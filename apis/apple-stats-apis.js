import {
  request
} from "../utils/request"

//按月统计
export const getAppleMonthStats = (params) => {
  return request({
      url: '/stats/getAppleMonthStats',
      data: params,
      method: 'GET',
  })
}

//按天统计
export const getAppleDailyStats = (params) => {
  return request({
      url: '/stats/getAppleDailyStats',
      data: params,
      method: 'GET',
  })
}