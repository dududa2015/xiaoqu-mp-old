import {
  request
} from "../utils/request"

// 根据用户ID查询订单列表
export const getOrdersByUserId = (params) => {
  return request({
    url: '/WechatPay/GetOrdersByUserId',
    data: params,
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

