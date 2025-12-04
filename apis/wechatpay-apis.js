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

//根据订单号重新获取支付参数（用于待支付订单重新支付）
export const rePayOrder = (outTradeNo) => {
  return request({
      url: '/WechatPay/RePayOrder',
      data: { outTradeNo },
      method: 'GET',
  })
}