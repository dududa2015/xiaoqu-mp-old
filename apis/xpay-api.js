import {
  request
} from "../utils/request"

export const GOODS_UNIT = {
  vip_month: '1个月',
  vip_season: '3个月',
  vip_year: '1年'
}

export const DEFAULT_XPAY_GOODS = [{
  productId: 'vip_month',
  name: '月度会员',
  days: 31,
  goodsPrice: 300,
  unit: GOODS_UNIT.vip_month,
  desc: '全功能无限使用，免广告'
}, {
  productId: 'vip_season',
  name: '季度会员',
  days: 93,
  goodsPrice: 750,
  unit: GOODS_UNIT.vip_season,
  desc: '全功能无限使用，免广告'
}, {
  productId: 'vip_year',
  name: '年度会员',
  days: 365,
  goodsPrice: 2500,
  unit: GOODS_UNIT.vip_year,
  desc: '全功能无限使用，免广告'
}]

export const getXpayGoodsList = () => {
  return request({
    url: '/Xpay/GetGoodsList',
    data: {},
    method: 'GET',
    quiet: true
  })
}

export const createXpayOrder = (params) => {
  return request({
    url: '/Xpay/CreateOrder',
    data: params,
    method: 'POST'
  })
}

export const queryXpayOrder = (params) => {
  return request({
    url: '/Xpay/QueryOrder',
    data: params,
    method: 'POST',
    silent: true,
    quiet: true
  })
}

export const getXpayOrders = () => {
  return request({
    url: '/Xpay/GetOrders',
    data: {},
    method: 'GET',
    quiet: true
  })
}

export const refundXpayOrder = (outTradeNo) => {
  return request({
    url: '/Xpay/RefundOrder',
    data: {
      outTradeNo
    },
    method: 'POST',
    quiet: true
  })
}
