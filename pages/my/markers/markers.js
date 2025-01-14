import {
  getMyMarkerList
} from '../../../utils/apis'

var app = getApp();
Page({
  data: {
    list: [], // 存储数据的数组
    hasMore: true, // 是否有更多数据
    loading: false, // 是否正在加载中
    page: 0, // 当前页数
    deleted: 0,
    typeList: ['楼号', '出入口', '公厕', '维修点', '换电站', '外卖柜', '生活类', '道路', '围墙'],
    visible: false
  },
  onLoad: function (options) {
    this.data.deleted = options.deleted
    if (options.deleted === '0') {
      wx.setNavigationBarTitle({
        title: '我的标记',
      })
    } else {
      wx.setNavigationBarTitle({
        title: '被删除',
      })
    }
    this.loadData();
  },
  loadData: function () {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ loading: true });
    // 模拟数据请求，实际开发中应使用网络请求
    let param = {
      userId: wx.getStorageSync('userId'),
      pageIndex: this.data.page,
      deleted: this.data.deleted
    }
    const that = this
    getMyMarkerList(param).then(res => {
      let newList = JSON.parse(res)
      newList = newList.map(item => {
        return {
          ...item,
          typeName: that.data.typeList[item.type]
        };
      });
      if (newList.length > 0) {
        that.setData({
          list: [...this.data.list, ...newList],
          page: this.data.page + 1,
          loading: false
        });
      } else {
        this.setData({ hasMore: false, loading: false });
      }
    })
  },
  onMarkerTap(event) {
    const { item } = event.currentTarget.dataset
    this.setData({
      item
    })
  },
  onVisibleChange(e) {
    this.setData({
      visible: e.detail.visible
    })
  },
  onClose() {
    this.setData({
      visible: false
    })
  },
  // 页面滚动时触发
  onReachBottom: function () {
    this.loadData(); // 下拉加载更多数据
  }
})
