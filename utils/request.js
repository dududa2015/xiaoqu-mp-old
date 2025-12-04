// api URL
const apiUrl = "http://localhost:5213/api"
// const apiUrl = "https://test.zhuzixi.cn/api"
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
          // #if MP
          wx.showToast({
            title: 'invalid token',
            icon: 'none'
          })
          // #else
          wx.showModal({
            title: '登录提示',
            content: '需要先登录才能进行操作',
            showCancel: false,
            success(res) {
              if (res.confirm) {
                let path = ''
                // #if IOS
                wx.navigateTo({
                  url: '/pages/ios/login/login'
                })
                // #elif ANDROID
                wx.navigateTo({
                  url: '/pages/android/login/login'
                })
                // #endif
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          })
          // #endif
          reject('')
        } else if (res.statusCode === 500 || res.statusCode === 403) {
          wx.showModal({
            title: res.data.title,
            content: res.data.message,
            showCancel: false
          })
          reject('')
        } else {
          resolve(res.data)
        }
      },
      fail(err) {
        console.log('request', err)
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