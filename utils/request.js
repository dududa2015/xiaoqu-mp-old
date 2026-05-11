// api URL：仅开发者工具走测试；正式版、体验版均走生产
const API_URL_PROD = 'https://test.zhuzixi.cn/api'
const API_URL_TEST = 'https://test.zhuzixi.cn/api'
// const API_URL_TEST = 'http://localhost:5213/api'

function resolveApiUrl() {
  try {
    const { miniProgram } = wx.getAccountInfoSync()
    // develop: 开发者工具 → 测试；trial: 体验版、release: 正式版 → 生产
    if (miniProgram.envVersion === 'develop' || miniProgram.envVersion === 'trial') {
      return API_URL_TEST
    }
    return API_URL_PROD
  } catch (e) {
    console.warn('getAccountInfoSync failed, fallback to prod api', e)
  }
  return API_URL_PROD
}

const apiUrl = resolveApiUrl()

// 导入安全工具模块
const {
  generateSecurityHeaders
} = require('./security')

// 封装微信请求方法
const request = (params) => {
  let url = params.url;
  let data = params.data;
  let method = params.method || 'GET';

  // 对于 GET 请求，将 data 中的参数拼接到 url 中用于签名
  let urlForSigning = url;
  if (method.toUpperCase() === 'GET' && data) {
    const queryString = Object.keys(data)
      .map(key => {
        const value = data[key];
        // 只在 undefined 时才用空字符串，保留 false、0、null 等原始值
        const strValue = value === undefined ? '' : String(value);
        return `${key}=${encodeURIComponent(strValue)}`;
      })
      .join('&');
    if (queryString) {
      urlForSigning = `${url}?${queryString}`;
    }
  }

  // 生成安全请求头
  const securityHeaders = generateSecurityHeaders({
    method,
    url: urlForSigning,
    data
  });

  // 合并请求头（安全头优先级更高）
  let header = {
    "Content-Type": "application/json",
    ...securityHeaders
  };

  wx.showLoading({
    title: '正在加载',
  })

  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl + url, // api url
      method: method, // get/post
      data: data, // 请求参数
      header: header, // 头部
      timeout: 20000, // 设置20秒超时
      success(res) {
        // 处理安全相关错误
        if (res.statusCode === 401) {
          // Token无效或过期
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
        } else if (res.statusCode === 498) {
          // Token过期（自定义状态码，后端需要实现）
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none',
            duration: 2000
          })
          // 清除本地token
          wx.removeStorageSync('token')
          reject(res.data)
        } else if (res.statusCode === 499) {
          // 时间戳无效（自定义状态码，后端需要实现）
          wx.showToast({
            title: '请求时间戳无效',
            icon: 'none',
            duration: 2000
          })
          reject(res.data)
        } else if (res.statusCode === 497) {
          // 签名验证失败（自定义状态码，后端需要实现）
          wx.showToast({
            title: '请求签名验证失败',
            icon: 'none',
            duration: 2000
          })
          reject(res.data)
        } else if (res.statusCode === 500 || res.statusCode === 403 || res.statusCode === 400) {
          wx.showModal({
            content: res.data.message || res.data.error || '请求失败',
            showCancel: false
          })
          reject(res.data)
        } else {
          resolve(res.data)
        }
      },
      fail(err) {
        console.log('request error:', err)
        // 更详细的错误处理
        let errorMsg = '网络请求失败'
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorMsg = '请求超时，请检查网络连接'
          } else if (err.errMsg.includes('fail')) {
            errorMsg = '网络连接失败，请检查网络设置'
          }
        }
        wx.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 3000
        })
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