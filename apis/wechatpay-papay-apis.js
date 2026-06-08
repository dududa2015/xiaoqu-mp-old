import {
  request
} from "../utils/request"

export const createContractOrder = (params) => {
  return request({
    url: '/WechatPayPapay/CreateContractOrder',
    data: params,
    method: 'POST',
  })
}

export const getSubscription = (userId) => {
  return request({
    url: '/WechatPayPapay/GetSubscription',
    data: { userId },
    method: 'GET',
  })
}

export const cancelContract = (userId) => {
  return request({
    url: '/WechatPayPapay/CancelContract',
    data: { userId },
    method: 'POST',
  })
}

export const getDeductOrders = (userId) => {
  return request({
    url: '/WechatPayPapay/GetDeductOrders',
    data: { userId },
    method: 'GET',
  })
}

export const refundDeductOrder = (params) => {
  return request({
    url: '/WechatPayPapay/RefundDeductOrder',
    data: params,
    method: 'POST',
  })
}
