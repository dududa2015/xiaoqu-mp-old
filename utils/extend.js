// extends.js
// 设置默认参数
const toast = ({ title = '数据加载中...', icon = 'none', duration = 2000, mask = true } = {}) => {
  wx.showToast({
    title,
    icon,
    duration,
    mask
  })
}
// 将封装的模块挂载到 wx 全局对象身上
wx.toast = toast
