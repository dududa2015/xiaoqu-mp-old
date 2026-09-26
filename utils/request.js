/** 统一请求。选择环境域名，给 GET 拼查询串，并带上签名头。 */

const { generateSecurityHeaders } = require('./security')

/** 正式版接口。 */
const API_URL_PROD = 'https://mp.zhuzixi.cn/api'
/** 开发版和体验版接口，避免预览打到生产数据。 */
const API_URL_TEST = 'https://test.zhuzixi.cn/api'

/** 按小程序版本选域名。读不到版本时用正式环境。 */
function resolveApiUrl() {
  try {
    const { miniProgram } = wx.getAccountInfoSync()
    if (miniProgram.envVersion === 'develop' || miniProgram.envVersion === 'trial') {
      return API_URL_TEST
    }
  } catch (error) {}
  return API_URL_PROD
}

const apiUrl = resolveApiUrl()

// 把 GET 的 data 编成查询串。签名前会拼进 url，空值也保留 key。
function queryString(data) {
  if (!data) {
    return ''
  }
  return Object.keys(data)
    .map((key) => {
      const value = data[key]
      const text = value === undefined ? '' : String(value)
      return `${key}=${encodeURIComponent(text)}`
    })
    .join('&')
}

/**
 * 发请求。GET 先把 data 挪到 url 再签名，这样签名串里的查询参数和实际请求一致。
 * silent 为真时 POST 也不出加载框。quiet 为真时失败不弹 toast。
 * 498 表示登录态失效，清掉本地 token。
 */
function request(params) {
  let url = params.url
  let data = params.data
  const method = (params.method || 'GET').toUpperCase()
  if (method === 'GET' && data) {
    const query = queryString(data)
    if (query) {
      url += (url.indexOf('?') === -1 ? '?' : '&') + query
    }
    data = undefined
  }

  const header = {
    'Content-Type': 'application/json',
    ...generateSecurityHeaders({
      method,
      url,
      data
    })
  }
  const showLoading = !params.silent && method === 'POST'

  if (showLoading) {
    wx.showLoading({ title: '正在加载' })
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: apiUrl + url,
      method,
      data,
      header,
      timeout: 20000,
      success(res) {
        const status = res.statusCode
        if (status === 498) {
          wx.removeStorageSync('token')
        }
        if (status >= 400) {
          if (!params.quiet) {
            const message = (res.data && (res.data.message || res.data.error)) || '请求失败'
            wx.showToast({ title: message, icon: 'none' })
          }
          reject(res.data || status)
          return
        }
        resolve(res.data)
      },
      fail(error) {
        if (!params.quiet) {
          wx.showToast({ title: '网络请求失败', icon: 'none' })
        }
        reject(error)
      },
      complete() {
        if (showLoading) {
          wx.hideLoading()
        }
      }
    })
  })
}

module.exports = {
  apiUrl,
  request
}
