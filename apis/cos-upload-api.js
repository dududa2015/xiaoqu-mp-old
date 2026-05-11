const { apiUrl } = require('../utils/request')
const { generateSecurityHeaders } = require('../utils/security')
const { compressImageToPath } = require('../utils/image-compress')

const UPLOAD_PATH = '/ImageUpload/CheckThenUploadToCos'

function headersForMultipart() {
  const h = generateSecurityHeaders({
    method: 'POST',
    url: UPLOAD_PATH,
    data: {}
  })
  delete h['Content-Type']
  return h
}

/**
 * 先审后发：服务端 img_sec_check + COS，表单字段名 file。
 * @param {string} filePath 本地临时路径
 * @returns {Promise<{objectKey:string, publicUrl?:string, contentType:string, size:number}>}
 */
function uploadMarkerPhoto(filePath) {
  const header = headersForMultipart()
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: apiUrl + UPLOAD_PATH,
      filePath,
      name: 'file',
      header,
      timeout: 120000,
      success(res) {
        let body = {}
        try {
          body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
        } catch (e) {
          reject(new Error('服务器响应异常'))
          return
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body)
          return
        }
        reject(new Error(body.message || `上传失败(${res.statusCode})`))
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络错误'))
      }
    })
  })
}

/**
 * 压缩后再传，尽量满足 img_sec_check 1MB 与尺寸限制。
 * 默认走 {@link ../utils/image-compress.compressImageToPath}（缩放 + JPEG）；入参与旧版兼容。
 *
 * @param {string} src wxfile:// 或临时路径
 * @param {number | { quality?: number, maxEdge?: number }} [qualityOrOptions]
 *   - 传 **数字**：视为 JPEG 质量 **0～100**（如 72 → 0.72），等价仅调 `quality`，仍会做默认最长边 1920 的像素缩放。
 *   - 传 **对象**：与 `compressImageToPath` 一致，例如 `{ maxEdge: 1280, quality: 0.8 }` 自定义。
 * @returns {Promise<string>} 可用于 uploadMarkerPhoto 的路径
 */
function compressThenPath(src, qualityOrOptions = 75) {
  let opts
  if (typeof qualityOrOptions === 'number') {
    const q = Math.max(0.1, Math.min(1, qualityOrOptions / 100))
    opts = { quality: q }
  } else {
    const o = qualityOrOptions || {}
    let q = o.quality
    if (q == null) {
      q = 0.75
    } else if (q > 1) {
      q = q / 100
    }
    opts = {
      quality: Math.max(0.1, Math.min(1, q)),
      maxEdge: o.maxEdge
    }
  }
  return compressImageToPath(src, opts)
}

module.exports = {
  uploadMarkerPhoto,
  compressThenPath,
  compressImageToPath
}
