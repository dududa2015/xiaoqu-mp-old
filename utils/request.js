const API_URL_PROD = 'https://mp.zhuzixi.cn/api'
const API_URL_TEST = 'https://test.zhuzixi.cn/api'
const { generateSecurityHeaders } = require('./security')

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
