// const { explore } = require(`../../../apis/${getApp().globalData.mapType}-apis`);
const apis = {
  tmap: require('../../../apis/tmap-apis'),
  amap: require('../../../apis/amap-apis')
};
const { explore } = apis[getApp().globalData.mapType];
Page({
  data: {
    statusBarHeight: 0, // 状态栏高度
    navHeight: 44, // 导航栏高度
    position: 'right',
    bottom: 120,
    index: 0,
    markerBounce: false, //标记点弹跳动画状态
  },
  onShow() {
    let poi = wx.getStorageSync('poi')
    if (poi) {
      let latitude = parseFloat(poi.latitude)
      let longitude = parseFloat(poi.longitude)
      this.mapCtx.moveToLocation({
        latitude,
        longitude
      })
      this.getAroundByLocation(longitude, latitude)
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let latitude = wx.getStorageSync('latitude')
    let longitude = wx.getStorageSync('longitude')
    this.mapCtx = wx.createMapContext('searchMap')
    let position = wx.getStorageSync('position') || 'right'
    this.setData({
      longitude,
      latitude,
      position
    })
    this.initNavBar()
    this.getAroundByLocation(longitude, latitude)
  },
  initNavBar() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
      navHeight: systemInfo.platform === 'android' ? 48 : 44
    })
  },
  onPoiChange(e) {
    const index = e.detail.value
    const poi = this.data.poiList[index]
    let latitude = parseFloat(poi.latitude)
    let longitude = parseFloat(poi.longitude)

    this.mapCtx.moveToLocation({
      latitude,
      longitude,
      success(res) {
        console.log('移动成功', res);
      },
      fail(err) {
        console.error('移动失败', err);
      }
    })
    this.setData({
      index
    });
  },
  getAroundByLocation(longitude, latitude) {
    explore({
      longitude,
      latitude
    }).then(res => {
      let poiList = res
      // let poiList = res.map(item => {
      //   // 解析经纬度
      //   const [longitude, latitude] = item.location.split(',').map(Number);
      //   // 拼接完整地址
      //   const fullAddress = `${item.pname}${item.cityname}${item.address}`;
      //   // 返回转换后的对象
      //   return {
      //     address: fullAddress,
      //     latitude: latitude,
      //     longitude: longitude,
      //     name: item.name
      //   };
      // })

      let poi = wx.getStorageSync('poi')
      if(poi){
        let index = poiList.findIndex(item=>item.name === poi.name)
        if(index === -1){
          poiList.unshift(poi)
        }
      }
      wx.removeStorage({
        key: 'poi',
      })
      this.setData({
        poiList
      })
      if (Array.isArray(res) && res.length > 0) {
        wx.setStorageSync('city', res[0].city)
      }
    })
  },
  //确认选点
  choosePoi() {
    console.log(this.data.poiList[this.data.index])
    wx.setStorageSync('poi', this.data.poiList[this.data.index])
    wx.navigateBack()
  },
  onLocation() {
    let latitude = wx.getStorageSync('latitude')
    let longitude = wx.getStorageSync('longitude')
    this.mapCtx.moveToLocation({
      latitude: latitude,
      longitude: longitude
    })
  },
  onRegionChange(e) {
    // 处理标记点弹跳动画：拖动地图结束时显示动画
    if (e.causedBy === 'drag' && e.type === 'end') {
      // 触发弹跳动画
      this.setData({
        markerBounce: true
      });
      // 动画结束后重置状态
      setTimeout(() => {
        this.setData({
          markerBounce: false
        });
      }, 600); // 动画持续时间
    }

    if (e.detail.centerLocation) {
      if (e.type === 'end' && e.causedBy === 'drag') {
        let latitude = e.detail.centerLocation.latitude
        let longitude = e.detail.centerLocation.longitude
        this.getAroundByLocation(longitude, latitude)
      }
    }
  },
  //打开搜索poi的组件
  openSearchPOI() {
    wx.navigateTo({
      url: '/pages/search/search/search',
    })
  },
  navBack() {
    wx.navigateBack()
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

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