const { apiUrl } = require('../utils/request')
const { generateSecurityHeaders } = require('../utils/security')

const UPLOAD_PATH = '/ImageUpload/CheckThenUploadToCos'

function compress(filePath) {
  if (!wx.compressImage) {
    return Promise.resolve(filePath)
  }
  return new Promise((resolve) => {
    wx.compressImage({
      src: filePath,
      quality: 75,
      success: (res) => resolve(res.tempFilePath || filePath),
      fail: () => resolve(filePath)
    })
  })
}

function uploadMarkerPhoto(filePath) {
  const header = generateSecurityHeaders({
    method: 'POST',
    url: UPLOAD_PATH,
    data: {}
  })
  delete header['Content-Type']
  return compress(filePath).then((path) => new Promise((resolve, reject) => {
    wx.uploadFile({
      url: apiUrl + UPLOAD_PATH,
      filePath: path,
      name: 'file',
      header,
      timeout: 120000,
      success(res) {
        let body = {}
        try {
          body = typeof res.data === 'string' ? JSON.parse(res.data) : (res.data || {})
        } catch (error) {
          reject(new Error('服务器响应异常'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body.objectKey || body.cosObjectKey || body.key || '')
          return
        }
        reject(new Error(body.message || '上传失败'))
      },
      fail(error) {
        reject(new Error((error && error.errMsg) || '网络错误'))
      }
    })
  }))
}

module.exports = {
  uploadMarkerPhoto
}
