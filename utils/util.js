const { words, auditedList } = require('./const.js');
import api from './api.js'
import {
  updateBdRecordCount
} from './apis'
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatDate = date => {
  const year = date.getFullYear(); // 获取年份  
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 获取月份并补零  
  const day = String(date.getDate()).padStart(2, '0'); // 获取日期并补零  

  return `${year}${month}${day}`; // 拼接成 YYYYMMDD 格式  
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}
const isStringNumber = value => {
  return !isNaN(value) && value.trim() !== '';
}
const convertToKilometers = meters => {
  if (meters > 1000) {
    return (meters / 1000).toFixed(1) + '公里'; // 转换为公里  
  }
  return meters + '米'; // 返回米  
}
//日期转换
const convertDate = inputDateTime => {
    const date = new Date(inputDateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const convertSecondsToHMS = seconds => {
  let hms = ''
  var h = Math.floor(seconds / 3600); // 计算小时数  
  var m = Math.floor((seconds % 3600) / 60); // 计算分钟数  
  var s = seconds % 60; // 计算秒数  
  if (h !== 0) {
    hms = `${h}小时`
  }
  if (m !== 0) {
    hms += `${m}分钟`
  }
  if (s !== 0) {
    hms += `${s}秒`
  }
  return hms
}

const generateRandom10DigitNumber = () => {
  // 生成一个在10^9 (1000000000)到10^10 (10000000000)之间的随机整数  
  const min = 1000000000; // 10位数的最小值  
  const max = 9999999999; // 10位数的最大值  
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomNumber;
}
//根据lat和lng生成xId
const generateXId = (lat, lng) => {
  //去掉小数点6位后的数字，lng只保留五位，防止17位数字丢失精度
  let truncatedLat = Math.floor(lat * 1000000).toString()
  let truncatedLng = Math.floor(lng * 1000000).toString()
  let latStr = truncatedLat.substring(truncatedLat.length - 8);
  let lngStr = truncatedLng.substring(truncatedLng.length - 7);
  return latStr + lngStr;
}
const checkWords = name => {
  name = name.toUpperCase()
  for (const word of words) {
    if (name.includes(word.toUpperCase())) {
      return false
    }
    //如果关键字是2个字，比如垃圾。如果用户输入的是"垃工圾",也返回false
    if (word.length === 2) {
      const char1 = word[0].toUpperCase()
      const char2 = word[1].toUpperCase()
      // if (name.includes(char1) && name.includes(char2)) {
      //   return false
      // }
      let index1 = name.indexOf(char1)
      let index2 = name.indexOf(char2)
      if (index1 > -1 && index2 > -1 && index1 < index2) {
        return false
      }
    }
  }
  return true
}

//是否有连续的四个及以上的数字，返回true表示违规
const hasConsecutive4Digits = input => {
  const regex = /\d{4}/;
  return regex.test(str);
}
//不能出现4个及4个以上的数字，包含中文数字，返回true表不通过
const checkChineseNumbers = input => {
  let list = ['号', '幢', '座', '栋', '单元', '层', '房号', '区', '楼宇', '片区'];
  // 使用正则表达式匹配中文数字"一"到"十" (这里我们用中文字符表示)  
  const regex = /[0123456789零一二三四五六七八九十零壹贰叁肆伍陆柒捌玖拾①②③④⑤⑥⑦⑧⑨⑩]/g;
  // 找到所有匹配的结果  
  const matches = input.match(regex);
  // 检查匹配的数量,4个及以上且未包含数组中的词，则不通过
  // 2024-11-8修改if (matches && matches.length > 3 && !list.some(w => input.includes(w))) {  
  //2024-11-28改为>5
  if (matches && matches.length > 5) {
    return true;
  }
  return false; // 不超过两个中文数字  
}
//文本校验
const msgSecCheck = msg => {
  wx.showLoading({
    title: '正在校验',
    mask: true
  })
  return new Promise((resolve, reject) => {
    let t = this;
    api.post('https://zhuzixi.cn/louhao/lh.asmx/msgSecCheck', {
      content: msg,
    }).then(res => {
      wx.hideLoading()
      if (res.errcode === "87014") {
        wx.showToast({
          title: '输入有违规内容',
          icon: 'error',
          mask: true
        })
        resolve(false)
      } else {
        resolve(true)
      }
    }).catch(err => {
      reject(err)
    })
  });
}

const getBdAround = (latlng, page_num) => {
  let createdDate = formatDate(new Date())
  updateBdRecordCount(JSON.stringify(createdDate))
  const param = {
    query: '内部楼栋',
    location: latlng,
    radius: 500,
    output: 'json',
    // ak: '1dOeeCbIp4xNrKWvZJSMuINxJkXEMd7E',
    ak: 'ZGxOCttOM3lg7sxfONimtvt4wic3dfRC',
    page_size: 20,
    page_num,
    coord_type: 2,
    ret_coordtype: 'gcj02ll'
  }
  return new Promise((resolve, reject) => {
    api.get('https://api.map.baidu.com/place/v2/search', param).then(res => {
      resolve(res)
    }).catch(err => {
      reject(err)
    })
  });
}
//从缓存中取颜色,如果过期了，则返回默认色
const getColorFromStorage = n => {
  const colorExpiredDate = new Date(wx.getStorageSync('colorExpiredDate'))
  const color = wx.getStorageSync('color')
  //有部分人callout的bgColor是白色的，怀疑缓存中color不存在，所以增加了长度为7的判断
  //为啥会这样，不太清楚
  if (colorExpiredDate > new Date() && color.length === 7) {
    return wx.getStorageSync('color')
  } else {
    return '#0074FE'
  }
}
//根据类型获取背景色
const getBgColorByType = (type) => {
  let bgColor = ''
  if (type === 0) {
    bgColor = '#0074FE'
  } else if (type === 1) {
    bgColor = '#E85827'
  } else if (type >= 2 && type <= 6) {
    bgColor = '#8c444f'
  } else if (type === 7) {
    bgColor = '#3CB371'
  } else {
    bgColor = '#dc143c'
  }
  return bgColor
}

function isPointOnSegment(p, q, r) {
  if (q.latitude <= Math.max(p.latitude, r.latitude) &&
    q.latitude >= Math.min(p.latitude, r.latitude) &&
    q.longitude <= Math.max(p.longitude, r.longitude) &&
    q.longitude >= Math.min(p.longitude, r.longitude)) {
    return true;
  }
  return false;
}

// 判断点是否在折线上的主函数
const isPointOnPolyline = (point, polyline) => {
  for (let i = 0; i < polyline.length - 1; i++) {
    const start = polyline[i];
    const end = polyline[i + 1];
    if (isPointOnSegment(start, point, end)) {
      return true;
    }
  }
  return false;
}

//是否由数字+['号', '幢', '座', '栋', '单元', '层', '房号', '区', '楼宇', '片区']其中的一个字符串组成，且数字不能超过3个
const checkString = (s) => {
  //如果包含了这些常量，直接通过审核
  if (auditedList.includes(s)) {
    return true
  }
  // 定义特殊字符数组
  const specialChars = ['号', '号楼', '幢', '座', '栋', '单元', '层', '房号', '区', '楼宇', '片区', '期'];
  // 检查是否只包含3位及以下纯数字
  const isShortNumeric = /^\d{1,3}$/.test(s);

  // 检查是否只包含1位纯字母
  const isSingleAlphabetic = /^[A-Za-z]$/.test(s);

  // 检查是否包含指定的特殊字符之一并且前面有3位及以下数字（不允许字母）
  const containsSpecialCharWithNumbers = specialChars.some(char => s.includes(char)) && /^\d{1,3}[\u4e00-\u9fa5]+$/.test(s);

  // 检查是否以单个字母开头，后跟指定的特殊字符（不允许数字）
  const isSingleLetterWithSpecialChar = /^[A-Za-z][\u4e00-\u9fa5]+$/.test(s) && !/\d/.test(s);

  // 检查是否包含一个'-'符号，并且'-前后没有字母和数字的混合'
  const containsDash = /^(-$|^[A-Za-z]-[A-Za-z]$|^\d{0,3}-\d{0,3}$)/.test(s); // 允许单独的'-'，或者'-前后全为字母或全为数字'
  return isShortNumeric || isSingleAlphabetic || containsSpecialCharWithNumbers || containsDash || isSingleLetterWithSpecialChar;
}
//根据vip过期时间判断是否vip
const isAppVip = (expiredDate) => {
     
  }

module.exports = {
  formatTime,
  formatDate,
  isStringNumber,
  convertToKilometers,
  convertSecondsToHMS,
  convertDate,
  generateRandom10DigitNumber,
  generateXId,
  checkWords,
  hasConsecutive4Digits,
  checkChineseNumbers,
  msgSecCheck,
  getBdAround,
  getColorFromStorage,
  getBgColorByType,
  isPointOnPolyline,
  checkString
}
