import {
  request
} from "../utils/request"

//内容安全检测
export const msgSecurityCheck = (params) => {
  return request({
      url: '/securityCheck/msgSecurityCheck',
      data: params,
      method: 'GET',
  })
}
