/**
 * 图片压缩（替代仅用 wx.compressImage 的质量压缩）：先按最长边等比缩小像素，再导出 JPEG。
 *
 * 与 wx.compressImage 的区别：
 * - wx.compressImage：主要调 JPEG 质量，**几乎不改变宽高**，大图仍可能很大。
 * - compressImageToPath：先 **按最长边缩放画布尺寸**，再控制 JPEG 质量，更适合控体积、做封面图。
 *
 * @typedef {Object} CompressImageOptions
 * @property {number} [quality] 导出 JPEG 质量，范围建议 0.1～1，默认 0.75。
 * @property {number} [maxEdge] 最长边像素上限（宽、高中较大的一边不超过该值）。不传时默认 1920。
 */

/** 默认最长边像素上限 */
const DEFAULT_MAX_EDGE = 1314

/** 画布单边硬上限，避免部分机型 Canvas 尺寸报错 */
const CANVAS_EDGE_HARD_CAP = 4096

/** 右下角小程序图标（相对小程序根目录） */
const WATERMARK_CORNER_ICON_PATH = '/images/mp-icon.jpg'
/** 平铺斜向水印文案 */
const WATERMARK_TILE_TEXT = '小区楼号分布图'

/**
 * Android 上 canvas.createImage() 加载本地路径时 onload 不可靠（尤其第二张起）。
 * 解决方案：将图标用独立小画布加载一次，把已 onload 的 Image 对象缓存下来，
 * 后续每张照片直接 ctx.drawImage(cachedImg)，不再重复 createImage + onload。
 */
let _iconImgCache = null      // 已加载完成的 Image 对象
let _iconImgPromise = null    // 加载 Promise（防止并发重复加载）

/**
 * 由格坐标生成确定性「随机」角（弧度），同一张图导出结果稳定。
 * 范围约 -20° ~ +20°，含类似 15°、-10° 等中间值。
 * @param {number} i
 * @param {number} j
 * @returns {number}
 */
function watermarkAngleRad(i, j) {
  const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453
  const t = s - Math.floor(s)
  return (-20 + t * 40) * (Math.PI / 180)
}

