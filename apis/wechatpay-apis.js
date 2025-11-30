import {
  request
} from "../utils/request"

//支付统一下单
export const createAppOrder = (params) => {
  return request({
      url: '/WechatPay/CreateAppOrder',
      data: params,
      method: 'POST',
  })
}