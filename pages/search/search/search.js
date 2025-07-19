const { suggestion } = require(`../../../apis/${getApp().globalData.mapType}-apis`);
import {
  convertToKilometers
} from '../../../utils/util'
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
        this.suggestion(value); // 实际查询逻辑
      }, this.data.searchDelay)
    });
  },
  suggestion(keywords) {
    let city = wx.getStorageSync('city')
    let latitude = wx.getStorageSync('latitude')
    let longitude = wx.getStorageSync('longitude')
    suggestion({
      longitude,
      latitude,      
      keywords,
      city,
    }).then(res => {
      // 在 map 中跳过无效项（返回 null 再过滤）。因为搜索北京市或深圳市的时候，location会是[],
      // 检查location是否有效和filter(Boolean);是为了自动过滤null/undefined
      let poiList = res.map(item => {
        // 返回转换后的对象
        return {
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          name: item.name,
          hightlightName: this.getHighlightText(item.name, keywords),
          distance: convertToKilometers(item.distance)
        };
      }).filter(Boolean); // 自动过滤null/undefined
      console.log(poiList)
      this.setData({
        poiList
      })
    })
  },
  // 生成高亮文本
  getHighlightText(text, keyword) {
    const regex = new RegExp(keyword, 'gi')
    return text.replace(regex, match => {
      return `<span style="color: #0074FE;">${match}</span>`
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
        //不要distance
        poiList.unshift({
          address: poi.address,
          latitude: poi.latitude,
          longitude: poi.longitude,
          name: poi.name
        });
      } else {
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