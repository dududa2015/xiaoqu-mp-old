import {
    request
} from "../utils/request"

// 申请退款
export const applyRefund = (params) => {
    return request({
        url: '/WechatPay/Refund',
        data: params,
        method: 'POST',
    })
}

// 查询退款
export const queryRefund = (params) => {
    return request({
        url: '/WechatPay/QueryRefund',
        data: params,
        method: 'POST',
    })
}

