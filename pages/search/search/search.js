import {
  getAmapPoiListByKeyword
} from '../../../apis/amap-apis'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    timer: null, // 存储定时器
    searchDelay: 1000, // 防抖延迟时间（毫秒）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.init()
  },
  init() {
    let poiList = wx.getStorageSync('poiList') || []
    this.setData({
      poiList
    })
  },
  bindInput(e) {
    const value = e.detail.value; // 获取输入内容

    // 清除之前的定时器
    if (this.data.timer) {
      clearTimeout(this.data.timer);
    }

    // 设置新的定时器，延迟执行搜索
    this.setData({
      timer: setTimeout(() => {
        if (!value || value.trim().length === 0) {
          console.log('空')
          this.init()
          return
        }
        this.getAmapPoiListByKeyword(value); // 实际查询逻辑
      }, this.data.searchDelay)
    });
  },
  getAmapPoiListByKeyword(keywords) {
    let city = wx.getStorageSync('city')

    getAmapPoiListByKeyword({
      keywords,
      region: city
    }).then(res => {
      let poiList = res.map(item => {
        // 解析经纬度
        const [longitude, latitude] = item.location.split(',').map(Number);
        // 拼接完整地址
        const fullAddress = `${item.pname}${item.cityname}${item.address}`;
        // 返回转换后的对象
        return {
          address: fullAddress,
          latitude: latitude,
          longitude: longitude,
          name: item.name
        };
      })
      this.setData({
        poiList
      })
    })
  },
  //选择
  onChoose(e) {
    let poi = e.currentTarget.dataset.item
    let poiList = wx.getStorageSync('poiList') || []
    if (poi) {
      // 检查数组中是否已存在相同name的项
      const index = poiList.findIndex(item => item.name === poi.name);
      // 如果不存在则推入新项
      if (index == -1) {
        if (poiList.length >= 10) {
          poiList.pop()
        }
        poiList.unshift(poi);
      } else {
        debugger
        // 从原位置移除该项
        const [movedItem] = poiList.splice(index, 1);
        // 添加到数组开头
        poiList.unshift(movedItem);
      }
    }
    wx.setStorageSync('poi', poi)
    wx.setStorageSync('poiList', poiList)
    wx.navigateBack()
  },
  onClear() {
    wx.showModal({
      content: '确认要清空全部历史记录？',
      complete: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('poiList')
          this.init()
        }
      }
    })
  },
  moveItemToFront(list, selectedItem) {
    // 找到选中项的索引
    const index = list.findIndex(item => item.id === selectedItem.id); // 假设用 id 匹配

    if (index !== -1) {
      // 从原位置移除该项
      const [movedItem] = list.splice(index, 1);
      // 添加到数组开头
      list.unshift(movedItem);
    }

    return list;
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