/**
 * 整图平铺：格点上逐字绘制，每格绕中心旋转不同角度（见 watermarkAngleRad）。
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 */
function drawTiledRotatedWatermarkText(ctx, w, h) {
  const text = WATERMARK_TILE_TEXT
  const fontSize = Math.max(11, Math.round(Math.min(w, h) * 0.036))
  ctx.save()
  ctx.font = `${fontSize}px sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'center'
  const textW = ctx.measureText(text).width
  const stepX = textW + Math.max(14, Math.round(fontSize * 1.1))
  const stepY = Math.max(26, Math.round(fontSize * 2.25))
  const fillStyle = 'rgba(40, 40, 40, 0.2)'
  const margin = Math.max(stepX, stepY) * 2.5
  let j = 0
  for (let cy = -margin; cy < h + margin; cy += stepY, j++) {
    const stagger = (j % 2) * (stepX * 0.45)
    let i = 0
    for (let cx = -margin + stagger; cx < w + margin; cx += stepX, i++) {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(watermarkAngleRad(i, j))
      ctx.fillStyle = fillStyle
      ctx.fillText(text, 0, 0)
      ctx.restore()
    }
  }
  ctx.restore()
}

/**
 * 右下角绘制 mp 图标（相对上一版再约大一倍）。
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {any} iconImg
 */
function drawCornerMpIcon(ctx, w, h, iconImg) {
  if (!iconImg || !iconImg.width || !iconImg.height) return
  const pad = Math.max(6, Math.round(Math.min(w, h) * 0.018))
  const maxW = Math.min(160, Math.round(w * 0.96))
  let iconW = maxW
  let iconH = (iconW * iconImg.height) / iconImg.width
  let left = w - pad - iconW
  let top = h - pad - iconH
  if (top < pad) {
    iconH = Math.max(32, h - 2 * pad)
    iconW = (iconH * iconImg.width) / iconImg.height
    left = w - pad - iconW
    top = h - pad - iconH
  }
  if (left < pad) {
    iconW = Math.max(32, w - 2 * pad)
    iconH = (iconW * iconImg.height) / iconImg.width
    left = w - pad - iconW
    top = h - pad - iconH
  }
  ctx.save()
  ctx.globalAlpha = 0.93
  ctx.drawImage(iconImg, left, top, iconW, iconH)
  ctx.restore()
}

/**
 * 在已绘制主图的画布上：先斜向平铺「小区楼号分布图」，再叠右下角 mp 图标。
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {any} iconImg 已加载的 mp-icon，失败时仅平铺文字
 */
function drawWatermarkOnPhoto(ctx, w, h, iconImg) {
  try {
    drawTiledRotatedWatermarkText(ctx, w, h)
  } catch (e) {
    console.warn('[image-compress] tiled watermark', e)
  }
  try {
    drawCornerMpIcon(ctx, w, h, iconImg)
  } catch (e) {
    console.warn('[image-compress] corner icon', e)
  }
}

/**
 * 预加载角标图标，整个小程序生命周期内只执行一次：
 * 1. 用 FileSystem 将图标读为 base64 data URL（绕开 Android 本地路径问题）
 * 2. 用独立的小画布 createImage + onload 把图标加载到内存
 * 3. 缓存已加载的 Image 对象 _iconImgCache
 *
 * 后续每张照片直接用 _iconImgCache 调用 ctx.drawImage()，
 * 完全避免在 img.onload 内部再次 createImage 导致 Android 不触发 onload 的问题。
 *
 * @returns {Promise<any|null>} 已加载的 Image 对象，失败时返回 null
 */
function preloadIconImg() {
  if (_iconImgCache) return Promise.resolve(_iconImgCache)
  if (_iconImgPromise) return _iconImgPromise

  _iconImgPromise = new Promise((resolve) => {
    // Step 1：读取为 base64 data URL
    let dataUrl = null
    try {
      wx.getFileSystemManager().readFile({
        filePath: WATERMARK_CORNER_ICON_PATH,
        encoding: 'base64',
        success(res) {
          dataUrl = 'data:image/jpeg;base64,' + res.data
          loadImageFromDataUrl(dataUrl)
        },
        fail() {
          resolve(null)
        }
      })
    } catch (e) {
      resolve(null)
      return
    }

    // Step 2：用独立画布把 data URL 加载为 Image 对象
    function loadImageFromDataUrl(url) {
      if (typeof wx.createOffscreenCanvas !== 'function') {
        resolve(null)
        return
      }
      let tmpCanvas
      try {
        // 1×1 画布仅用于触发 createImage，不影响图标实际尺寸
        tmpCanvas = wx.createOffscreenCanvas({ type: '2d', width: 1, height: 1 })
      } catch (e) {
        resolve(null)
        return
      }
      const img = tmpCanvas.createImage()
      let done = false
      const finish = (result) => {
        if (done) return
        done = true
        _iconImgCache = result
        resolve(result)
      }
      const timer = setTimeout(() => {
        console.warn('[image-compress] icon preload timeout')
        finish(null)
      }, 6000)
      img.onload = () => {
        clearTimeout(timer)
        finish(img)
      }
      img.onerror = () => {
        clearTimeout(timer)
        console.warn('[image-compress] icon preload error')
        finish(null)
      }
      img.src = url
    }
  })

  return _iconImgPromise
}

/**
 * @param {number} w
 * @param {number} h
 * @param {number} maxEdge
 * @returns {{ width: number, height: number }}
 */
function computeTargetSize(w, h, maxEdge) {
  const nw = Math.max(1, Math.floor(Number(w)) || 1)
  const nh = Math.max(1, Math.floor(Number(h)) || 1)
  const cap = Math.min(Math.max(1, maxEdge), CANVAS_EDGE_HARD_CAP)
  const long = Math.max(nw, nh)
  const scale = long <= cap ? 1 : cap / long
  return {
    width: Math.max(1, Math.round(nw * scale)),
    height: Math.max(1, Math.round(nh * scale))
  }
}

/**
 * 使用离屏 2d Canvas：读图 → 等比缩放到目标宽高 → 叠水印 → 导出临时 JPG。
 * @param {string} src
 * @param {number} width
 * @param {number} height
 * @param {number} quality 0.1 ~ 1
 * @param {any|null} iconImg 已预加载的角标 Image 对象（可为 null，仅绘文字水印）
 * @returns {Promise<string>}
 */
function exportScaledJpegWithOffscreenCanvas(src, width, height, quality, iconImg) {
  return new Promise((resolve, reject) => {
    if (typeof wx.createOffscreenCanvas !== 'function') {
      reject(new Error('createOffscreenCanvas unavailable'))
      return
    }
    let canvas
    try {
      canvas = wx.createOffscreenCanvas({ type: '2d', width, height })
    } catch (e) {
      reject(e)
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('getContext 2d failed'))
      return
    }
    const img = canvas.createImage()
    img.onload = () => {
      try {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        // iconImg 是在 compressImageToPath 里预加载好的，此处直接使用，不再 createImage
        drawWatermarkOnPhoto(ctx, width, height, iconImg)
      } catch (e) {
        console.warn('[image-compress] watermark draw', e)
      }
      wx.canvasToTempFilePath({
        canvas,
        x: 0,
        y: 0,
        width,
        height,
        destWidth: width,
        destHeight: height,
        fileType: 'jpg',
        quality,
        success(res) {
          if (res && res.tempFilePath) {
            resolve(res.tempFilePath)
          } else {
            reject(new Error('canvasToTempFilePath empty path'))
          }
        },
        fail(err) {
          reject(err || new Error('canvasToTempFilePath fail'))
        }
      })
    }
    img.onerror = () => {
      reject(new Error('createImage load fail'))
    }
    img.src = src
  })
}

/**
 * 仅调 wx.compressImage（不改变像素尺寸），作兜底。
 * @param {string} src
 * @param {number} quality01 0~1
 * @returns {Promise<string>}
 */
function fallbackWxCompressImage(src, quality01) {
  const q = Math.max(10, Math.min(100, Math.round(quality01 * 100)))
  return new Promise((resolve) => {
    wx.compressImage({
      src,
      quality: q,
      success(r) {
        resolve(r.tempFilePath || src)
      },
      fail() {
        resolve(src)
      }
    })
  })
}

/**
 * @param {CompressImageOptions} [options]
 * @returns {{ maxEdge: number, quality: number }}
 */
function normalizeOptions(options) {
  const o = options && typeof options === 'object' ? options : {}
  let maxEdge = o.maxEdge
  if (maxEdge == null || !Number.isFinite(maxEdge)) {
    maxEdge = DEFAULT_MAX_EDGE
  }
  maxEdge = Math.max(32, Math.min(CANVAS_EDGE_HARD_CAP, Math.floor(maxEdge)))

  let quality = o.quality
  if (quality == null || !Number.isFinite(quality)) {
    quality = 0.75
  }
  quality = Math.max(0.1, Math.min(1, quality))

  return { maxEdge, quality }
}

/**
 * 将本地图片压缩（缩放 + JPEG）后返回新的临时路径；失败时回退 wx.compressImage，再失败返回原路径。
 *
 * @param {string} src 本地临时路径（如 wxfile://、http://tmp/…）
 * @param {CompressImageOptions} [options]
 * @returns {Promise<string>}
 */
function compressImageToPath(src, options) {
  const { maxEdge, quality } = normalizeOptions(options)
  return new Promise((resolve) => {
    // 与 getImageInfo 并发预加载图标（只加载一次，后续命中缓存立即返回）
    const iconPromise = preloadIconImg()
    wx.getImageInfo({
      src,
      success(info) {
        const { width, height } = info
        const { width: tw, height: th } = computeTargetSize(width, height, maxEdge)
        // 让出主线程：部分 Android 连续第二张在 getImageInfo 后立即进离屏 Canvas 会卡住
        setTimeout(() => {
          iconPromise.then((iconImg) => {
            exportScaledJpegWithOffscreenCanvas(src, tw, th, quality, iconImg)
              .then(resolve)
              .catch((e) => {
                console.warn('[image-compress] offscreen canvas failed, use wx.compressImage', e)
                fallbackWxCompressImage(src, quality).then(resolve)
              })
          })
        }, 80)
      },
      fail() {
        fallbackWxCompressImage(src, quality).then(resolve)
      }
    })
  })
}

module.exports = {
  compressImageToPath,
  computeTargetSize,
  DEFAULT_MAX_EDGE
}
