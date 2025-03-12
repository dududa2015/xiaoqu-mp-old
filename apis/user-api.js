import {
    request
} from "../utils/request"

//微信登录
export const wxLogin = (params) => {
    return request({
        url: '/users/wxLogin',
        data: params,
        method: 'GET',
    })
}