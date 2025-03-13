import {
    request
} from "../utils/request"

//微信登录
export const getUserInfoByWxLogin = (params) => {
    return request({
        url: '/users/getUserInfoByWxLogin',
        data: params,
        method: 'GET',
    })
}