/**
 * 请求签名。每个接口带上时间戳、nonce 和 HMAC-SHA256。
 * 服务端用同一把密钥、同一条签名串重算，对不上就拒绝。
 * 密钥写在客户端，只能和服务端约定算法，不能当成机密。
 */

const CryptoJS = require('crypto-js')

// 与服务端约定的 HMAC 密钥。改动必须两边一起换，否则全部请求签名失败。
const HMAC_SECRET_KEY = 'JFha7JgQa(NoW@wW9k#jPQghZg!V%wexpGOdeloz5Ldshnghi!0%91%_-&6FIK4c'

/**
 * 生成 nonce，同时放进 X-Nonce 和 X-Request-ID。
 * 服务端在时间窗内拒绝重复 nonce，用来挡重放。
 * @param {number} length 字符数，默认 16
 * @returns {string}
 */
function generateNonce(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';
  for (let i = 0; i < length; i++) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return nonce;
}

/**
 * 当前 Unix 时间戳，单位秒。签名和 X-Timestamp 都用这个值。
 * @returns {number}
 */
function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * 把对象按 key 排序后拼成查询串。
 * null / undefined 的字段跳过，避免和“没传该字段”签出不同结果。
 * 对象和数组先 JSON 再编码。
 * @param {object} obj
 * @returns {string} 例如 a=1&b=2，没有前导 ?
 */
function sortAndSerialize(obj) {
  if (!obj || typeof obj !== 'object') {
    return '';
  }

  const keys = Object.keys(obj).sort();
  const pairs = keys.map(key => {
    const value = obj[key];
    if (value === null || value === undefined) {
      return '';
    }
    // 如果是对象或数组，转为JSON字符串
    if (typeof value === 'object') {
      return `${key}=${encodeURIComponent(JSON.stringify(value))}`;
    }
    return `${key}=${encodeURIComponent(String(value))}`;
  });

  return pairs.filter(p => p).join('&');
}

/**
 * 拆开路径和查询串，查询参数按 key 重排。
 * GET 会先把 data 拼到 url 上再签名，这里保证参数顺序不影响签名。
 * @param {string} url 路径，可带查询串，不含域名
 * @returns {{path: string, queryString: string}} queryString 带前导 ?，没有查询时为空串
 */
function parseAndSortQueryParams(url) {
  // 分离路径和查询参数
  const queryIndex = url.indexOf('?');
  let path = url;
  let queryString = '';

  if (queryIndex !== -1) {
    path = url.substring(0, queryIndex);
    const queryStringRaw = url.substring(queryIndex + 1);

    // 解析查询参数
    const params = {};
    if (queryStringRaw) {
      queryStringRaw.split('&').forEach(param => {
        const [key, value = ''] = param.split('=');
        try {
          params[key] = decodeURIComponent(value);
        } catch (e) {
          params[key] = value;
        }
      });
    }

    // 对参数排序并重新构建查询字符串
    queryString = sortAndSerialize(params);
    if (queryString) {
      queryString = '?' + queryString;
    }
  }

  return { path, queryString };
}

/**
 * 计算 HMAC-SHA256，输出 hex。
 * 签名串：|timestamp|nonce|METHOD|path|queryParams|requestId
 * token 和请求体不参与签名。改 body 不会让签名失败，服务端不能靠签名发现 body 被改。
 * @param {object} params
 * @param {string} params.token 登录态，只随 Authorization 发送
 * @param {number} params.timestamp 秒级时间戳
 * @param {string} params.nonce
 * @param {string} params.requestId 与 X-Request-ID 相同
 * @param {string} params.method HTTP 方法
 * @param {string} params.url 已带查询串的路径
 * @param {object} params.data 请求体，当前不写入签名串
 * @returns {{timestamp: number, nonce: string, signature: string}}
 */
function generateSignature(params) {
  const { timestamp, nonce, requestId, method, url } = params;

  // 查询参数先排序，再去掉前导 ? 放进签名串
  const { path: sortedPath, queryString: sortedQueryString } = parseAndSortQueryParams(url);
  let sortedQueryParams = '';
  if (sortedQueryString && sortedQueryString.startsWith('?')) {
    sortedQueryParams = sortedQueryString.substring(1);
  }

  const signString = `|${timestamp}|${nonce}|${method.toUpperCase()}|${sortedPath}|${sortedQueryParams}|${requestId}`;

  // hex，请求头 X-Sign-String 原样上传
  const signature = CryptoJS.HmacSHA256(signString, HMAC_SECRET_KEY)
    .toString(CryptoJS.enc.Hex)

  const response = {
    timestamp,
    nonce,
    signature // 加密后的签名
  };

  return response;
}

/**
 * 判断时间戳是否还在窗口内。真正挡重放要在服务端做同样判断，并记下已用过的 nonce。
 * @param {number} timestamp 秒
 * @param {number} maxAge 允许的偏差，默认 300 秒
 * @returns {boolean}
 */
function validateTimestamp(timestamp, maxAge = 300) {
  const now = getTimestamp();
  const diff = Math.abs(now - timestamp);
  return diff <= maxAge;
}

/**
 * 组装一次请求要用的安全头。upload 和 request 都走这里。
 * X-Timestamp / X-Nonce / X-Request-ID 参与签名；
 * Authorization、X-Device-Id 只标识用户和设备，不参与签名。
 * @param {object} options
 * @param {string} options.method
 * @param {string} options.url 签名用的路径。GET 必须已经拼好查询串
 * @param {object} options.data 请求体，当前不参与签名
 * @returns {object}
 */
function generateSecurityHeaders(options) {
  const { method, url, data } = options;

  // 登录接口返回后写入 storage，未登录时为空
  const token = wx.getStorageSync('token') || '';

  const timestamp = getTimestamp();
  const nonce = generateNonce();
  // 同一次请求里唯一。时间戳加 nonce，避免并发时撞车
  const requestId = `${timestamp}-${nonce}`;

  const signatureInfo = generateSignature({
    token,
    timestamp,
    nonce,
    requestId,
    method,
    url,
    data
  });

  // 启动时写入，没有就不带头
  const deviceId = wx.getStorageSync('deviceId') || '';

  const headers = {
    'Content-Type': 'application/json',
    'X-Timestamp': timestamp.toString(),
    'X-Nonce': nonce,
    'X-Request-ID': requestId,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (deviceId) {
    headers['X-Device-Id'] = deviceId;
  }

  headers['X-Sign-String'] = signatureInfo.signature;

  return headers;
}

module.exports = {
  generateNonce,
  getTimestamp,
  sortAndSerialize,
  parseAndSortQueryParams,
  generateSignature,
  validateTimestamp,
  generateSecurityHeaders
};
