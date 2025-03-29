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
//微信登录
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

//获取我的个人排名
export const getRankByUserId = (params) => {
    return request({
        url: '/users/getRankByUserId',
        data: params,
        method: 'GET',
    })
}