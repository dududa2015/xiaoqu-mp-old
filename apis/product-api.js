import {
    request
} from "../utils/request"

//获取苹果的付费产品列表
export const getProductList = (params) => {
    return request({
        url: '/product/getProductList',
        data: params,
        method: 'GET',
    })
}
