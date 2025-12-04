import {
  request
} from "../utils/request"

// 根据用户ID查询订单列表（支持分页）
export const getOrdersByUserId = (params) => {
  return request({
    url: '/WechatPay/GetOrdersByUserId',
    data: {
      ...params,
      page: params.page || 1,
      pageSize: params.pageSize || 10
    },
    method: 'GET',
  })
}

// 查询订单详情
export const queryOrder = (params) => {
  return request({
    url: '/WechatPay/QueryOrder',
    data: params,
    method: 'GET',
  })
}

