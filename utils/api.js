const app = getApp()

const request = (url, options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: url,
      method: options.method,
      data: options.method === 'GET' ? options.data : options.data,
      header: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
        // 'x-token': 'x-token'  // 看自己是否需要
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail(error) {
        reject(error.data)
      }
    })
  })
}

const get = (url, options = {}) => {
  return request(url, { method: 'GET', data: options })
}

const post = (url, options) => {
  return request(url, { method: 'POST', data: options })
}

const put = (url, options) => {
  return request(url, { method: 'PUT', data: options })
}

// 不能声明DELETE（关键字）
const remove = (url, options) => {
  return request(url, { method: 'DELETE', data: options })
}

module.exports = {
  get,
  post,
  put,
  remove
}