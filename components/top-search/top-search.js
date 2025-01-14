// components/top-search/top-search.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    rect: {
      type: Object,
      value: {}
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    topAddress: '搜索附近小区',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onChooseLocation() {
      const that = this
      wx.chooseLocation({
        success: (res) => {
          const {
            latitude,
            longitude,
            name
          } = res
          this.triggerEvent('onChooseLocation', res)
        }
      });
    },
  }
})