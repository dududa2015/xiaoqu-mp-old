// pages/help1/help1.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    show: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let userInfo = wx.getStorageSync('userInfo')
    let ts = parseInt(userInfo.createdDate.match(/\d+/)[0])
    let createdDate = new Date(ts)
    //从2024年9月1日开始到上一个小时可以显示
    if (createdDate > this.getAuguest() && createdDate < this.lastHour()) {
      this.setData({
        show: true
      })
    }
  },
  //从2024年9月1日开始
  getAuguest() {
    return new Date(2024, 8, 1)
  },
  lastMonth() {
    let currentDate = new Date();
    // 先获取当前月份（注意月份是从0开始计数的，即0表示一月，11表示十二月）
    let currentMonth = currentDate.getMonth();
    // 获取当前年份
    let currentYear = currentDate.getFullYear();

    // 将月份减1
    let newMonth = currentMonth - 1;

    // 如果新的月份小于0，说明需要跨年，将年份减1，并将月份设置为11（十二月）
    if (newMonth < 0) {
      currentYear--;
      newMonth = 11;
    }

    // 创建新的Date对象，设置为减去一个月后的日期
    let newDate = new Date(currentYear, newMonth, currentDate.getDate());
    return newDate
  },
  lastDay() {
    // 创建表示当前日期和时间的Date对象
    let currentDate = new Date();

    // 获取当前日期的时间戳（从1970年1月1日00:00:00 UTC到当前日期时间的毫秒数）
    let currentTimestamp = currentDate.getTime();

    // 减去1天对应的毫秒数（1天 = 24小时 * 60分钟 * 60秒 * 1000毫秒）
    let oneDayInMillis = 24 * 60 * 60 * 1000;
    let newTimestamp = currentTimestamp - oneDayInMillis;

    // 根据新的时间戳创建新的Date对象
    let newDate = new Date(newTimestamp);
    return new Date
  },
  lastHour() {
    // 创建表示当前日期和时间的Date对象
    let currentDate = new Date();

    // 获取当前日期的时间戳（从1970年1月1日00:00:00 UTC到当前日期时间的毫秒数）
    let currentTimestamp = currentDate.getTime();

    // 减去1小时对应的毫秒数（1小时 = 60分钟 * 60秒 * 1000毫秒）
    let oneHourInMillis = 60 * 60 * 1000;
    let newTimestamp = currentTimestamp - oneHourInMillis;

    // 根据新的时间戳创建新的Date对象
    let newDate = new Date(newTimestamp);

    return newDate
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})