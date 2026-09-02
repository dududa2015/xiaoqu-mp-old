import {
    request
} from "../utils/request"

// 获取用户信息--用于启动事件
export const getUserInfo = (params) => {
    return request({
        url: '/users/getUserInfo',
        data: params,
        method: 'GET',
    })
}
// 获取用户信息--用于安卓审核登录
export const getUserByIdTest = (params) => {
  return request({
      url: '/users/getUserByIdTest',
      data: params,
      method: 'GET',
  })
}

//用于个人中心
export const getUserById = (params) => {
    return request({
        url: '/users/getUserById',
        data: params,
        method: 'GET',
    })
}
//用户个人中心更新标记和删除数量
export const updateUserMarkersAndDeleted = (params) => {
  // [FromQuery] 表示参数通过查询字符串传递，即使方法是 POST
  const queryString = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&')
  return request({
      url: `/users/updateUserMarkersAndDeleted?${queryString}`,
      data: {},
      method: 'POST',
  })
}
//更改用户昵称
export const updateNickName = (params) => {
    return request({
        url: '/users/updateNickName',
        data: params,
        method: 'POST',
    })
}
//获取我的个人排名
export const getRankByUserId = (params) => {
    return request({
        url: '/users/getRankByUserId',
        data: params,
        method: 'GET',
    })
}

// 即时注销当前账号（需登录 token）
export const cancelAccount = () => {
    return request({
        url: '/users/cancelAccount',
        data: {},
        method: 'POST',
    })
}

//获取个人地图列表
export const changeIsPubMap = (params) => {
    return request({
        url: '/users/changeIsPubMap',
        data: params,
        method: 'POST',
    })
}
/************************************下面是管理员专用方法*******************************************/
//获取苹果支付结果列表
export const getAppleIAPList = (params) => {
    return request({
        url: '/users/getAppleIAPList',
        data: params,
        method: 'GET',
    })
}
