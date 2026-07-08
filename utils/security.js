/**
 * 安全校验工具模块 - HMAC-SHA256 版
 * 提供请求签名、时间戳、nonce等安全机制
 *
 * 安全说明：使用 HMAC-SHA256 加密签名，防止请求被伪造和篡改
 */

// 导入 crypto-js 用于 HMAC-SHA256 加密
const CryptoJS = require('crypto-js')

// HMAC 签名密钥（生产环境应该从服务器获取或配置）
const HMAC_SECRET_KEY = 'JFha7JgQa(NoW@wW9k#jPQghZg!V%wexpGOdeloz5Ldshnghi!0%91%_-&6FIK4c'

/**
 * 生成随机字符串（用于nonce）
 * @param {number} length 字符串长度
 * @returns {string} 随机字符串
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
 * 获取当前时间戳（秒）
 * @returns {number} 时间戳
 */
function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

/**
 * 对对象进行排序并序列化
 * @param {object} obj 要排序的对象
 * @returns {string} 排序后的查询字符串
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
 * 解析URL中的查询参数并排序
 * @param {string} url URL字符串
 * @returns {object} 包含path和sortedQueryString的对象
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
 * 生成请求签名（HMAC-SHA256）
 * 签名算法：HMAC-SHA256(|timestamp|nonce|METHOD|path|queryParams|requestId)
 * @param {object} params 签名参数
 * @param {string} params.token 用户token（不参与签名）
 * @param {number} params.timestamp 时间戳
 * @param {string} params.nonce 随机字符串
 * @param {string} params.requestId 请求唯一标识（与 X-Request-ID 一致）
 * @param {string} params.method HTTP方法
 * @param {string} params.url 请求URL
 * @param {object} params.data 请求数据
 * @returns {object} 签名信息对象
 */
function generateSignature(params) {
  const { token, timestamp, nonce, requestId, method, url, data } = params;

  // 对URL中的查询参数进行排序（重要修复）
  const { path: sortedPath, queryString: sortedQueryString } = parseAndSortQueryParams(url);

  // 解析查询参数（去掉开头的 ?）
  let sortedQueryParams = '';
  if (sortedQueryString && sortedQueryString.startsWith('?')) {
    sortedQueryParams = sortedQueryString.substring(1);
  }

  // 对请求体参数进行排序
  const sortedParams = sortAndSerialize(data || {});

  // 构建签名字符串（不包含token）
  // 格式：|timestamp|nonce|METHOD|path|queryParams|requestId
  const signString = `|${timestamp}|${nonce}|${method.toUpperCase()}|${sortedPath}|${sortedQueryParams}|${requestId}`;

  // 使用 HMAC-SHA256 加密
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
 * 验证时间戳是否在有效范围内（防止重放攻击）
 * @param {number} timestamp 时间戳
 * @param {number} maxAge 最大有效期（秒），默认5分钟
 * @returns {boolean} 是否有效
 */
function validateTimestamp(timestamp, maxAge = 300) {
  const now = getTimestamp();
  const diff = Math.abs(now - timestamp);
  return diff <= maxAge;
}

/**
 * 生成安全请求头
 * @param {object} options 请求选项
 * @param {string} options.method HTTP方法
 * @param {string} options.url 请求URL
 * @param {object} options.data 请求数据
 * @returns {object} 安全请求头对象
 */
function generateSecurityHeaders(options) {
  const { method, url, data } = options;

  // 获取token
  const token = wx.getStorageSync('token') || '';

  // 生成时间戳和nonce
  const timestamp = getTimestamp();
  const nonce = generateNonce();
  const requestId = `${timestamp}-${nonce}`;

  // 生成签名信息（包含 HMAC-SHA256 加密的签名）
  const signatureInfo = generateSignature({
    token,
    timestamp,
    nonce,
    requestId,
    method,
    url,
    data
  });

  // 获取设备ID（从小程序存储中读取）
  const deviceId = wx.getStorageSync('deviceId') || '';

  // 构建安全请求头
  const headers = {
    'Content-Type': 'application/json',
    'X-Timestamp': timestamp.toString(),
    'X-Nonce': nonce,
    'X-Request-ID': requestId,
  };

  // 如果有token，添加到Authorization头
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // 如果有设备ID，添加到X-Device-Id头
  if (deviceId) {
    headers['X-Device-Id'] = deviceId;
  }

  // 将 HMAC-SHA256 加密后的签名添加到请求头
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
