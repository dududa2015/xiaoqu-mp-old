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

//用于个人中心
export const getUserById = (params) => {
    return request({
        url: '/users/getUserById',
        data: params,
        method: 'GET',
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
//app登录，通过小程序用户编号和小程序用户密码
export const getUserInfoByAppLogin = (params) => {
    return request({
        url: '/users/appLogin',
        data: params,
        method: 'GET',
    })
}
//d1f84a0863微信登录e92817962f
export const getUserInfoByWxLogin = (params) => {
    return request({
        url: '/users/getUserInfoByWxLogin',
        data: params,
        method: 'GET',
    })
}
//苹果登录，通过code获取用户信息-用于多端应用的苹果登录
export const getAppleUserInfo = (params) => {
    return request({
        url: '/users/getAppleUserInfo',
        data: params,
        method: 'GET',
    })
}
//通过deviceId创建日志表--用于进入app时根据userId和deviceId创建日志表
export const addUserDeviceLog = (params) => {
    return request({
        url: '/users/addUserDeviceLog',
        data: params,
        method: 'GET',
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
