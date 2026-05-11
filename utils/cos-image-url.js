/**
 * 腾讯云 COS + 数据万象：在图片访问 URL 上追加 200×200 缩略规则（等比落在 200×200 框内）。
 * 仅对 http(s) 生效；本地临时路径原样返回。
 * 若链接已含 imageView2/ 则不再追加。
 * 注意：部分带严格签名的预签名 URL 追加参数可能导致 403，需控制台/后端允许数据处理或与签名规则一致。
 */
const THUMB_RULE = 'imageView2/2/w/200/h/200'

function cosImageUrlThumb200(url) {
  if (!url || typeof url !== 'string') return url
  if (!/^https?:\/\//i.test(url)) return url
  if (url.includes('imageView2/')) return url
  const sep = url.includes('?') ? '&' : '?'
  return url + sep + THUMB_RULE
}

module.exports = {
  cosImageUrlThumb200,
}
