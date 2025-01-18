// api URL
// const apiUrl = "https://zhuzixi.cn/louhao/lh.asmx";// 公共的请求地址
// const apiUrl = "http://localhost/louhao/louhao/lh.asmx"
const apiUrl = "http://localhost:5213/api"
// const apiUrl = "https://mp.zhuzixi.cn/api"
// 封装微信请求方法
const request = (params) => {
    let url = params.url;
    let data = params.data;
    let method = params.method;
    let header = {
        "Content-Type": "application/json"
    };

    // 鉴权验证，获取登录之后后端返回的token，存在即在头部Authorization写token，具体的看后端需求
    if (wx.getStorageSync("token")) {
        header.Authorization = `Bearer ${wx.getStorageSync("token")}`;
        // header.token = wx.getStorageSync("token");
    }
    wx.showLoading({
        title: '正在加载',
    })
    return new Promise((resolve, reject) => {
        wx.request({
            url: apiUrl + url, // api url
            method: method, // get/post
            data: data, // 请求参数
            header: header, // 头部
            success(res) {
                if (res.statusCode === 401) {
                    wx.showToast({
                        title: 'invalid token',
                        icon: 'none'
                    })
                    reject('')
                } else {
                    resolve(res.data)
                }
            },
            fail(err) {
                reject(err);
            },
            complete() {
                wx.hideLoading()
            },
        });
    });
};

module.exports = {
    apiUrl,
    request,
}
